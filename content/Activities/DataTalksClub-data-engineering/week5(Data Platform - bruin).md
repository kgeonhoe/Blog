---
categories:
  - "[[Courses]]"
platform:
instructor:
url:
created: "2026-03-10"
start:
end:
rating:
topics: []
tags:
  - course
draft: false
---
# Bruin 데이터 플랫폼 가이드
---

## Bruin이란?
- webserver 를 통한 ui 를 볼수없는 단점이 있다 
- 스케줄러 관리는 cli로 해야함 
- 
Bruin은 **엔드투엔드 데이터 플랫폼**으로, 다음 기능들을 단일 도구로 통합합니다:

-   **데이터 수집 (Ingestion)**: 소스에서 데이터 웨어하우스로 데이터 추출
-   **데이터 변환 (Transformation)**: 정제, 모델링, 집계
-   **오케스트레이션 (Orchestration)**: 스케줄링 및 의존성 관리
-   **데이터 품질 (Data Quality)**: 내장 검사 및 검증
-   **메타데이터 관리**: 리니지, 문서화

> **핵심 장점**: 5~6개의 개별 도구를 설정하는 대신, 코드 로직, 설정, 의존성, 품질 검사를 모두 한 곳에서 관리할 수 있습니다.

---

## Modern Data Stack

일반적인 데이터 스택의 구성 요소:

| 단계 | 설명 |
| --- | --- |
| **Extract/Ingest** | 서드파티 소스나 데이터베이스에서 데이터 웨어하우스/레이크로 추출 |
| **Transform** | 데이터 정제, 리포트 생성, 결과물을 웨어하우스/레이크로 전송 |
| **Orchestrate** | 스크립트와 서비스의 실행 시점, 방법, 통신 방법 제어 |
| **Data Quality** | 데이터의 정확성, 완전성, 일관성 보장 |

Bruin은 이 모든 것을 통합하여 DevOps, 데이터 인프라 엔지니어, 데이터 아키텍트 역할을 별도로 수행하지 않아도 파이프라인을 구축할 수 있게 합니다.

---

## 설치 및 시작하기

### CLI 설치

```
# Linux/Mac
curl -LsSf https://getbruin.com/install/cli | sh

# 설치 확인
bruin version
```

### VS Code/Cursor 확장 프로그램

Bruin 확장 프로그램을 설치하면 IDE에서 직접 에셋과 파이프라인을 실행할 수 있는 렌더 패널이 추가됩니다.

### Bruin MCP (AI Integration)

Bruin은 MCP(Model Context Protocol) 서버를 제공하여 Cursor, VS Code에서 AI 에이전트를 사용해 파이프라인을 생성할 수 있습니다.

### 프로젝트 초기화

```
# 템플릿으로 프로젝트 생성
bruin init default my-first-pipeline
cd my-first-pipeline

# zoomcamp 템플릿 사용
bruin init zoomcamp my-taxi-pipeline
```

> **참고**: Bruin은 프로젝트가 git으로 초기화되어 있어야 합니다. `bruin init` 명령이 자동으로 처리합니다.

---

## 핵심 개념

### 프로젝트 (Project)

프로젝트는 Bruin 데이터 파이프라인을 생성하는 **루트 디렉토리**입니다.

#### 프로젝트 구조

```
my-first-pipeline/
├── .bruin.yml              # 환경 및 연결 설정
├── pipeline.yml            # 파이프라인 이름, 스케줄, 기본 연결
└── assets/
    ├── players.asset.yml   # Ingestr 에셋 (데이터 수집)
    ├── player_stats.sql    # SQL 에셋 (품질 검사 포함)
    └── my_python_asset.py  # Python 에셋
```

#### `.bruin.yml` 파일

> ⚠️ **중요**: 이 파일은 자동으로 `.gitignore`에 추가됩니다. 데이터베이스 연결 및 시크릿이 포함되어 있으므로 **절대 레포지토리에 푸시하지 마세요**.

```
default_environment: default

environments:
  default:
    connections:
      duckdb:
        - name: duckdb-default
          path: duckdb.db
      motherduck:
        - name: motherduck
          token: <your-token>

  production:
    connections:
      bigquery:
        - name: bq-prod
          project: my-project
          dataset: production
```

**환경(Environment) 분리의 장점:**

