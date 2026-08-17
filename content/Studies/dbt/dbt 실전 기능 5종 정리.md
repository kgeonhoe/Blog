---
title: dbt 실전 기능 5종 — Source Freshness, Hook, Macro, Test, Docs
tags:
  - dbt
  - data-modeling
draft: true
created: 2026-08-15
---

Stored Procedure로 굴리던 마트를 dbt로 옮기면서 실제로 손댔던 기능들을 문법 중심으로 정리한다. 예시의 테이블·컬럼명은 전부 가명이다. 이 기능들을 실제 프로젝트에서 어디까지 정착시켰는지(그리고 어디서 실패했는지)는 [[Projects/customer-analytics-mart/고객마트 Dagster 통합|고객마트 Dagster 통합]]에 따로 정리했다.

dbt는 model이라는 단위를 쓴다. 쉽게 말해 하나의 SQL 테이블을 구성하는 파일이다. view, source, table이 전부 model 단위에 들어간다. 프로젝트 폴더 안에 `.sql` 파일을 만들면 그걸 모델로 인식한다.

## Source Freshness

마트를 구성하는 소스 테이블의 업데이트 일자를 감시한다. 상류 데이터가 갱신되지 않은 채로 마트를 다시 빌드하면, 실패 없이 낡은 데이터가 그대로 내려간다. 이걸 잡아주는 기능이다.

`sources` 정의에서 테이블별로 지정한다. 하루가 지나면 warn, 닷새가 지나면 error를 낸다.

```yaml
sources:
  - name: analytics_db
    database: analytics_db
    schema: dbo
    tables:
      - name: view_policy_recent_month
        loaded_at_field: etl_date
        freshness:
          warn_after: {count: 1, period: day}
          error_after: {count: 5, period: day}

      - name: campaign_db
      - name: coverage_control
```

`loaded_at_field`가 없는 테이블은 freshness 판정에서 빠진다. 위 예시의 아래 두 개가 그렇다. 실행은 `dbt source freshness`로 별도로 돌린다. `dbt run`에 딸려오지 않는다.

주의할 건 이게 소스 하나하나에 붙는 설정이라는 점이다. 첫 사례를 정확히 만들어놓고 나머지 소스에 전파하지 않으면, 감시하고 있다고 착각한 채 대부분이 무방비로 남는다.

## Hook으로 모델별 실행 시간 남기기

각 모델의 시작·종료 시간을 기록해두면 나중에 쿼리 튜닝할 때 어디부터 볼지 정하는 근거가 된다. `dbt_project.yml`에 프로젝트 전체 훅을 건다.

```yaml
models:
  my_dbt_project:
    +pre-hook:
      - "INSERT INTO dbt_model_logs (model_name, start_time) VALUES ('{{ this.name }}', GETDATE())"
    +post-hook:
      - "UPDATE dbt_model_logs SET end_time = GETDATE() WHERE model_name = '{{ this.name }}' AND end_time IS NULL"

    staging:
      +materialized: view
    subtable:
      +materialized: table
    marts:
      +materialized: table
```

두 가지를 짚어둔다.

첫째, 이 YAML은 문법이 깨져도 조용히 무시되는 게 아니라 `dbt parse` 단계에서 실패한다. 반대로 들여쓰기가 미묘하게 어긋나 훅이 엉뚱한 경로에 붙으면, 에러 없이 그냥 안 걸린다. 훅을 설정한 뒤에는 로그 테이블에 실제로 행이 쌓이는지 한 번은 확인해야 한다.

둘째, dbt는 이미 `target/run_results.json`에 모델별 실행 시간을 남긴다. 훅으로 DB에 따로 적재하는 건 그걸 SQL로 조회하고 싶을 때만 의미가 있다. 기능이 중복이라는 걸 알고 선택하는 것과 모르고 만드는 건 다르다.

## Macro

자주 쓰는 함수, 주로 날짜 연산을 macro로 빼면 반복 코드가 줄어든다. 캠페인 월 기준 1개월 전, 2개월 후 같은 조건에 쓴다.

