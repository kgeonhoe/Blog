---
title: "Silver Layer — 심볼별 조회 성능 문제와 이중 파티션 해결책"
categories:
  - "[[Projects]]"
  - "[[stock-platform]]"
tags:
  - stock-platform
  - duckdb
  - performance
  - silver-layer
draft: false
created: "2026-06-21"
updated: "2026-06-21"
---
# Silver Layer — 심볼별 조회 성능 문제와 이중 파티션 해결책

> 작성일: 2026-06-15

---

## 문제: 날짜 파티션 Silver는 심볼 조회에 불리하다

### 현재 Silver 저장 구조

```
stockdata/silver/
└── exchange=NASDAQ/
    ├── date=2024-01-01/data.parquet   ← NASDAQ 전체 심볼 (~3,900개) × 30+ 컬럼
    ├── date=2024-01-02/data.parquet
    └── ...
    └── date=2025-12-31/data.parquet   ← 1,260 거래일 × 파일 1개
```

이 구조는 **스크리닝** (특정 날짜에 모든 종목의 지표를 비교) 에는 최적이지만,
**백테스팅 / 차트** (특정 종목의 전체 기간 지표를 시계열로 조회) 에는 근본적인 문제가 있다.

### 심볼별 조회 시 발생하는 문제

`AAPL` 5년치 지표를 읽는 경우:

```
필요한 작업:
  1,260 거래일 × MinIO GET 요청     → 1,260번 네트워크 왕복
  1,260 거래일 × parquet 다운로드   → 파일당 전체 심볼(~3,900행) 읽기 후 1행만 사용
  1,260 거래일 × 메모리 필터        → WHERE symbol = 'AAPL'

예상 소요 시간 (LAN 기준, 파일당 ~1MB):
  네트워크 레이턴시  : 1,260 × 10ms = 12.6초
  데이터 전송       : 1,260 × 1MB  = 1.2GB 다운로드 (실제 필요 데이터: ~400KB)
  총 예상 소요      : 30초 ~ 2분
```

DuckDB의 hive partition pruning은 `date=*` 필터 시 날짜 폴더를 skip할 수 있지만,
**`symbol` 필터는 파티션 키가 아니므로** 모든 날짜 파일을 열어야 한다.

### 조회 패턴별 성능 비교

| 조회 패턴 | 날짜 파티션 Silver | 심볼 파티션 Silver |
|---|---|---|
| 특정 날짜 전체 심볼 스크리닝 | ✅ 파일 1개, O(1) | ❌ 심볼 수만큼 파일 읽기 |
| 특정 심볼 전체 기간 시계열 | ❌ 날짜 수만큼 파일 읽기 | ✅ 파일 1개, O(1) |
| 날짜 범위 + 심볼 필터 | ❌ 범위 내 모든 파일 스캔 | ✅ 파일 1개 후 날짜 필터 |
| 특정 날짜 특정 심볼 | ✅ 파일 1개 후 행 필터 | ✅ 파일 1개 후 행 필터 |

---

## 해결책: 이중 파티션 (Dual Partition) 유지

두 파티션을 **동시에** 유지하여 조회 패턴에 따라 최적 경로를 선택한다.

### 추가된 Silver 구조

```
stockdata/silver_by_symbol/
└── exchange=NASDAQ/
    ├── symbol=AAPL/indicators.parquet    ← AAPL 전체 기간 지표 (시계열)
    ├── symbol=MSFT/indicators.parquet
    └── ...
    └── symbol=TSLA/indicators.parquet    ← 심볼당 파일 1개
```

### 최종 MinIO 경로 체계

```
stockdata/
├── bronze/
│   └── exchange={EX}/symbol={SYM}/ohlcv.parquet          (Raw OHLCV)
│
├── silver/
│   └── exchange={EX}/date={DATE}/data.parquet             (스크리닝용)
│
└── silver_by_symbol/
    └── exchange={EX}/symbol={SYM}/indicators.parquet      (백테스팅/차트용)
```

### 사용 기준

| 목적 | 사용 경로 |
|---|---|
| 당일 스크리닝 (RSI < 30인 종목 찾기) | `silver/exchange=NASDAQ/date=2024-01-01/` |
| 백테스팅 (AAPL 5년 MACD 시뮬레이션) | `silver_by_symbol/exchange=NASDAQ/symbol=AAPL/` |
| 차트 (종목 상세 페이지) | `silver_by_symbol/exchange=NASDAQ/symbol=AAPL/` |
| 날짜 범위 스크리닝 | `silver/` glob + 날짜 pruning |

---

## 구현 세부사항

### 저장 함수 (`common/silver_storage.py`)

