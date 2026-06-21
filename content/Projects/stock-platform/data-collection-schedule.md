---
title: "데이터 수집 스케줄 설계"
categories:
  - "[[Projects]]"
  - "[[stock-platform]]"
tags:
  - stock-platform
  - dagster
  - schedule
  - data-collection
draft: false
created: "2026-06-21"
updated: "2026-06-21"
---

# 데이터 수집 스케줄 설계

> 작성: 2026-06-06 | 관련 파일: `dagster_project/schedules/daily_schedules.py`

---

## 왜 거래소마다 스케줄이 다른가

주식 데이터는 **장 마감 후**에야 확정된 OHLCV가 확보된다.
KRX와 NASDAQ은 장 운영 시간대가 완전히 달라서 단일 스케줄로는 둘 다 커버할 수 없다.

---

## 거래소별 장 운영 시간 (KST 기준)

### KRX (KOSPI / KOSDAQ)
| 구분 | 시간 (KST) |
|------|-----------|
| 장 시작 | 09:00 |
| 장 마감 | 15:30 |
| 데이터 수집 | **16:00 KST** (UTC 07:00) |

- 서머타임 없음 — 연중 고정
- 주 5일 (월~금), 한국 공휴일 휴장

### NASDAQ (NYSE 포함 미국 증시)
| 구분 | 시간 (KST) | UTC |
|------|-----------|-----|
| 장 시작 | 23:30 KST (전날) | 14:30 |
| 장 마감 (EDT, 서머타임) | **05:00 KST** | 20:00 |
| 장 마감 (EST, 겨울) | **06:00 KST** | 21:00 |
| 데이터 수집 | **07:30 KST** | 22:30 |

- 서머타임 있음 — 3월 두 번째 일요일 ~ 11월 첫 번째 일요일
  - EDT(UTC-4): 장 마감 20:00 UTC = KST 05:00
  - EST(UTC-5): 장 마감 21:00 UTC = KST 06:00
- 22:30 UTC 수집은 두 케이스 모두 커버

---

## 수집 스케줄 구성

```
KRX 수집:     매일 UTC 07:00  (KST 16:00, 장 마감 30분 후)
NASDAQ 수집:  매일 UTC 22:30  (KST 07:30, 장 마감 1~2시간 후)
```

### Cron 표현식

```cron
0 7 * * 1-5    # KRX    — UTC 07:00, 월~금
30 22 * * 1-5  # NASDAQ — UTC 22:30, 월~금
```

> **NASDAQ 요일 주의:** UTC 22:30 월요일 = 월요일 장 데이터 (4PM ET 마감 후).
> 수집 날짜(`collect_date`)는 UTC 기준 당일 날짜를 사용하므로 정확히 일치.

---

## 수집 방식

두 스케줄 모두 `ohlcv_backfill` 자산을 **append 모드**로 실행한다.

```python
# KRX 스케줄 config
{
    "start_date": "오늘(UTC)",
    "end_date": "오늘(UTC)",
    "mode": "append",     # 기존 데이터에 오늘 행 추가
    "exchange": "KRX",    # KOSPI + KOSDAQ
}

# NASDAQ 스케줄 config
{
    "start_date": "오늘(UTC)",
    "end_date": "오늘(UTC)",
    "mode": "append",
    "exchange": "NASDAQ",
}
```

### append vs overwrite

| | append (스케줄) | overwrite (수동 백필) |
|--|----------------|----------------------|
| 용도 | 매일 증분 수집 | 초기 적재 / 재수집 |
| 동작 | 오늘 행만 추가 | 심볼 전체 이력 교체 |
| 위험 | 없음 | 누적 이력 소멸 가능 |

> overwrite를 스케줄에 쓰면: `start=오늘, end=오늘`로 수집한 1행이 해당 심볼의 parquet 전체를 덮어써 수년치 이력 소멸.

---

## 심볼별 상장일 기반 수집 시작일

각 심볼의 수집 start date는 listing 메타데이터에서 조회한 실제 상장일을 사용한다.

```
KRX    → fdr.StockListing()의 ListingDate  (예: "2002-04-23", 정확한 날짜)
NASDAQ → fdr.StockListing()의 IPOYear      (예: 2010 → "2010-01-01", 연도 단위)
```

`sym_start = max(config.start_date, listing_date)` 로 IPO 이전 구간 요청을 방지한다.

> NASDAQ IPOYear는 연도만 제공 (NASDAQ 공개 API 한계). 정확한 날짜는 yfinance `.info['firstTradeDateEpochUtc']`로 개별 조회 가능하나 3,000+ 심볼 일괄 조회 시 rate limit 발생으로 미적용.

---

## 수집 결과 확인

매 수집 후 audit log가 MinIO에 저장된다.

```
stockdata/audit/exchange={KRX|NASDAQ}/date={YYYY-MM-DD}/result.parquet
컬럼: symbol, exchange, date, status, rows, collected_at
```

### DuckDB 조회

```sql
-- 오늘 KRX 수집 현황
SELECT status, COUNT(*) FROM read_parquet(
  's3://stockbucket/stockdata/audit/exchange=KOSPI/date=2024-01-15/*.parquet'
) GROUP BY status;

-- NASDAQ 실패 심볼 확인
SELECT symbol FROM read_parquet(
  's3://stockbucket/stockdata/audit/exchange=NASDAQ/date=2024-01-15/*.parquet'
) WHERE status = 'failed';
```

---

## 주의사항

### 서머타임 전환 주의
미국 서머타임 전환 시점(3월, 11월)에는 장 마감 시각이 UTC 기준 1시간 변경된다.
22:30 UTC 수집은 EDT(20:00 UTC)와 EST(21:00 UTC) 모두 여유 있게 커버하므로 별도 조정 불필요.

### 공휴일 처리
현재 스케줄은 공휴일을 감지하지 않는다. 공휴일 당일 수집 시 빈 데이터로 audit log에 `status=failed` 기록됨. 이는 정상 동작이며 이후 backfill로 보정 가능.

### KRX vs NASDAQ 날짜 불일치
KRX 수집 날짜: UTC 기준 당일 = KST 당일 ✓
NASDAQ 수집 날짜: UTC 기준 당일 = 미국 현지 당일 ✓ (UTC 22:30은 미국 기준 당일)

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `dagster_project/schedules/daily_schedules.py` | 스케줄 정의 |
| `dagster_project/jobs/collection_jobs.py` | `daily_collect_job` 정의 |
| `dagster_project/assets/backfill_assets.py` | 수집 실행 로직, audit log, mode 분기 |
| `dagster_project/assets/AGENTS.md` | 아키텍처 결정 기록 |
