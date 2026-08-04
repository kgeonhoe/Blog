---
title: Airflow가 아니라 Dagster를 선택한 이유 — asset 기반 오케스트레이션과 dbt
categories:
  - "[[Projects]]"
tags:
  - stock-platform
  - dagster
  - airflow
  - dbt
  - orchestration
created: 2026-07-31
draft: false
---

## 한눈에 보기

- 문제: 두 거래소(KRX/NASDAQ)의 서로 다른 마감 시간에 맞춰 수집→지표→신호로 이어지는 일배치를 사람 손 없이 돌려야 했다.
- 선택: task 기반 오케스트레이터가 아니라 asset(데이터 산출물) 기반인 Dagster를 선택했다.
- 근거: 이 파이프라인의 관심사는 "작업이 돌았는가"가 아니라 "데이터가 최신인가"이고, dbt 모델을 asset 그래프로 그대로 흡수할 수 있었다.
- 결과: dbt 모델까지 하나의 lineage로 통합됐다. 다만 "완료로 보였는데 실제로는 한 번도 배선되지 않았던" 사고도 겪었다.
- 핵심 교훈: 오케스트레이터의 실행 단위가 도메인의 단위와 일치하면, 파이프라인 확장이 공짜에 가까워진다.

## 문제: 스케줄이 아니라 의존성이 어렵다

매일 해야 하는 일 자체는 단순하다. 장 마감 후 종목 목록을 갱신하고, OHLCV를 수집해 bronze에 쓰고, 지표를 계산해 silver를 만들고, 매매 신호를 뽑는다.

어려운 건 시간이 아니라 의존성이다. KRX는 UTC 07:00(KST 16:00, 장 마감 30분 후), NASDAQ은 UTC 22:30에 돈다 — 미국 서머타임에 따라 마감이 UTC 20:00과 21:00 사이에서 흔들리는데 22:30은 두 경우를 모두 커버한다. 여기까지는 cron 두 줄이다. 하지만 "krx_symbols가 실패했는데 그 뒤의 OHLCV 수집이 그대로 도는" 상황, "bronze는 갱신됐는데 silver가 어제 것인" 상황을 cron은 표현하지 못한다.

이 파이프라인에서 내가 추적하고 싶은 것은 작업 로그가 아니라 **데이터의 상태**였다. "silver의 삼성전자 지표가 언제 것인가, 그 상류인 bronze는 언제 갱신됐는가"에 답할 수 있어야 한다.

## task 기반 vs asset 기반

오케스트레이터 후보는 사실상 Airflow와 Dagster 둘이었다. 미리 밝혀두면 **이 프로젝트에서 Airflow를 실제로 운영해 보고 비교한 것은 아니다.** 아래는 벤치마크가 아니라, 두 도구의 모델을 이 프로젝트의 요구사항에 대어 본 비교다.

| 요구사항 | task 기반 (Airflow) | asset 기반 (Dagster) |
|---|---|---|
| "이 데이터가 최신인가"를 추적 | task 성공 여부로 간접 추론 | asset materialization이 1급 개념 |
| dbt 모델을 개별 단위로 편입 | `BashOperator dbt run` 덩어리 (Cosmos 등 별도 도구 필요) | `@dbt_assets`가 manifest를 읽어 모델별 asset 자동 생성 |
| 특정 날짜 범위 백필 | DAG 재실행 개념으로 우회 | partition + backfill이 UI의 1급 기능 |
| 로컬 Docker 단일 머신 운영 | 컴포넌트 다수 (scheduler/webserver/worker) | webserver + daemon 2개 |

결정적이었던 건 두 번째 줄이다. 이 프로젝트는 처음부터 dbt를 쓸 계획이었고, dbt는 자기만의 DAG(모델 간 `ref` 의존성)를 이미 갖고 있다. task 기반 도구에서 dbt는 "dbt run이라는 하나의 검은 상자 task"가 되기 쉽다. 그 안의 어떤 모델이 실패했는지, 어떤 모델이 어떤 원천 데이터에 의존하는지가 오케스트레이터의 그래프에는 보이지 않는다.

Dagster의 `@dbt_assets`는 접근이 다르다. dbt가 컴파일한 `manifest.json`을 읽어 **dbt 모델 하나하나를 Dagster asset으로 자동 매핑**한다. bronze를 만드는 Python asset과 그걸 정제하는 dbt 모델이 한 그래프에서 이어지고, "bronze가 갱신되면 하류 dbt 모델이 stale"이라는 관계가 UI에 그대로 보인다. 이 궁합이 선택의 중심이었다.

## 실전에서 배운 것들

### 백필은 스케줄과 다른 문제다

Dagster의 Daily Partition으로 과거 5년을 백필하면 어떻게 될까. 하루치 파티션 하나가 API 요청 하나가 되므로, KRX 5년이면 1,260 거래일 × 2,700 종목 = 약 340만 번의 호출이 된다. 그런데 수집 소스(FinanceDataReader)는 날짜 범위를 한 번에 요청할 수 있다 — 종목당 1회, 총 2,700번이면 끝난다. 약 1,260배 차이다.