-   프로덕션 자격 증명 노출 없이 로컬/서버에서 파이프라인 실행
-   팀별로 다른 연결 액세스 권한 설정
-   실수로 프로덕션 실행 방지

**지원되는 연결 타입:**

-   DuckDB, MotherDuck
-   PostgreSQL, MySQL
-   BigQuery, Redshift, Snowflake
-   커스텀 연결 (API 키, 시크릿 등)

---

### 파이프라인 (Pipeline)

파이프라인은 **실행 스케줄과 설정 요구사항**에 따라 에셋을 그룹화하는 메커니즘입니다.

#### 주요 특징

1.  **단일 스케줄**: 각 파이프라인은 하나의 스케줄을 가집니다 (`hourly`, `daily`, `monthly`, cron 표현식)
2.  **독립적인 폴더 구조**: 각 파이프라인은 자체 `pipeline.yml` 파일을 가집니다

```
project/
├── .bruin.yml
├── pipelines/
│   ├── nyc-taxi/
│   │   ├── pipeline.yml
│   │   └── assets/
│   └── another-pipeline/
│       ├── pipeline.yml
│       └── assets/
```

#### `pipeline.yml` 파일

```
name: nyc_taxi
schedule: monthly
start_date: "2019-01-01"
default_connections:
  duckdb: duckdb-default
variables:
  taxi_types:
    type: array
    items:
      type: string
    default: ["yellow"]
```

| 옵션 | 설명 |
| --- | --- |
| `name` | 파이프라인 식별자 |
| `schedule` | 실행 시점 (cron, daily, monthly 등) |
| `start_date` | 파이프라인 활성화 시작일 |
| `default_connections` | 사용할 연결 |
| `variables` | 커스텀 변수 |

**연결 스코핑의 장점:**

-   대규모 조직에서 팀별로 다른 자격 증명 사용 가능
-   불필요한 시크릿 노출 방지
-   특정 파이프라인 실행에 필요한 연결만 초기화
-   부서 간 보안 격리

---

### 에셋 (Assets)

에셋은 특정 작업을 수행하는 **단일 파일**로, 데이터베이스에 테이블/뷰를 생성하거나 업데이트합니다.

#### 에셋 타입

| 타입 | 설명 |
| --- | --- |
| **Python 에셋** | 데이터 처리를 위한 Python 스크립트 |
| **YAML Ingestor 에셋** | 내장 ingestor 사용, 소스/대상 정의 |
| **SQL 에셋** | 데이터베이스에 SQL 쿼리 실행 |
| **Seed 파일** | 로컬 CSV 파일을 데이터베이스에 수집 |

---

## NYC Taxi 파이프라인 예제

### 아키텍처

DuckDB를 로컬 데이터베이스로 사용하는 **3계층 파이프라인**:

```
┌─────────────────────────────────────────────────────────────┐
│                      Reports Layer                          │
│              (집계 및 계산 수행)                              │
│                trips_report.sql                             │
│                        ↑                                    │
├─────────────────────────────────────────────────────────────┤
│                     Staging Layer                           │
│         (전처리, 정제, 변환, 룩업 테이블 조인)                  │
│                    trips.sql                                │
│                      ↑    ↑                                 │
├─────────────────────────────────────────────────────────────┤
│                    Ingestion Layer                          │
│           (데이터 추출 및 원시 형식 저장)                      │
│              trips.py    payment_lookup.csv                 │
└─────────────────────────────────────────────────────────────┘
```

### 프로젝트 구조

```
zoomcamp/
├── .bruin.yml
├── README.md
└── pipeline/
    ├── pipeline.yml
    └── assets/
        ├── ingestion/
        │   ├── trips.py              # Python 에셋
        │   ├── requirements.txt
        │   ├── payment_lookup.asset.yml
        │   └── payment_lookup.csv    # Seed 파일
        ├── staging/
        │   └── trips.sql             # SQL 에셋
        └── reports/
            └── trips_report.sql      # SQL 에셋
```

### 1\. Ingestion Layer

#### Python 에셋: `trips.py`

```
"""@bruin
name: ingestion.trips
type: python
image: python:3.11

materialization:
  type: table
  strategy: append

columns:
  - name: pickup_datetime
    type: timestamp
    description: "When the meter was engaged"
  - name: dropoff_datetime
    type: timestamp
    description: "When the meter was disengaged"
@bruin"""

import os
import json
import pandas as pd

def materialize():
    start_date = os.environ["BRUIN_START_DATE"]
    end_date = os.environ["BRUIN_END_DATE"]
    taxi_types = json.loads(os.environ["BRUIN_VARS"]).get("taxi_types", ["yellow"])

    # NYC taxi API에서 데이터 추출
    # https://d37ci6vzurychx.cloudfront.net/trip-data/{taxi_type}_tripdata_{year}-{month}.parquet

    return final_dataframe
```