```python
save_silver_by_date(df, exchange, date)
    # 날짜 파티션 덮어쓰기 — 스크리닝용
    # 경로: stockdata/silver/exchange={EX}/date={DATE}/data.parquet

overwrite_silver_by_symbol(df, exchange, symbol)
    # 심볼 파티션 전체 이력 저장 — indicator_backfill에서 사용
    # date 기준 중복 제거 + 날짜순 정렬 후 저장

upsert_silver_by_symbol(df_new, exchange, symbol)
    # 심볼 파티션에 날짜 단위 upsert — daily asset에서 사용
    # 기존 파일의 겹치는 날짜를 제거하고 새 데이터 추가 (멱등성 보장)

bulk_upsert_silver_by_symbol(df_all, exchange, workers=10)
    # daily asset 결과(전체 심볼 혼합 DataFrame)를 심볼별 분리 후 병렬 upsert
```

### 각 Asset의 저장 동작

| Asset | 날짜 파티션 | 심볼 파티션 |
|---|---|---|
| `indicator_backfill` | `save_silver_by_date` (batch merge) | `overwrite_silver_by_symbol` (Phase 2 별도 실행) |
| `technical_indicators` (NASDAQ daily) | `save_silver_by_date` | `bulk_upsert_silver_by_symbol` |
| `krx_technical_indicators` (KRX daily) | `save_silver_by_date` | `bulk_upsert_silver_by_symbol` |

### indicator_backfill 2-Phase 설계 (NAS 연결 포화 방지)

심볼별 저장을 compute 루프 **안에서** 호출하면 NAS에 동시 요청이 쌓인다:

```
[잘못된 방식 — 동시 요청 4개]
스레드 1  : Bronze 읽기  → NAS 요청
스레드 2  : Bronze 읽기  → NAS 요청
스레드 3  : Bronze 읽기  → NAS 요청
메인 스레드: Silver 쓰기  → NAS 요청  ← compute 중에 동시 실행
결과: Connection refused (NAS 연결 포화)
```

해결책 — compute와 저장을 시간적으로 분리:

```
Phase 1 (INDICATOR_WORKERS=3)
  Bronze 읽기 + 지표 계산만 담당
  결과를 batch_frames에 쌓아두고 저장은 하지 않음
  → NAS 동시 요청 최대 3개

Phase 2 (compute executor 완전 종료 후)
  batch_frames → concat → symbol groupby → Silver 쓰기 (workers=5)
  → compute와 시간 겹침 없음, NAS 요청 최대 5개
```

### indicator_backfill 메모리 관리

배치 1개(200 심볼 × 1,260일 × 30 컬럼) 기준:

```
[1안 — batch_symbol_dfs 별도 보관 (폐기)]
  batch_frames     : 72MB  (날짜별 그룹, 상시 유지)
  batch_symbol_dfs : 72MB  (심볼별 복사본, 상시 유지)
  상시 피크        : 144MB  ← 같은 데이터 이중 보관

[2안 — batch_frames 재활용 (현재 구현)]
  batch_frames     : 72MB  (날짜별 그룹)
  all_batch(임시)  : 72MB  (Phase 2 에서 잠깐 concat, 이후 GC)
  실질 피크        : 72MB  (Phase 1) → 144MB (Phase 2 순간) → 72MB
```

`INDICATOR_BATCH_SIZE` 가 메모리 조절 핵심 파라미터:

| INDICATOR_BATCH_SIZE | Phase 1 피크 | Phase 2 피크 |
|---|---|---|
| 200 (기본값) | ~72MB | ~144MB |
| 100 | ~36MB | ~72MB |
| 50 | ~18MB | ~36MB |

메모리가 부족한 환경이면 `backfill_assets.py` 상단의 값을 낮춘다:
```python
INDICATOR_BATCH_SIZE = 100  # 기본값 200 → 메모리 절반
```

### daily asset 심볼별 upsert 오버헤드

daily asset은 이미 심볼당 bronze 파일 1개를 읽으므로,
심볼별 silver upsert 추가 시 N reads + N writes가 더해진다.

```
NASDAQ 3,900 심볼 × (read 20ms + write 30ms) ÷ 10 workers ≈ 19.5초 추가
KRX    4,100 심볼 × (read 20ms + write 30ms) ÷ 10 workers ≈ 20.5초 추가
```

daily 수집 주기(하루 1회)에서 허용 가능한 수준이다.

---

## DuckDB 쿼리 예시

### 심볼별 전체 기간 조회 (백테스팅 / 차트)

```sql
-- AAPL 전체 RSI + MACD 시계열 (파일 1개 읽기)
SELECT date, close, rsi, macd, macd_signal
FROM read_parquet('s3://stock-data/stockdata/silver_by_symbol/exchange=NASDAQ/symbol=AAPL/indicators.parquet')
ORDER BY date;
```

### 날짜별 스크리닝 (기존 경로, 변경 없음)