그래서 일일 수집 asset과 백필 asset을 분리했다. 백필 asset은 종목당 범위 1회 호출로 전체 기간을 받아 멱등하게 쓴다. "오늘만 빠르게"와 "원하는 기간 전체를 효율적으로"는 같은 코드로 풀 수 없는 서로 다른 문제였다.

### dbt 통합의 네 가지 배선, 그리고 함정

`@dbt_assets`를 실제로 붙이면서 네 군데의 배선이 필요했고, 각각에서 한 번씩 걸려 넘어졌다.

**manifest는 이미지 빌드 시점에 만든다.** `dagster dev`가 아니라 webserver/daemon을 직접 띄우는 구조라, Dockerfile의 `RUN dbt parse` 단계에서 manifest를 미리 생성한다. 여기서 함정: dbt 프로젝트 디렉토리를 라이브 볼륨 마운트하면 빌드 시점에 만든 manifest를 마운트가 **가려버려서** `DagsterDbtManifestNotFoundError`가 난다. 그리고 manifest가 이미지에 구워져 있으므로 dbt 모델을 수정하면 webserver와 daemon **양쪽** 이미지를 다시 빌드해야 한다 — 한쪽만 갱신하면 두 프로세스가 서로 다른 그래프를 보는 diverge 상태가 된다.

**select는 그래프 연산자 대신 명시 나열.** KRX와 NASDAQ은 스케줄이 달라 dbt asset 함수를 거래소별로 나눴는데, `+` 연산자로 하류를 포함시키면 두 그룹이 공용 하류 노드를 서로 자기 것이라 주장해 asset key가 충돌할 수 있다.

**dbt source는 translator로 실제 asset에 연결한다.** 기본 규칙대로 두면 dbt의 source 선언이 실제 bronze asset과 별개인 "materialize 불가능한 유령 노드"가 된다. AssetKey 변환 규칙을 커스터마이즈해 두 노드를 합쳐야 진짜 lineage가 생긴다.

**`--select`를 수동으로 넣지 않는다.** 함수 본문에서 `--select`를 직접 추가하면 dagster-dbt가 자동 계산한 것과 union으로 합쳐져, UI에서 모델 하나만 골라 실행해도 dbt가 전부 빌드하고 `DagsterInvariantViolationError`가 난다(2026-07-22 실측).

### 그린 체크 뒤의 조용한 미배선

가장 뼈아팠던 발견은 트러블슈팅 목록에 TBL-006으로 남아 있다. 레이크하우스 전환 작업이 "완료"로 표시된 뒤에도, Dagster는 **Trino를 한 번도 탄 적이 없었다.** `dbt build` 호출에 `--target`이 빠져 기본 타겟(DuckDB)으로만 돌았고, manifest 자체가 그 타겟으로 컴파일돼 레이크하우스 모델은 파싱 시점에 이미 disabled였다. 파이프라인은 매일 초록불이었다.

작업이 성공했다는 신호와 의도한 경로로 실행됐다는 사실은 다르다. 이 사건 이후로 "완료"의 정의에 "실제 실행 경로를 로그로 확인"이 추가됐다.

### 버전이 기능을 결정했다

Dagster에는 Schedule보다 세련된 Declarative Automation(조건 기반 자동 실행)이 있지만, 당시 사용 중이던 1.5.13에서는 1.6.0+ 기능이라 쓸 수 없었다. "매일 정해진 시간 실행"이면 충분한 요구사항이었기에 검증된 Schedule로 시작했다. 상위 asset 실패 시 하류가 그대로 시도되는 한계는 알고 감수했다 — 신기능보다 운영 안정이 먼저였고, 지금도 이 순서가 맞았다고 생각한다.

## 트레이드오프와 한계

Dagster를 택하며 감수한 것들도 분명하다. dbt manifest가 이미지에 베이크되는 구조는 모델 수정마다 이미지 리빌드를 강제한다. asset 추상화는 배우는 비용이 있고, task 기반보다 커뮤니티 자료가 적다. 그리고 위에 쓴 것처럼 배선 실수가 "조용히" 실패하는 유형의 사고를 만들 수 있다 — task가 없으면 에러가 나는 Airflow와 달리, asset이 그래프에 안 실리면 그냥 아무 일도 일어나지 않는다.

그럼에도 이 선택이 남긴 가장 큰 자산은 확장의 형태다. 이후 레이크하우스 asset, Hive 메타데이터 동기화 asset이 추가될 때마다 기존 job의 `.downstream()`에 편입시키는 것으로 끝났다. 새 스케줄도, 새 배선도 필요 없었다. 오케스트레이터의 단위가 데이터의 단위와 일치할 때 얻는 복리다.

다음 글: 이렇게 갖춘 오케스트레이션 위에서 조회 엔진을 정하는 이야기 — [[DuckDB는 저장소가 아니라 조회 엔진이다]]
