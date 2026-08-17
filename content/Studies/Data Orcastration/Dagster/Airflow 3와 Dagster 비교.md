---
title: Airflow 3와 Dagster 비교
tags:
  - dagster
  - airflow
  - orchestration
draft: true
created: 2026-08-15
---

Airflow 3에 `@asset` 데코레이터가 들어오면서 두 도구가 표면적으로 비슷해 보이게 됐다. 코드만 보면 거의 같은데 실행 모델은 여전히 다르다. 어디가 어떻게 다른지 정리한다.

Asset이라는 개념 자체는 [[Dagster의 자산 중심 워크플로우]]에 따로 썼다. 여기서는 두 도구를 축별로 놓고 본다.

## 축별 비교

| 관점           | Airflow 3.x                        | Dagster                       |
| ------------ | ---------------------------------- | ----------------------------- |
| 기본 철학        | Workflow/DAG 중심                    | Data Asset 중심                 |
| 핵심 객체        | DAG → Task                         | Asset                         |
| Asset 역할     | 데이터 dependency / scheduling 강화     | orchestration의 중심             |
| 실행 관점        | "이 Task를 실행한다"                     | "이 Asset을 materialize한다"      |
| Dependency   | Task dependency + Asset dependency | Asset dependency              |
| dbt 궁합       | dbt 실행을 DAG/Task로 구성 가능            | dbt model을 자연스럽게 Asset으로 변환   |
| Partition    | 최신 Airflow에서 강화 중                  | 오래전부터 핵심 기능                   |
| Data Quality | Task/외부 도구 활용 비중 높음                | `AssetCheck`가 Asset 모델에 직접 결합 |
| 기존 생태계       | 매우 강함: Operator/Provider/Sensor    | 데이터 플랫폼 중심으로 강함               |

## @asset은 같아 보이는데 왜 다른가

Airflow 3의 asset 정의는 이렇게 생겼다.

```python
from airflow.sdk import asset

@asset
def raw_orders():
    ...

@asset
def staging_orders():
    ...
```

Dagster는 이렇다.

```python
import dagster as dg

@dg.asset
def raw_orders():
    ...

@dg.asset(deps=[raw_orders])
def staging_orders():
    ...
```

Apache도 이를 asset-centric DAG definition을 가능하게 하는 기능이라고 설명한다. 하지만 내부 관점이 다르다. Airflow는 이렇게 흐른다.

```
Asset
   ↓
DAG / Task 실행
   ↓
Asset update event
   ↓
다른 DAG 실행
```

공식 설명에서도 Asset은 "logical grouping of data"이고, producer task가 asset을 업데이트하며, 이 update 이벤트가 consumer DAG의 스케줄링에 쓰인다. 즉 asset은 **스케줄링 트리거**다. 실행 단위는 여전히 task이고, asset은 그 위에 얹힌 신호 계층이다.

Dagster에서 asset은 오케스트레이션의 중심 그 자체다. 실행 단위가 asset이고, 상태 추적 단위도 asset이다. `@asset` 함수는 "이 데이터가 무엇인가"의 정의이지 "무엇을 실행할까"의 정의가 아니다.

## 리니지에서 갈린다

이 차이가 실무에서 드러나는 곳이 리니지다.

Airflow는 task 기반이라는 근본이 바뀌지 않아서, 한 task group(DAG) 안에 여러 개의 아웃풋이 들어간다. Cosmos 라이브러리로 dbt 친화적으로 개선됐다고 해도 마찬가지다. task group이 쪼개져서 DAG끼리 의존하는 경우, 배치는 순서대로 실행되더라도 데이터 리니지 계보는 끊겨서 보인다. DAG 두 개가 asset으로 연결돼 있으면 순서는 지켜지지만, 각 DAG 안에서 어떤 테이블이 어떤 테이블을 참조했는지는 계보에 안 나온다.

Dagster는 그 안쪽까지 asset이다. dbt 모델 하나가 asset 하나로 올라오고, `ref()` 관계가 그대로 그래프가 된다.

## 파티션

Dagster는 파티션 키를 쓸 수 있고, 이를 통해 특정 파티션의 데이터가 잘 실행됐는지 아닌지 확인하기가 정말 쉽다. asset × 파티션 그리드가 UI에 그대로 뜨고, 실행에 성공한 칸만 초록으로 칠해진다. 백필 대상이 눈으로 보인다.

Airflow도 최신 버전에서 파티션 관련 기능을 강화하고 있지만, Dagster는 오래전부터 핵심 기능이었다는 차이가 성숙도로 남아 있다. 구체적인 구성은 [[Dagster 파티션키와 스케줄 실전 구성]]에 정리했다.

## Dagster 쪽 약점

**러닝 커브.** Task로 사고하던 습관을 "무엇을 만들어내는가"로 바꾸는 데 시간이 걸린다. 기존 배치를 그대로 옮기려 하면 asset 경계를 어디에 그을지에서 계속 막힌다. asset, materialization, partition 같은 개념이 낯설어 초기 진입이 느리다.

**자료가 적다.** Airflow만큼 사용자가 많지 않다. 온라인 강의를 찾아봤지만 나오지 않았고, 결국 공식 튜토리얼과 Dagster 슬랙 채널에서 발품을 팔아야 했다. 한국어 자료는 더 적다.

**생태계.** Airflow의 Operator/Provider 생태계는 여전히 압도적이다. 붙일 시스템이 많은 조직이라면 이 격차는 실제 비용으로 돌아온다.

정리하면 dbt를 쓰고 데이터 리니지가 중요한 파이프라인이면 Dagster가, 붙일 외부 시스템이 많고 팀에 Airflow 경험이 쌓여 있으면 Airflow가 유리하다.

## 관련 글

- [[Dagster의 자산 중심 워크플로우]]
- [[Dagster 파티션키와 스케줄 실전 구성]]
- [[Projects/customer-analytics-mart/고객마트 Dagster 통합|실제 프로젝트에서 Dagster를 고른 기록]]