```sql
-- 특정 날짜 RSI 과매도 종목 (파일 1개 읽기)
SELECT symbol, close, rsi
FROM read_parquet('s3://stock-data/stockdata/silver/exchange=NASDAQ/date=2024-01-15/data.parquet')
WHERE rsi < 30
ORDER BY rsi;
```

### DuckDB VIEW 추가 권장 (setup.sql)

```sql
CREATE OR REPLACE VIEW silver_nasdaq AS
SELECT * FROM read_parquet(
    's3://stock-data/stockdata/silver/exchange=NASDAQ/date=*/data.parquet',
    hive_partitioning = true
);

CREATE OR REPLACE VIEW silver_nasdaq_by_symbol AS
SELECT * FROM read_parquet(
    's3://stock-data/stockdata/silver_by_symbol/exchange=NASDAQ/symbol=*/indicators.parquet',
    hive_partitioning = true
);
```

---

---

## 파티션 설계 방법론 — 업계 비교

"날짜 파티션 데이터를 심볼 기준으로 효율적으로 조회"하는 문제는 데이터 레이크의 고전적인 파티션 설계 문제다.

### 1. 이중 파티션 (Dual Partitioning) — 현재 선택

같은 데이터를 두 가지 파티션으로 이중 저장.

```
silver/date={DATE}/            ← 스크리닝용
silver_by_symbol/symbol={SYM}/ ← 백테스팅용
```

- **장점**: 두 조회 패턴 모두 O(1), 구현 단순
- **단점**: 저장 용량 2배, 파이프라인에 이중 저장 로직 필요

### 2. Columnar Row Group Sorting

Parquet은 Row Group 단위로 min/max 통계를 보유한다. 파일 내부를 `symbol` 기준으로 정렬하면 DuckDB가 Row Group을 skip할 수 있다.

```python
df.sort_values(["symbol", "date"]).to_parquet(...)
```

- **한계**: 날짜 파티션 파일이 1,260개인 것 자체는 해결 안 됨. 파일 수를 줄이지는 못한다.

### 3. Z-Ordering (Data Skipping)

Delta Lake / Databricks의 기법. `date`와 `symbol` 두 컬럼을 동시에 기준으로 파일을 물리적으로 재배치.

```sql
OPTIMIZE silver ZORDER BY (symbol, date)
```

단일 파티션 키 대신 다차원 클러스터링으로 어느 방향으로 조회해도 파일 skip이 가능하다.

- **한계**: Delta Lake 엔진 필요. 순수 Parquet + DuckDB 환경에서는 불가.

### 4. Materialized View / Pre-aggregation (Gold Layer)

조회 시점에 계산하는 대신 미리 결과를 만들어둔다. Apache Hudi, Apache Iceberg의 Incremental Processing이 이 패턴을 자동화한다. 현재 `silver_by_symbol`이 사실상 이 역할을 한다.

- **한계**: Hudi/Iceberg 도입은 소규모 NAS 환경에 오버엔지니어링.

### 5. Transpose Job (Repartition / Compaction)

파이프라인 저장은 날짜 파티션만 하고, 주기적 배치로 심볼 파티션을 재편성.

```
매일  : silver/date=*/ 에 저장
주 1회: silver/date=*/ 전체 읽기 → silver_by_symbol/ 재편성
```

- **장점**: 파이프라인 단순 (쓸 때는 날짜만)
- **단점**: 심볼 파티션이 최대 1주일 지연됨

### 현재 시스템의 선택 근거

| 방법 | 적합성 |
|---|---|
| 이중 파티션 | ✅ 선택 — DuckDB+MinIO 환경에서 가장 단순하고 효과적 |
| Row Group Sorting | 🔶 보조 수단으로 병행 가능 |
| Z-Ordering | ❌ Delta Lake 엔진 없음 |
| Hudi / Iceberg | ❌ 소규모 NAS 환경에 오버엔지니어링 |
| Transpose Job | 🔶 daily asset 부하 문제 시 대안으로 고려 |

현재 규모(KRX ~4,100 + NASDAQ ~3,900 심볼, 5년치)에서는 이중 파티션이 가장 적합하다.

---

## 관련 파일

| 파일 | 역할 |
|---|---|
| `common/silver_storage.py` | Silver 저장 유틸리티 (날짜 / 심볼 파티션) |
| `dagster_project/assets/backfill_assets.py` | `indicator_backfill` — 두 파티션 동시 저장 |
| `dagster_project/assets/indicators_assets.py` | NASDAQ daily — 두 파티션 동시 저장 |
| `dagster_project/assets/krx_indicators_assets.py` | KRX daily — 두 파티션 동시 저장 |
| `duckdb_ui/setup.sql` | DuckDB VIEW 정의 (silver_by_symbol 추가 권장) |
