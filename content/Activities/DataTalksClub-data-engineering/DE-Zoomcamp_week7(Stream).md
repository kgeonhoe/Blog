---
categories:
  - "[[Courses]]"
platform: DataTalksClub
instructor: alexeygrigorev
url: https://github.com/DataTalksClub/data-engineering-zoomcamp/tree/main/07-streaming/workshop
created: 2026-03-07
start:
end:
rating:
topics:
  - "[[Kafka]]"
  - "[[Data Pipelines]]"
  - "[[Docker]]"
tags:
  - course
draft: true
---
> DataTalksClub의 [Streaming Workshop](https://github.com/DataTalksClub/data-engineering-zoomcamp/tree/main/07-streaming/workshop)을 바탕으로 실습한 내용을 정리한 글입니다.


## 목차
- [1. Streaming 파이프라인이란?](#1-streaming-파이프라인이란)
- [2. Batch와 다른 점](#2-batch와-다른-점)
- [3. 언제 Streaming을 사용하는가?](#3-언제-streaming을-사용하는가)
- [4. Kafka](#4-kafka)
  - [4.1 Kafka 아키텍처](#41-kafka-아키텍처)
    - [토픽을 나누는 이유](#토픽을-나누는-이유)
    - [DLQ(Dead Letter Queue)란?](#dlqdead-letter-queue란)
  - [4.3 Producer / Consumer / Topic이 존재하는 이유](#43-producer--consumer--topic이-존재하는-이유)
  - [4.2 Redpanda](#42-redpanda)
- [5. Flink](#5-flink)
  - [5.1 Flink 아키텍처](#51-flink-아키텍처)
  - [5.2 Flink로 할 수 있는 일](#52-flink로-할-수-있는-일)
  - [5.3 Consumer에서 처리하지 않고 Flink를 쓰는 이유](#53-consumer에서-처리하지-않고-flink를-쓰는-이유)
  - [5.4 Flink vs Spark Streaming](#54-flink-vs-spark-streaming)
  - [5.5 Watermark란 무엇인가](#55-watermark란-무엇인가)
- [6. 실습](#6-실습)
  - [6.1 GitHub Codespaces](#61-github-codespaces)
  - [6.2 실습에서 Redpanda를 사용한 이유](#62-실습에서-redpanda를-사용한-이유)
  - [6.3 `uv add --dev jupyter`를 사용한 이유](#63-uv-add---dev-jupyter를-사용한-이유)
  - [6.4 전체 아키텍처](#64-전체-아키텍처)
  - [6.5 환경 구성](#65-환경-구성)
  - [6.6 Producer: 실시간 + 지연 이벤트 생성](#66-producer-실시간--지연-이벤트-생성)
  - [6.7 Pass-through Job: Kafka → Postgres](#67-pass-through-job-kafka--postgres)
  - [6.8 Aggregation Job: 윈도우 집계](#68-aggregation-job-윈도우-집계)
  - [6.9 실행 흐름](#69-실행-흐름)
- [7. 실습 회고](#7-실습-회고)
  - [배운 점](#배운-점)
  - [다음에 확장하고 싶은 것](#다음에-확장하고-싶은-것)
- [보강 정리](#보강-정리)
  - [1. `uv add --dev jupyter`와 `--dev`의 의미](#1-uv-add---dev-jupyter와---dev의-의미)
  - [2. `dataclass`의 기능 설명](#2-dataclass의-기능-설명)
  - [3. Producer와 Consumer를 나누는 이유](#3-producer와-consumer를-나누는-이유)
  - [4. Watermark란?](#4-watermark란)
  - [5. Flink의 `latest-offset` 정리](#5-flink의-latest-offset-정리)
- [핵심 요약](#핵심-요약)
- [실습 메모](#실습-메모)


---



## 1. Streaming 파이프라인이란?



Streaming 파이프라인은 데이터가 생성되는 즉시(또는 매우 짧은 지연 내에) 처리하는 구조다.  

Batch처럼 "모아서 한 번에 처리"하지 않고, **이벤트 단위**로 계속 흘려보내며 계산/적재/알림을 수행한다.



핵심 3가지

- **지연(latency)을 줄인다** — 이벤트 발생 후 수 초~수 분 내에 결과가 나온다.
- **최신 상태를 빠르게 반영한다** — 대시보드, 알림 등이 즉시 갱신된다.
- **이벤트 시간(event time) 기준 처리를 설계할 수 있다** — 데이터가 실제로 도착한 시각이 아닌, 발생한 시각 기준으로 정확하게 계산한다.

---

## 2. Batch와 다른 점

| 구분     | Batch                  | Streaming                 |
| ------ | ---------------------- | ------------------------- |
| 처리 단위  | 일정 주기(시간/일) 단위로 모아서 처리 | 이벤트 단위로 즉시 처리             |
| 지연     | 높음 (분~시간~일)            | 낮음 (밀리초~초)                |
| 설계 복잡도 | 상대적으로 단순               | 순서, 중복, 지연 도착 데이터 등 고려 필요 |
| 강점     | 최종 집계, 대량 처리           | 실시간 의사결정, 모니터링            |
| 장애 복구  | 재실행이 비교적 쉬움            | 상태(state) + 체크포인트 설계 필요   |


**한 줄 요약:** Batch는 "모아서 한 번에", Streaming은 "오는 족족 바로".

---

## 3. 언제 Streaming을 사용하는가?


대표적인 Use Case는 다음과 같다.

| Use Case                      | 설명                                            |
| ----------------------------- | --------------------------------------------- |
| **CDC (Change Data Capture)** | DB 변경(INSERT/UPDATE/DELETE)을 실시간으로 다른 시스템에 전달 |
| **실시간 대시보드**                  | 분/초 단위 지표 업데이트 (매출, 트래픽, 재고 등)                |
| **이상 탐지**                     | 사기 거래, 비정상 트래픽, 장애 징후 탐지                      |
| **알림/추천**                     | 사용자 행동 기반 즉시 반응 (푸시, 쿠폰 등)                    |
| **로그/이벤트 파이프라인**              | 서비스 이벤트를 중앙 수집 후 다중 소비                        |


---


## 4. Kafka

Kafka는 **이벤트 스트리밍 플랫폼**이다.  

Producer가 Topic에 기록하고, Consumer가 읽는다. 메시지는 로그 형태로 저장되고, 오프셋 기반으로 재처리가 가능하다.

### 4.1 Kafka 아키텍처

```
Producer ──▶ [ Topic (Partition 0) ] ──▶ Consumer Group
             [ Topic (Partition 1) ]
             [ Topic (Partition 2) ]
                    │
                  Broker(s)

```


구성 요소별 역할:
- **Producer** — 이벤트를 발행한다.
- **Topic** — 이벤트 스트림의 논리 단위다.
- **Partition** — Topic을 분할한 저장 단위로, 병렬 처리와 확장성을 제공한다.
- **Broker** — 데이터를 저장하고 복제하는 서버다.
- **Consumer Group** — 여러 Consumer가 파티션을 나눠 읽는 단위다.
- **Offset** — Consumer가 어디까지 읽었는지 나타내는 위치 정보다.

#### 토픽 분리 vs 파티션 분할

- **토픽 분리**: 도메인/정책/운영 단위를 나누기 위함
- **파티션 분할**: 병렬 처리와 수평 확장을 위한 성능 단위

자세한 설명은 [[Kafka 토픽 분리와 DLQ 패턴]]에 정리했다.


### 4.2 Producer / Consumer / Topic이 존재하는 이유

이 구조의 본질은 **결합도 분리(decoupling)**다.
- **Producer**는 "생성"에만 집중한다.
- **Consumer**는 "처리"에만 집중한다.
- **Topic**은 둘 사이의 **버퍼/로그** 역할을 한다.


Batch 파이프라인과의 차별점:

| 관점       | Batch      | Kafka(Streaming)               |
| -------- | ---------- | ------------------------------ |
| 처리 단위    | 파일/테이블 단위  | 이벤트 단위                         |
| 다중 소비    | ETL 재실행 필요 | 같은 이벤트를 여러 Consumer가 독립 소비     |
| 장애 복구    | 전체 재처리     | 오프셋 기반 부분 재처리                  |
| 속도 차이 흡수 | 스케줄 의존     | Topic이 버퍼 역할 (backpressure 완화) |


### 4.3 Redpanda
실습에서는 Redpanda를 사용한다.

Redpanda는 **Kafka API 호환** 스트리밍 플랫폼이다.  
C++로 작성되어 JVM 의존성이 없고, 단일 바이너리로 구동된다.

- Kafka 클라이언트를 **코드 변경 없이** 그대로 활용할 수 있다.
- ZooKeeper 같은 외부 의존이 없어 운영이 단순하다.
- Docker Compose 기반 로컬 실행이 매우 간편하다.

---

## 5. Flink


Flink는 **상태 기반(stateful) 스트림 처리 엔진**이다.  
정확한 시간 처리(event time), 윈도우, 조인, 체크포인트/복구, Exactly-once 시맨틱을 강하게 지원한다.


### 5.1 Flink 아키텍처
```

┌──────────────┐

│  JobManager  │ ← 잡 스케줄링, 체크포인트 관리, 전체 제어

└──────┬───────┘

       │

┌──────▼───────┐   ┌──────────────┐

│ TaskManager  │   │ TaskManager  │ ← 실제 연산 실행 (Operator Chain)

│  (slot × N)  │   │  (slot × N)  │

└──────────────┘   └──────────────┘

       │                   │

  State Backend + Checkpoint ← 장애 시 상태 복구

```

실습에서는 Docker Compose로 `jobmanager`, `taskmanager` 컨테이너를 분리해 실행했다.

### 5.2 Flink로 할 수 있는 일

- **윈도우 집계** — 분/시간 단위 지표 생성
- **상태 기반 처리** — 사용자 세션, 누적 카운트
- **스트림 조인** — 클릭 스트림 + 사용자 프로필 등
- **이상 탐지** — 규칙 기반 실시간 판정
- **실시간 적재** — Kafka → DB/Postgres 파이프라인


### 5.3 kafka Consumer에서 처리하지 않고 Flink를 쓰는 이유

"단순 처리"는 Consumer 애플리케이션으로도 가능하다.  
하지만 다음 요구사항이 생기면 Flink가 유리하다.

| Consumer 직접 처리  | Flink                         |
| --------------- | ----------------------------- |
| 상태 관리를 직접 구현    | 상태 관리 내장 (RocksDB 등)          |
| 시간/순서 처리를 직접 구현 | Event time + Watermark 내장     |
| 장애 복구 직접 구현     | Checkpoint 기반 Exactly-once 제공 |
| 단일 처리 로직        | 복수 연산/복수 싱크를 일관된 잡으로 운영       |
| 백프레셔 직접 관리      | 백프레셔/재시도 내장                   |

**한 줄 요약:** Consumer 코드로도 시작할 수 있지만, 파이프라인이 커질수록 처리 엔진이 필요해진다.

### 5.4 Flink vs Spark Streaming

| 구분                     | Flink                                | Spark Structured Streaming         |
| ---------------------- | ------------------------------------ | ---------------------------------- |
| 처리 모델                  | **Native Streaming** (진짜 스트림)        | **Micro-batch** 기반                 |
| 지연                     | 밀리초~초 수준                             | 초~분 수준 (마이크로배치 간격)                 |
| 상태 관리                  | 강력 (RocksDB, Incremental Checkpoint) | 제한적                                |
| Event time / Watermark | 1급 지원                                | 지원하나 Flink만큼 유연하지 않음               |
| 생태계 연계                 | 스트림 특화                               | 기존 Spark(ML, SQL, DataFrame) 통합 강점 |
| 적합한 상황                 | 초저지연 + 복잡 상태 처리                      | 배치+스트림 통합 운영                       |

**결론:** "초저지연 + 복잡 상태 처리"면 Flink, "기존 Spark 파이프라인 확장"이면 Spark Streaming이 자주 선택된다.

### 5.5 Watermark란 무엇인가

Watermark는 **"이 시점 이전 이벤트는 거의 다 도착했다"는 시간 진행 신호**다.
현실 데이터에서는 네트워크 지연, 클라이언트 오프라인 등의 이유로 이벤트가 늦게 도착할 수 있다.  
Watermark는 이런 환경에서 **윈도우를 언제 닫을지** 결정하는 핵심 메커니즘이다.

```

이벤트 시간 축 ──────────────────────────────▶

  [이벤트A 09:00:01]  [이벤트B 09:00:03]  [이벤트C 08:59:58 ← 늦게 도착!]
                                              │
                            Watermark = 09:00:03 - 5초 = 08:59:58
                            → "08:59:58 이전 데이터는 거의 다 왔다"

```

실습 코드에서는 다음과 같이 설정했다:
```sql

WATERMARK FOR event_timestamp AS event_timestamp - INTERVAL '5' SECOND

```

- 5초 이내 늦게 도착한 이벤트는 정상 처리된다.
- 5초 이상 늦으면 late event로 별도 정책이 필요하다.

Producer에서 **20% 확률로 3~10초 늦은 이벤트**를 생성해, 실제로 watermark가 어떻게 동작하는지 확인할 수 있었다.

---



## 6. 실습

### 6.1 GitHub Codespaces
Codespaces를 쓰면 로컬 환경 차이(Java/Python/의존성) 문제를 줄일 수 있다.  
팀원이 같은 개발 컨테이너 환경에서 재현 가능한 실습을 할 수 있다는 점이 크다.

- 별도 설치 없이 브라우저에서 바로 개발 환경 진입
- Docker, Python, Java 등이 미리 구성된 상태로 시작
- `.devcontainer` 설정으로 환경 재현성 보장

### 6.2 실습에서 Redpanda를 사용한 이유
이 실습의 목적은 **"스트리밍 개념과 Flink 처리"**이지, Kafka 운영이 아니다.
- Redpanda는 기동이 빠르고 설정이 단순하다.
- Kafka API 호환이므로 `kafka-python` 등 기존 클라이언트를 그대로 쓸 수 있다.
- 학습/실습에서 운영 복잡도를 줄여 **본질(스트리밍 처리)**에 집중할 수 있다.

### 6.3 `uv add --dev jupyter`를 사용한 이유
`--dev`는 **개발/실험용 의존성을 프로덕션 의존성과 분리**하기 위해 사용한다.
```toml
# pyproject.toml
[dependency-groups]
dev = [
    "jupyter>=1.1.1",
]
```

- Jupyter는 실험/탐색용 도구이지, 런타임 필수가 아니다.
- 프로덕션 환경(예: Flink 컨테이너)에서는 Jupyter가 필요 없다.

### 6.4 전체 아키텍처
```

┌──────────────────┐          ┌──────────────┐

│  Producer        │──rides──▶│  Redpanda    │

│  (Python)        │  topic   │  (Kafka API) │

└──────────────────┘          └──────┬───────┘

                                     │

                        ┌────────────┴────────────┐

                        ▼                         ▼

              ┌─────────────────┐       ┌─────────────────────┐

              │ Flink Job:      │       │ Flink Job:           │

              │ pass-through    │       │ 1h tumble aggregation│

              └────────┬────────┘       └──────────┬───────────┘

                       ▼                           ▼

              ┌─────────────────┐       ┌─────────────────────────┐

              │ Postgres:       │       │ Postgres:                │

              │ processed_events│       │ processed_events_aggregated│

              └─────────────────┘       └─────────────────────────┘

```



주요 파일 구조:

| 파일                                   | 역할                              |
| ------------------------------------ | ------------------------------- |
| `docker-compose.yaml`                | 인프라 (Redpanda, Flink, Postgres) |
| `Dockerfile.flink`                   | Flink 이미지 + 커넥터 JAR 다운로드        |
| `flink-config.yaml`                  | Flink 설정 (메모리, 슬롯 등)            |
| `src/producers/producer_realtime.py` | 이벤트 생성기                         |
| `src/job/pass_through_job.py`        | 단순 적재 잡                         |
| `src/job/aggregation_job.py`         | 윈도우 집계 잡                        |



### 6.5 환경 구성
`docker-compose.yaml`로 4개 서비스를 함께 띄운다:

- **redpanda** — Kafka 호환 메시지 브로커
- **jobmanager** — Flink 잡 스케줄러
- **taskmanager** — Flink 잡 실행기
- **postgres** — 결과 저장소


`Dockerfile.flink`에서는 다음 커넥터 JAR을 미리 다운로드한다:

```dockerfile
RUN wget .../flink-json-2.2.0.jar; \
    wget .../flink-sql-connector-kafka-4.0.1-2.0.jar; \
    wget .../flink-connector-jdbc-core-4.0.0-2.0.jar; \
    wget .../flink-connector-jdbc-postgres-4.0.0-2.0.jar; \
    wget .../postgresql-42.7.10.jar
```

이렇게 이미지 레벨에서 준비하면 Flink SQL DDL에서 `'connector' = 'kafka'`, `'connector' = 'jdbc'`를 바로 쓸 수 있다.

### 6.6 Producer: 실시간 + 지연 이벤트 생성

`src/producers/producer_realtime.py`는 `rides` 토픽으로 NYC 택시 이벤트를 계속 보낸다.

```python
# ~20% 확률로 3~10초 늦은(late) 이벤트를 만든다
if random.random() < 0.2:
    delay = random.randint(3, 10)
    ride = make_ride(delay_seconds=delay)
```

- 0.5초마다 1건씩 전송
- 20% 확률로 지연 이벤트 생성 → Watermark 동작을 관찰할 수 있다
- NYC 택시 존 ID 기반의 현실적인 데이터 구조

이벤트 데이터 구조는 `@dataclass`로 정의한다. 생성자(`__init__`), 비교(`__eq__`), 문자열 표현(`__repr__`)이 자동으로 만들어지기 때문에 스키마를 간결하게 선언할 수 있고, 필드 누락도 바로 잡힌다.

    PULocationID, DOLocationID, trip_distance, total_amount,

    TO_TIMESTAMP_LTZ(tpep_pickup_datetime, 3) as pickup_datetime

FROM events

```


- Source: Kafka (`'connector' = 'kafka'`)
- Sink: Postgres (`'connector' = 'jdbc'`)
- 변환: epoch milliseconds → timestamp

Kafka Source는 `'scan.startup.mode' = 'latest-offset'`으로 설정한다. 잡이 시작된 이후 들어오는 신규 이벤트만 읽고, 과거 데이터는 재처리하지 않는다. 학습/데모에서는 빠르게 시작할 수 있지만, 운영 파이프라인에서 재처리가 필요하면 `earliest-offset` 또는 타임스탬프 기반 시작 전략으로 바꿔야 한다.

### 6.8 Aggregation Job: 윈도우 집계
`src/job/aggregation_job.py`에서는 event time + watermark + 1시간 tumbling window 집계를 수행한다.

```sql
-- Source에 Watermark 정의
event_timestamp AS TO_TIMESTAMP_LTZ(tpep_pickup_datetime, 3),
WATERMARK FOR event_timestamp AS event_timestamp - INTERVAL '5' SECOND

-- 1시간 단위 집계
SELECT
    window_start, PULocationID,
    COUNT(*) AS num_trips,
    SUM(total_amount) AS total_revenue
FROM TABLE(
    TUMBLE(TABLE events, DESCRIPTOR(event_timestamp), INTERVAL '1' HOUR)
)
GROUP BY window_start, PULocationID
```

집계 결과는 `(window_start, PULocationID)`를 PK로 하는 `processed_events_aggregated` 테이블에 upsert 형태로 저장된다.

### 6.9 실행 흐름

```bash

# 1. 인프라 기동

docker compose up -d --build

# 2. Producer 실행 (이벤트 생성)
python src/producers/producer_realtime.py

# 3. Pass-through Job 제출
docker compose exec jobmanager flink run -py /opt/src/job/pass_through_job.py

# 4. Aggregation Job 제출
docker compose exec jobmanager flink run -py /opt/src/job/aggregation_job.py
```


Flink Web UI는 `http://localhost:8081`에서 잡 상태를 확인할 수 있다.


---



## 7. 실습 회고



### 배운 점



- 스트리밍에서는 `processing time`보다 **`event time + watermark`** 설계가 더 중요하다.
- "먼저 pass-through로 엔드투엔드 확인 → 이후 집계 추가" 순서가 디버깅에 유리하다.
- Flink SQL DDL만으로도 꽤 빠르게 실시간 파이프라인을 만들 수 있다.
- Redpanda 덕분에 Kafka 운영 부담 없이 스트리밍 개념에 집중할 수 있었다.



### 다음에 확장하고 싶은 것

- CDC 소스 연동 (Debezium)
- Dead letter topic 도입
- Window 크기/Watermark 변경에 따른 지연 허용 정책 실험
- Exactly-once 보장 시나리오와 Checkpoint 튜닝 비교
- `latest-offset` vs `earliest-offset` 전략 비교 실험