```sql
-- macros/add_month.sql
{% macro add_month(returnstring, datepart, interval, campmonth) %}
  CONVERT(VARCHAR(6), DATEADD({{ datepart }}, {{ interval }}, CONVERT(DATE, {{ campmonth }} + '01', 112)), 112)
{% endmacro %}
```

`run_query`를 쓰면 컴파일 시점에 실제 쿼리를 날려 결과를 매크로 안에서 쓸 수 있다. 스냅샷 테이블의 최신 기준월을 동적으로 가져오는 식이다.

```sql
{% macro get_latest_snapshot_month() %}
  {% set latest_month_query %}
    select top 1 base_ym
    from dw.dbo.policy_analysis
    order by base_ym desc
  {% endset %}

  {% set latest_month_result = run_query(latest_month_query) %}
  {% if latest_month_result %}
    {% set latest_month_value = latest_month_result.columns[0].values()[0] %}
  {% endif %}

  {{ return("'" ~ latest_month_value ~ "'") }}
{% endmacro %}
```

이 패턴은 검색해도 잘 안 나오는데 꽤 유용하다. 다만 `run_query`는 컴파일 때마다 DB를 때리므로 매크로 안에서 남발하면 빌드가 느려진다. 그리고 `dbt parse`나 docs 생성 시점에도 실행되기 때문에, DB에 붙을 수 없는 환경에서는 파싱 자체가 막힌다.

직접 만들기 전에 `dbt_utils`에 이미 있는지 보는 게 낫다. 날짜 차원 테이블은 `date_spine` 하나로 끝난다.

```sql
-- models/calendar.sql
{{ dbt_utils.date_spine(
    datepart="day",
    start_date="cast('2019-01-01' as date)",
    end_date="cast('2020-01-01' as date)"
) }}
```

`end_date`는 미포함이다. 모델 파일에 매크로 호출 하나만 있어도 되는 게 눈에 띈다. 매크로가 SELECT 문을 통째로 만들어내기 때문이다.

## Test

`dbt_utils`의 `unique_combination_of_columns`로 복합키 중복을 잡는다. 고객 마스터처럼 그레인이 중요한 테이블은 키가 중복되면 하류 집계가 통째로 틀어지기 때문에 정합성 테스트가 필수다.

```yaml
version: 2
models:
  - name: orders
    tests:
      - dbt_utils.unique_combination_of_columns:
          combination_of_columns:
            - order_id
            - customer_id
```

`dbt_utils`는 `packages.yml`에 선언하고 `dbt deps`로 받아야 쓸 수 있다.

여기까지가 generic test, 즉 YAML에 선언해 여러 모델에 재사용하는 방식이다. 도메인 규칙처럼 한 모델에만 해당하는 검증은 `tests/` 폴더에 SQL 파일로 쓴다. 이걸 singular test라고 한다. **행이 하나라도 반환되면 실패**로 판정하므로, "있으면 안 되는 것"을 select하도록 쓴다.

```sql
-- tests/price_data_high_is_highest.sql
select ticker
from {{ ref("price_daily_merged") }}
where
    high < low
    or high < close
    or high < open
```

고가가 저가·종가·시가보다 낮은 행은 존재할 수 없다. 이런 건 `not_null`이나 `unique`로는 잡히지 않는다. 스키마 제약이 아니라 도메인 제약이라서 그렇다.

테스트는 한 번 붙여놓으면 만족스러운데, 모델이 수십 개로 늘어날 때 커버리지가 따라오지 않는 게 흔한 실패 모드다. 신규 모델 추가 시 테스트도 같이 요구하는 규칙이 없으면 첫 몇 개에서 멈춘다.

## Docs와 group·tags

`schema.yml`에 모델과 컬럼 설명을 달아두면 `dbt docs generate` 후 웹 UI에서 검색이 된다. 어떤 테이블에 어떤 컬럼이 있는지 바로 찾을 수 있어 유지 보수에 도움이 된다.

```yaml
models:
  - name: sub_customer_consent
    config:
      group: subtable
    description: 고객 마케팅 동의 현황
    columns:
      - name: customer_id_key
        description: 고객ID
      - name: marketing_agree_yn
        description: 마케팅 수신 동의 여부
```

