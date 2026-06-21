---
title: "DuckDB 아키텍처 결정 기록"
categories:
  - "[[Projects]]"
  - "[[stock-platform]]"
tags:
  - stock-platform
  - duckdb
  - architecture
  - decision-record
draft: false
created: "2026-06-21"
updated: "2026-06-21"
---
# DuckDB 아키텍처 결정 기록

> **작성**: 2026-06-11  
> **관련 파일**: `duckdb_ui/setup.sql`, `duckdb_ui/start_ui.ps1`, `duckdb_ui/stock.duckdb`

---

## 핵심 원칙

**DuckDB는 조회 엔진이다. 데이터 저장소가 아니다.**

모든 데이터는 MinIO(Parquet)에 있고, DuckDB는 그 위에서 SQL을 실행한다.

```
MinIO (stock-data 버킷)          DuckDB
┌────────────────────────┐      ┌──────────────────────┐
│ stockdata/bronze/      │ ←읽기── bronze.ohlcv (VIEW) │
│ stockdata/silver/      │ ←읽기── silver.indicators    │
│ stockdata/gold/        │      │                      │
└────────────────────────┘      └──────────────────────┘
         ↑ 쓰기는 Dagster만
```

---

## 왜 Spark 대신 DuckDB인가

| 항목 | DuckDB | Spark |
|------|--------|-------|
| 인프라 | 없음 (단일 바이너리) | 클러스터 or Docker 다수 |
| 현재 데이터 규모 | Bronze ~930만 행, Silver ~930만 행 | 수십억 행부터 효율 |
| 쿼리 속도 (수백만 행) | 수초 이내 (컬럼형 vectorized) | JVM 기동 + 분산 오버헤드로 오히려 느림 |
| 설정 복잡도 | setup.sql 한 파일 | Spark 설정, YARN/K8s, 드라이버 메모리 등 |
| MinIO 연동 | httpfs extension 한 줄 | hadoop-aws, s3a:// 설정 다수 |
| 백테스팅 연동 | `duckdb.connect()` Python 한 줄 | SparkSession 생성 + 설정 |

**결론**: 현재 규모(수백만~수천만 행)에서 Spark는 인프라 비용이 쿼리 이점보다 크다.  
Spark는 Phase B(Gold layer, 수십억 행 이상)에서 재검토한다.

---

## 데이터는 MinIO Parquet, DuckDB는 읽기 전용

### 데이터 저장 구조 (Hive partitioning)

```
MinIO: stock-data 버킷
├── stockdata/bronze/exchange=KOSPI/symbol=005930/ohlcv.parquet
├── stockdata/bronze/exchange=KOSDAQ/symbol=035720/ohlcv.parquet
├── stockdata/bronze/exchange=NASDAQ/symbol=AAPL/ohlcv.parquet
├── stockdata/silver/exchange=KOSPI/date=2024-01-15/data.parquet
├── stockdata/silver/exchange=KOSDAQ/date=2024-01-15/data.parquet
└── stockdata/silver/exchange=NASDAQ/date=2024-01-15/data.parquet
```

### 쓰기 주체: Dagster만

| Asset | 쓰기 대상 |
|-------|---------|
| `kospi_backfill` / `kosdaq_backfill` / `nasdaq_backfill` | Bronze |
| `indicator_backfill` | Silver |
| `technical_indicators` / `krx_technical_indicators` | Silver |

DuckDB는 이 파일들을 **읽기만** 한다. DuckDB가 MinIO에 쓰는 경우는 없다.

### DuckDB VIEW = MinIO 경로의 별칭

```sql
-- 이것이 silver.indicators의 실체
SELECT * FROM read_parquet(
    's3://stock-data/stockdata/silver/**/*.parquet',
    union_by_name    = true,
    hive_partitioning = true   -- exchange, date 경로 → 컬럼 자동 파싱
);
```

새 Parquet 파일이 MinIO에 추가되면 VIEW 재정의 없이 자동으로 포함된다.

---

## stock.duckdb 파일의 역할

### 저장 내용

| 항목 | 내용 |
|------|------|
| `PERSISTENT SECRET minio` | MinIO 접속 정보 (key, endpoint) |
| `VIEW` 정의들 | `bronze.ohlcv`, `silver.indicators` 등 |
| **실제 데이터** | **없음** |

### stock.duckdb를 데이터 저장소로 쓰지 않는 이유: 디스크 락

DuckDB 파일은 **동시 쓰기 불가** 구조다.

```
시나리오: UI 열려있는 상태에서 백테스팅 실행

DuckDB UI (stock.duckdb 점유 중)
    + 백테스팅 스크립트 (stock.duckdb 접근 시도)
    → TransactionException: database is locked
```

데이터를 stock.duckdb에 넣었다면:
- Dagster가 데이터를 쓸 때 UI가 열려 있으면 실패
- 백테스팅과 UI를 동시에 실행 불가
- 여러 분석 스크립트 동시 실행 불가

MinIO Parquet에 데이터를 두면 이 문제가 없다.  
여러 DuckDB 인스턴스가 동시에 같은 Parquet 파일을 읽을 수 있다.

---

## 백테스팅에서 DuckDB 사용법

stock.duckdb를 사용하지 않고 **in-memory 인스턴스**를 만들어 setup.sql만 적용한다.

```python
import duckdb

# stock.duckdb 파일 접근 없음 → UI와 충돌 없음
con = duckdb.connect()  # in-memory

with open("duckdb_ui/setup.sql") as f:
    con.execute(f.read())

# 이후 모든 VIEW 사용 가능
df = con.execute("""
    SELECT symbol, date, close, ema_20, ema_448, macd
    FROM silver.indicators
    WHERE exchange = 'KOSPI'
      AND date BETWEEN '2023-01-01' AND '2023-12-31'
    ORDER BY symbol, date
""").df()
```

- UI와 동시에 실행 가능
- 여러 백테스팅 프로세스 동시 실행 가능
- MinIO의 최신 데이터를 항상 읽음

---

## 등록된 Schema와 VIEW 목록

```
bronze 스키마
├── bronze.ohlcv             -- 전체 OHLCV (KOSPI + KOSDAQ + NASDAQ)
├── bronze.ohlcv_kospi       -- KOSPI 필터
├── bronze.ohlcv_kosdaq      -- KOSDAQ 필터
└── bronze.ohlcv_nasdaq      -- NASDAQ 필터

silver 스키마
├── silver.indicators        -- 기술적 지표 전체 (EMA-448 등)
├── silver.indicators_kospi
├── silver.indicators_kosdaq
└── silver.indicators_nasdaq

유틸리티 VIEW
├── bronze_files             -- MinIO bronze 파일 목록
└── silver_files             -- MinIO silver 파일 목록

하위 호환 (기존 쿼리 유지)
├── ohlcv_bronze
├── ohlcv_bronze_kospi / ohlcv_bronze_kosdaq / ohlcv_bronze_nasdaq
└── silver_indicators
```

---

## 관련 문서

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — 전체 시스템 구조
- [`backfill-vs-daily-partition.md`](backfill-vs-daily-partition.md) — Bronze 적재 전략
- [`duckdb_ui/setup.sql`](../duckdb_ui/setup.sql) — VIEW 정의 원본