**특징:**

-   `materialize()` 함수가 DataFrame 반환 → Bruin이 대상에 삽입 처리
-   `append` 전략: 기존 행을 건드리지 않고 새 데이터 삽입
-   `BRUIN_START_DATE`/`BRUIN_END_DATE` 환경 변수로 시간 범위 지정
-   `BRUIN_VARS`로 파이프라인 변수 읽기

#### Seed 파일: `payment_lookup.asset.yml`

```
name: ingestion.payment_lookup
type: duckdb.seed
parameters:
  path: payment_lookup.csv
columns:
  - name: payment_type_id
    type: integer
    description: "Numeric code for payment type"
    primary_key: true
    checks:
      - name: not_null
      - name: unique
  - name: payment_type_name
    type: string
    description: "Human-readable payment type"
    checks:
      - name: not_null
```

`payment_lookup.csv`:

```
payment_type_id,payment_type_name
0,flex_fare
1,credit_card
2,cash
3,no_charge
4,dispute
5,unknown
6,voided_trip
```

#### `requirements.txt`

```
pandas
requests
pyarrow
python-dateutil
```

> Bruin이 환경을 관리하고 파이프라인 내에서 로컬로 의존성을 설치합니다.

---

### 2\. Staging Layer

#### SQL 에셋: `staging/trips.sql`

```
/* @bruin
name: staging.trips
type: duckdb.sql

depends:
  - ingestion.trips
  - ingestion.payment_lookup

materialization:
  type: table
  strategy: time_interval
  incremental_key: pickup_datetime
  time_granularity: timestamp

columns:
  - name: pickup_datetime
    type: timestamp
    primary_key: true
    checks:
      - name: not_null

custom_checks:
  - name: row_count_greater_than_zero
    query: |
      SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END
      FROM staging.trips
    value: 1
@bruin */

SELECT
    t.pickup_datetime,
    t.dropoff_datetime,
    t.pickup_location_id,
    t.dropoff_location_id,
    t.fare_amount,
    t.taxi_type,
    p.payment_type_name
FROM ingestion.trips t
LEFT JOIN ingestion.payment_lookup p
    ON t.payment_type = p.payment_type_id
WHERE t.pickup_datetime >= '{{ start_datetime }}'
  AND t.pickup_datetime < '{{ end_datetime }}'
QUALIFY ROW_NUMBER() OVER (
    PARTITION BY t.pickup_datetime, t.dropoff_datetime,
                 t.pickup_location_id, t.dropoff_location_id, t.fare_amount
    ORDER BY t.pickup_datetime
) = 1
```

**특징:**

-   `time_interval` 전략: 시간 범위 내 행 삭제 후 쿼리 결과 삽입
-   `WHERE` 절이 동일한 시간 범위로 필터링하여 중복 방지
-   `QUALIFY ROW_NUMBER()`로 복합 키 기반 중복 제거
-   `ingestion.trips`와 `ingestion.payment_lookup`에 대한 의존성으로 수집 후 실행 보장

---

### 3\. Reports Layer

#### SQL 에셋: `reports/trips_report.sql`

```
/* @bruin
name: reports.trips_report
type: duckdb.sql

depends:
  - staging.trips

materialization:
  type: table
  strategy: time_interval
  incremental_key: trip_date
  time_granularity: date

columns:
  - name: trip_date
    type: date
    primary_key: true
  - name: taxi_type
    type: string
    primary_key: true
  - name: payment_type
    type: string
    primary_key: true
  - name: trip_count
    type: bigint
    checks:
      - name: non_negative
@bruin */

SELECT
    CAST(pickup_datetime AS DATE) AS trip_date,
    taxi_type,
    payment_type_name AS payment_type,
    COUNT(*) AS trip_count,
    SUM(fare_amount) AS total_fare,
    AVG(fare_amount) AS avg_fare
FROM staging.trips
WHERE pickup_datetime >= '{{ start_datetime }}'
  AND pickup_datetime < '{{ end_datetime }}'
GROUP BY 1, 2, 3
```

