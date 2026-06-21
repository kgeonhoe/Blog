---
title: "Backfill Asset vs Daily Partition — 설계 결정"
categories:
  - "[[Projects]]"
  - "[[stock-platform]]"
tags:
  - stock-platform
  - dagster
  - partition
  - backfill
draft: false
created: "2026-06-21"
updated: "2026-06-21"
---
# Backfill Asset vs Daily Partition — 설계 결정

## 배경

주식 OHLCV 데이터 파이프라인을 설계할 때, 과거 데이터 수집(백필)을 위해
Dagster의 **Daily Partition**을 그대로 활용하는 방법과
**별도 Backfill Asset**을 분리하는 방법 사이에서 선택을 해야 했다.

---

## Daily Partition 방식의 문제점

Dagster Daily Partition은 날짜별로 파티션을 생성하고, 각 파티션마다 독립 run을 트리거한다.
증분 수집(매일 오늘 데이터만 추가)에는 적합하지만, **전체 기간 백필에는 심각한 비효율이 발생한다.**

### 문제 1 — API 호출 폭발

```
5년치(1,260 거래일) × 2,700 심볼 = 3,402,000번 FDR 단일 날짜 요청
fdr.DataReader("005930", "2020-01-01", "2020-01-01")  ← 하루치 1행
fdr.DataReader("005930", "2020-01-02", "2020-01-02")  ← 하루치 1행
...
```

FDR(FinanceDataReader)은 날짜 범위로 한 번에 전체 이력을 반환하는 API를 지원한다.
Daily Partition 구조에서는 이 장점을 전혀 살릴 수 없다.

### 문제 2 — Dagster 인프라 부하

수천 개 파티션을 동시에 enqueue하면:
- Dagster Daemon의 스케줄러 큐 과부하
- PostgreSQL 상태 DB에 수천 개 run record 생성
- 웹 UI 응답 저하

### 문제 3 — 재실행 복잡성

날짜별 파티션 성공/실패 상태를 수천 개 단위로 관리해야 하며,
일부 날짜 재수집 시 개별 파티션을 하나씩 선택해야 한다.

---

## Backfill Asset 별도 분리

```
fdr.DataReader("005930", "2020-01-01", "2026-06-06")  ← 전체 이력 1번 요청
```

### 효율 비교

| 방식 | 5년치 KRX 요청 수 | 비고 |
|------|-----------------|------|
| Daily Partition 백필 | 3,402,000번 | 심볼 × 거래일 |
| Backfill Asset | 2,700번 | 심볼당 1번 (range) |
| **절감** | **약 1,260배** | |

### 구현 방식

```python
class ExchangeBackfillConfig(Config):
    symbols: List[str] = []     # 빈 경우 전체 심볼
    start_date: str = ""        # 빈 경우 1980-01-01
    end_date: str = ""          # 빈 경우 오늘

@asset(group_name="backfill")
def kospi_backfill(config: ExchangeBackfillConfig, kospi_symbols: List[str]):
    # fdr.DataReader(sym, start, end) — range 1번 호출
    # overwrite_bronze() — 심볼별 전체 이력 덮어쓰기
```

- Dagster **Launch Pad**에서 start_date / end_date 자유 지정
- `overwrite_bronze()`로 멱등성 보장 (중복 실행 안전)
- ThreadPoolExecutor로 병렬 수집

---

## 최종 아키텍처

```
Daily OHLCV asset  →  매일 스케줄 실행  →  오늘 데이터 증분 append
Backfill asset     →  온디맨드 실행     →  초기 적재 / 특정 기간 재수집
```

**관심사 분리 원칙:**
- Daily asset은 "오늘 데이터만" 빠르게 수집하는 역할
- Backfill asset은 "원하는 기간 전체"를 효율적으로 수집하는 역할

---

## 관련 파일

- `dagster_project/assets/backfill_assets.py` — 구현
- `dagster_project/assets/krx_assets.py` — Daily OHLCV 구현
- `common/bronze_storage.py` — append_to_bronze / overwrite_bronze