tags로 지정하면 해당 태그가 붙은 모델만 묶어서 실행할 수 있다. `dbt run --select tag:모수테이블` 식이다.

```sql
{{ config(
    materialized='table',
    tags=['증권단위', 'campmonth', '모수테이블']
) }}
```

group으로 지정하면 Dagster UI에서도 그대로 그룹으로 묶여서 보인다. dbt 쪽 메타데이터가 오케스트레이터로 이어지는 지점이다.

![](https://i.imgur.com/GNnSOAC.png)

description은 양보다 내용이다. 컬럼명을 그대로 풀어 쓴 설명("고객ID → 고객 ID")은 없느니만 못하고, 판정 임계값이나 정책 변경 이력을 적어두면 실제로 찾아보게 된다.

`meta`로 임의의 키를 붙여둘 수도 있다. 소유 팀이나 성숙도 같은 것이다.

```sql
{{ config(
    materialized='table',
    tags=['price', 'daily'],
    meta={"maturity": "develop", "owner": "teamA"}
) }}
```

`tags`와 마찬가지로 선택자로 쓸 수 있어서, `--select config.meta.maturity:develop`처럼 개발 중인 모델만 골라 돌리는 게 된다.

### exposure — 리니지의 끝을 표시한다

리니지는 보통 모델에서 끊긴다. 그 테이블을 실제로 누가 쓰는지는 그래프에 안 나온다. `exposures.yml`은 대시보드나 애플리케이션 같은 하류 소비처를 리니지에 등록한다.

```yaml
version: 2

exposures:
  - name: quant_app
    label: 퀀트 대시보드
    type: application
    maturity: high
    url: https://example.com/dashboard
    description: 일별 시세 기반 종목 스크리닝 화면
    depends_on:
      - ref('price_daily_merged')
    owner:
      name: Gray
      email: gray@example.com
```

이걸 등록해두면 `dbt run --select +exposure:quant_app`으로 그 화면이 의존하는 모델만 골라 돌릴 수 있다. 모델을 지우거나 컬럼을 바꾸기 전에 무엇이 깨지는지 확인하는 용도로도 쓴다. type은 `dashboard`, `notebook`, `analysis`, `ml`, `application` 중에서 고른다.

## ephemeral의 한계

dbt에는 임시 테이블 기능이 없다. 비슷한 것으로 materialization 전략 중 `ephemeral`이 있는데, 이건 물리 테이블을 만들지 않고 해당 모델을 참조하는 쿼리에 CTE로 끼워 넣어주는 기능일 뿐이다.

단계 분해용으로는 잘 맞는다. 프로시저의 `#temp` 테이블을 옮길 때처럼, 중간 산출물을 물리 테이블로 남기고 싶지 않은 경우가 그렇다.

문제는 참조 방식이 복잡해질 때다. ephemeral로 지정한 모델을 left join으로 병합하려다 에러가 나서, 결국 `table`로 지정해 만들었다. 세분화된 dimension을 여러 집계 모델에서만 쓰는 중간 산출물로 두고 싶었는데, 용량이 제한된 DB에 그만한 데이터를 계속 들고 있게 된 셈이다.

`WITH`로 직접 감싸면 회피될 것으로 보고 있는데, 아직 테스트해보지 않았다.

```sql
WITH TBL1 AS (
    SELECT * FROM {{ ref('join_table') }}
)
SELECT A.*, B.col1
FROM {{ ref('from_table') }} A
LEFT JOIN TBL1 B ON A.id = B.id
```

정리하면 ephemeral은 "선형으로 한 번 참조되는 중간 단계"에 쓰고, 여러 곳에서 조인되는 재사용 대상이면 처음부터 `table`이나 `view`로 두는 게 안전하다.

## 자잘한 것

profile을 프로젝트 밖에 두고 쓸 때는 `--profiles-dir`로 지정한다.

```bash
dbt debug --profiles-dir /path/to/project/
```

## 관련 글

- [[Projects/customer-analytics-mart/고객마트 Dagster 통합|이 기능들을 실제 프로젝트에서 어디까지 정착시켰나]]
- [[Dagster의 자산 중심 워크플로우]] — dbt 모델이 asset으로 올라오는 쪽