---

### 파이프라인 실행

```
# 구조 및 정의 검증
bruin validate ./pipeline/pipeline.yml

# 테스트용 작은 날짜 범위로 실행
bruin run ./pipeline/pipeline.yml --start-date 2022-01-01 --end-date 2022-02-01

# 전체 새로고침
bruin run ./pipeline/pipeline.yml --full-refresh

# 결과 쿼리
bruin query --connection duckdb-default --query "SELECT COUNT(*) FROM ingestion.trips"
```

### 실행 순서

1.  **Ingestion 에셋** 먼저 실행 (trips + lookup, 병렬)
2.  **Staging 에셋** 두 ingestion 에셋 완료 후 실행
3.  **Report 에셋** staging 완료 후 실행

---

## Materialization 전략

| 전략 | 설명 |
| --- | --- |
| `table` | 매번 테이블을 드롭하고 재생성 |
| `append` | 기존 행을 건드리지 않고 새 데이터 삽입 |
| `merge` | 키 컬럼 기반으로 upsert |
| `time_interval` | 날짜 범위 내 행 삭제 후 재삽입 |
| `delete+insert` | 매칭되는 행 삭제 후 삽입 |
| `create+replace` | 테이블 생성 또는 교체 |

---

## 주요 CLI 명령어

| 명령어 | 설명 |
| --- | --- |
| `bruin init <template> <name>` | 템플릿으로 새 프로젝트 생성 |
| `bruin validate <path>` | 실행 없이 구문 및 의존성 확인 |
| `bruin run <path>` | 파이프라인 또는 개별 에셋 실행 |
| `bruin run --downstream` | 에셋 및 모든 다운스트림 의존성 실행 |
| `bruin run --full-refresh` | 테이블을 truncate하고 처음부터 재구축 |
| `bruin lineage <path>` | 에셋 의존성 조회 |
| `bruin query --connection <conn> --query "..."` | 임시 SQL 쿼리 실행 |

---

## 참고 자료

### 공식 문서

-   [Bruin Documentation](https://getbruin.com/docs)
-   [Bruin GitHub Repository](https://github.com/bruin-data/bruin)
-   [Bruin MCP (AI Integration)](https://getbruin.com/docs/bruin/getting-started/bruin-mcp)
-   [Bruin Cloud](https://getbruin.com/) — 관리형 배포 및 모니터링

### 학습 비디오

| 비디오 | 내용 |
| --- | --- |
| 5.1 - Introduction to Bruin | Bruin 소개 및 Modern Data Stack |
| 5.2 - Getting Started | 설치, VS Code 확장, 첫 프로젝트 생성 |
| 5.3 - NYC Taxi Pipeline | 3계층 아키텍처로 전체 파이프라인 구축 |
| 5.4 - Bruin MCP with AI | AI 에이전트로 파이프라인 생성 |
| 5.5 - Deploying to Bruin Cloud | 클라우드 배포 및 모니터링 |

### Core Concepts 비디오

-   Projects (프로젝트 초기화, `.bruin.yml`)
-   Pipelines (파이프라인 그룹화, 스케줄)
-   Assets (SQL, Python, YAML 에셋)
-   Variables (내장 변수, 커스텀 변수)
-   Commands (CLI 명령어)

---

## 학습 목표 요약

✅ Bruin 프로젝트 구조 이해  
✅ 파이프라인과 에셋의 개념  
✅ 파이프라인 설정 방법  
✅ Bruin이 지원하는 Materialization 전략  
✅ 리니지와 에셋 간 의존성 구축  
✅ 자동/수동으로 생성되는 메타데이터  
✅ 커스텀 변수로 파이프라인 매개변수화

---

## Bruin vs 다른 도구들 비교

### 도구별 역할 비교

| 도구 | 역할 | 특징 |
| --- | --- | --- |
| **dlt** | 데이터 수집 (Ingestion) | Python 기반, 소스→대상 데이터 로드 |
| **dbt** | 데이터 변환 (Transformation) | SQL 기반, 웨어하우스 내 변환 |
| **Airflow** | 오케스트레이션 | Python DAG, 웹서버 필요 |
| **Dagster** | 오케스트레이션 + 데이터 품질 | Software-defined assets, 웹 UI |
| **Kestra** | 오케스트레이션 | YAML 기반, Docker 필요 |
| **Bruin** | **All-in-One** | 수집 + 변환 + 오케스트레이션 + 품질 |

### Airflow/Dagster/Kestra와의 핵심 차이점

#### 1\. 웹서버 불필요 (가장 큰 차별점)

| 도구 | 로컬 실행 시 필요한 것 |
| --- | --- |
| **Airflow** | PostgreSQL/MySQL + Redis + Webserver + Scheduler + Worker |
| **Dagster** | Dagit (웹 UI) + Daemon |
| **Kestra** | Docker + 내장 웹서버 |
| **Bruin** | **CLI 바이너리 하나만** ✅ |

```
# Bruin - 이게 전부
bruin run ./pipeline/pipeline.yml

# Airflow - 여러 프로세스 필요
airflow webserver &
airflow scheduler &
# + 데이터베이스, 메시지 큐...
```

> **Bruin은 Go로 작성된 단일 바이너리**로, 설치 후 바로 `bruin run` 명령어만으로 파이프라인을 실행할 수 있습니다.

#### 2\. 통합 플랫폼 vs 조합

**Airflow/Dagster 방식:**

```
[dlt] → [Airflow/Dagster] → [dbt] → [Great Expectations]
  ↑           ↑                ↑            ↑
수집      오케스트레이션      변환       품질검사
(별도 설치)   (별도 설치)    (별도 설치)  (별도 설치)
```

**Bruin 방식:**

```
[Bruin CLI]
    ├── 수집 (ingestr 내장)
    ├── 변환 (SQL/Python)
    ├── 오케스트레이션 (의존성 기반)
    └── 품질검사 (내장 checks)
```

#### 3\. 설정 복잡도

**Airflow DAG 예시:**

```
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.google.cloud.operators.bigquery import BigQueryInsertJobOperator
from datetime import datetime

with DAG(
    'my_pipeline',
    start_date=datetime(2022, 1, 1),
    schedule_interval='@daily',
) as dag:

    ingest = PythonOperator(
        task_id='ingest_data',
        python_callable=ingest_func,
    )

    transform = BigQueryInsertJobOperator(
        task_id='transform',
        configuration={...}  # 복잡한 설정
    )

    ingest >> transform
```

**Bruin 에셋 예시:**

```
/* @bruin
name: staging.trips
type: duckdb.sql
depends:
  - ingestion.trips
materialization:
  type: table
@bruin */

SELECT * FROM ingestion.trips
WHERE date >= '{{ start_date }}'
```

#### 4\. 기능별 상세 비교

| 기능 | Bruin | Airflow | Dagster | Kestra |
| --- | --- | --- | --- | --- |
| **설치** | 단일 바이너리 | Docker Compose 또는 K8s | pip + daemon | Docker + Java |
| **웹 UI 필수** | ❌ (VS Code 확장으로 대체) | ✅ | ✅ | ✅ |
| **데이터 수집** | 내장 (ingestr) | 별도 (dlt, Airbyte) | 별도 | 별도 |
| **SQL 변환** | 내장 | 별도 (dbt) | 별도 | 별도 |
| **Python 지원** | ✅ 격리 환경 (uv) | ✅ | ✅ | ✅ |
| **품질 검사** | 내장 | 별도 | 내장 (asset checks) | 별도 |
| **리니지** | 내장 | 제한적 | 내장 | 제한적 |
| **스케줄링** | Bruin Cloud 또는 cron | 내장 | 내장 | 내장 |
| **언어** | Go | Python | Python | Java |
| **리소스 사용** | 매우 적음 | 높음 | 중간 | 중간 |

### Bruin만의 차별화된 장점

#### ✅ 1. 진정한 로컬 실행

```
# 로컬에서 바로 실행 - 인프라 설정 불필요
curl -LsSf https://getbruin.com/install/cli | sh
bruin init zoomcamp my-pipeline
cd my-pipeline
bruin run ./pipeline/pipeline.yml
```

#### ✅ 2. Go 기반의 네이티브 병렬 실행

**Go vs Python 동시성 비교:**

| 특성 | Go (Bruin) | Python (Airflow/Dagster) |
| --- | --- | --- |
| **동시성 모델** | Goroutines (경량 스레드) | 멀티프로세싱 또는 스레드 |
| **GIL 제약** | ❌ 없음 | ✅ 있음 (CPU-bound 작업 제한) |
| **메모리 오버헤드** | ~2KB per goroutine | ~8MB per process |
| **컨텍스트 스위칭** | 매우 빠름 | 상대적으로 느림 |
| **병렬 태스크 수** | 수천 개 가능 | 프로세스 수에 제한 |

**Bruin의 병렬 실행 방식:**

```
                    ┌─ ingestion.trips ─────┐
                    │      (Python)          │
Pipeline Start ─────┤                        ├───► staging.trips ─► reports.trips_report
                    │                        │
                    └─ ingestion.payment ───┘
                         (Seed CSV)

                    └──── 병렬 실행 ────┘      └──── 직렬 실행 ────────────────────┘
```

-   **의존성 없는 에셋**: 자동으로 병렬 실행 (goroutines 활용)
-   **의존성 있는 에셋**: 의존성 완료 후 즉시 실행

**Airflow의 병렬 실행 방식:**

```
# Airflow는 Executor 설정에 따라 병렬성이 결정됨
# LocalExecutor: 멀티프로세싱 (메모리 오버헤드 큼)
# CeleryExecutor: 별도 Worker 프로세스 + Redis/RabbitMQ 필요
# KubernetesExecutor: K8s Pod 생성 (가장 무거움)
```

**실제 성능 차이 예시:**

| 시나리오 | Bruin | Airflow (LocalExecutor) |
| --- | --- | --- |
| 10개 독립 에셋 병렬 실행 | ~수백 KB 추가 메모리 | ~80MB 추가 메모리 (10 프로세스) |
| 시작 시간 | 밀리초 | 수 초 (스케줄러 + 웹서버) |
| 태스크 스케줄링 오버헤드 | 거의 없음 | heartbeat 간격에 의존 |

```
# Bruin - 의존성 기반 자동 병렬화
bruin run ./pipeline/pipeline.yml
# → ingestion 에셋들이 동시에 goroutine으로 실행
# → 완료되면 즉시 staging 실행

# Airflow - Executor 설정 필요
# airflow.cfg
[core]
executor = LocalExecutor
parallelism = 32
max_active_tasks_per_dag = 16
```

#### ✅ 3. 에셋 중심 개발

-   코드, 설정, 의존성, 품질 검사가 **단일 파일**에 정의
-   DAG 파일과 SQL/Python 분리 불필요

#### ✅ 3. 빠른 피드백 루프

```
# 즉시 검증
bruin validate ./pipeline/pipeline.yml

# 단일 에셋만 테스트
bruin run ./assets/staging/trips.sql
```

#### ✅ 4. CI/CD 친화적

```
# GitHub Actions에서 바로 실행
- name: Run Bruin Pipeline
  run: |
    curl -LsSf https://getbruin.com/install/cli | sh
    bruin run ./pipeline/pipeline.yml
```

#### ✅ 5. 리소스 효율성

-   **Airflow**: 최소 2-4GB RAM 필요
-   **Bruin**: 수십 MB로 실행 가능

### 언제 어떤 도구를 선택할까?

| 상황 | 추천 도구 |
| --- | --- |
| 빠른 프로토타이핑, 로컬 개발 | **Bruin** |
| 복잡한 DAG, 수백 개 태스크 | Airflow |
| 소프트웨어 엔지니어링 접근 | Dagster |
| 이벤트 기반 워크플로우 | Kestra |
| 엔드투엔드 통합 플랫폼 | **Bruin** |
| 기존 dbt 프로젝트 마이그레이션 | **Bruin** (dbt 문법 호환) |
| 최소한의 인프라로 시작 | **Bruin** |

### 결론

**Bruin의 핵심 가치:**

1.  **단순함**: 웹서버, 데이터베이스, Docker 없이 CLI 하나로 시작
2.  **통합**: dlt + dbt + Airflow + Great Expectations를 하나로
3.  **생산성**: 에셋 하나에 모든 것을 정의
4.  **유연성**: 로컬, EC2, GitHub Actions 어디서든 동일하게 실행

> 💡 **핵심 포인트**: Airflow/Dagster/Kestra는 "오케스트레이터"로서 다른 도구들을 조합해야 하지만, Bruin은 **데이터 플랫폼**으로서 수집-변환-품질검사-오케스트레이션을 모두 내장하고 있습니다. 특히 로컬 개발 시 **별도의 웹서버나 인프라 없이** CLI만으로 전체 파이프라인을 실행할 수 있다는 점이 가장 큰 차별점입니다.