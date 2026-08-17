---
title: dbt incremental 모델 — is_incremental()의 한계와 파라미터 방식
tags:
  - dbt
  - incremental
  - data-modeling
draft: true
created: 2026-08-15
---

일별 시세 테이블처럼 매일 조금씩 쌓이는 데이터를 `table`로 만들면 매번 전체를 다시 굽는다. 데이터가 몇 년 치가 되면 이 비용이 감당이 안 된다. 그래서 `incremental`을 쓰는데, 튜토리얼에 나오는 형태를 그대로 쓰면 곧 다른 문제를 만난다.

코스피200 구성종목 일별 데이터를 예로, 같은 모델을 세 번 고쳐가며 무엇이 문제였고 어떻게 바꿨는지 정리한다.

## 1단계 — is_incremental()과 max(date)

가장 흔한 형태다.

```sql
{{
    config(
        materialized='incremental',
        incremental_strategy='delete+insert',
        unique_key=['target_index_name', 'ticker', 'date_kst']
    )
}}

select
    target_index_name
    , ticker
    , name
    , date_kst
from {{ source("main", "index_constituents") }}
where target_index_name = '코스피 200'
{% if is_incremental() %}
    and date_kst >= (
        select max(date_kst) from {{ this }}
    )
{% endif %}
```

`is_incremental()`은 세 조건이 모두 참일 때만 true다. 모델이 `incremental`로 설정돼 있고, 대상 테이블이 이미 존재하며, `--full-refresh`가 아닐 때다. 그래서 첫 실행에서는 Jinja 블록이 통째로 빠져 전체가 적재되고, 두 번째 실행부터 기존 테이블의 최대 날짜 이후만 읽는다.

`>=`인 것은 의도다. 마지막 날짜를 매번 다시 처리해서 그날 데이터가 덜 들어왔을 경우를 메운다. `delete+insert`와 `unique_key`가 중복을 막아준다.

여기까지는 잘 돈다. 문제는 넷이다.

**늦게 도착한 데이터를 영원히 못 잡는다.** 소스에서 사흘 전 데이터가 수정되거나 뒤늦게 들어와도, `max(date_kst)`는 이미 그보다 앞서 있다. 필터에 걸리지 않으니 그 수정은 반영되지 않는다. 조용히 틀린 채로 남는다.

**특정 날짜만 다시 돌릴 수 없다.** 4월 15일 데이터가 잘못 들어간 걸 발견해도, 그 하루만 재처리할 방법이 없다. `--full-refresh`로 전체를 다시 굽는 것 말고는 선택지가 없다. 몇 년 치라면 이건 사실상 불가능한 선택이다.

**멱등하지 않다.** 쿼리 결과가 `{{ this }}`, 즉 실행 시점의 대상 테이블 상태에 의존한다. 같은 코드를 같은 소스에 두 번 돌려도 대상 테이블이 어떤 상태였느냐에 따라 읽는 범위가 달라진다.

**개발 환경과 운영 환경의 결과가 갈린다.** 신규 환경에서 처음 빌드하면 전 기간이 들어가고, 기존 환경에서는 증분만 들어간다. 같은 코드로 만든 테이블인데 내용이 다르다. 로컬에서 재현이 안 되는 버그가 여기서 나온다.

## 2단계 — 날짜를 밖에서 주입한다

`{{ this }}` 의존을 끊고 대상 기간을 변수로 받는다.

```sql
select
    target_index_name
    , ticker
    , name
    , date_kst
from {{ source("main", "index_constituents") }}
where
    target_index_name = '코스피 200'
{% if is_incremental() %}
    and date_kst >= '{{ var("end_dt") }}'
    and date_kst <= '{{ var("end_dt") }}'
{% endif %}
```

실행할 때 값을 넘긴다.

```bash
dbt run --select kospi200_constituents_daily --vars '{"end_dt": "2025-04-15"}'
```

이제 특정 날짜만 재처리할 수 있다. 백필도 날짜를 바꿔가며 돌리면 된다. 앞의 세 문제 중 둘이 풀렸다.

그런데 필터가 여전히 `is_incremental()` 안에 있다. 최초 빌드나 `--full-refresh` 때는 이 블록이 사라지고 전 기간이 들어간다. 즉 **코드는 하나인데 실행 맥락에 따라 스캔 범위가 달라지는 구조**가 그대로 남아 있다. 네 번째 문제는 해결되지 않았다.

## 3단계 — 분기를 없앤다

`is_incremental()`을 아예 걷어낸다.

```sql
{{
    config(
        materialized='incremental',
        incremental_strategy='delete+insert',
        unique_key=['target_index_name', 'ticker', 'date_kst'],
        tags=["daily", "kr"]
    )
}}

select
    target_index_name
    , ticker
    , name
    , cast(date_kst as DATE) as date_kst
from {{ source("main", "index_constituents") }}
where
    target_index_name = '코스피 200'
    and date_kst >= CAST('{{ var("end_dt") }}' AS DATE) - INTERVAL '1 DAY'
    and date_kst <= '{{ var("end_dt") }}'
```

바뀐 게 둘이다.

**Jinja 분기가 사라졌다.** 최초 빌드든 증분이든 `--full-refresh`든, 언제나 `end_dt` 기준의 같은 기간만 읽는다. 개발과 운영이 같은 코드로 같은 결과를 낸다. 컴파일된 SQL을 보면 실행 맥락과 무관하게 항상 같은 모양이다.

**룩백이 생겼다.** `- INTERVAL '1 DAY'`로 하루를 더 읽는다. 전날 데이터가 뒤늦게 수정됐으면 이때 다시 덮인다. `delete+insert`가 해당 기간의 기존 행을 지우고 새로 넣으므로 중복이 생기지 않는다. 소스 지연이 이틀까지 있다면 룩백을 2일로 늘리면 된다. 첫 번째 문제가 여기서 풀린다.

대신 포기하는 게 있다. `--full-refresh`를 해도 전체가 채워지지 않는다. 전 기간 재적재는 `end_dt`를 바꿔가며 반복 실행하는 별도 백필 작업이 된다. 이건 손해라기보다 성격 변화에 가깝다. "전체 재빌드"가 우발적으로 일어나지 않고 명시적인 작업이 된다.

## 하류 모델에도 같은 필터를 건다

증분 모델을 조인하는 하류 모델에 필터를 안 걸면, 상류는 하루치만 읽어놓고 조인 단계에서 전체를 스캔하게 된다.

```sql
{{
    config(
        materialized = "incremental",
        incremental_strategy='delete+insert',
        unique_key=['ticker', 'date_kst'],
        tags=["price", "daily", "kr"]
    )
}}
select
    t1.target_index_name
    , t1.ticker
    , t1.date_kst
    , t2.close
    , t2.volume
from {{ ref("kospi200_constituents_daily") }} as t1
left join {{ ref("price_daily_merged") }} as t2
    on t1.ticker = t2.ticker
    and t1.date_kst = t2.date_kst
where
    t1.date_kst >= CAST('{{ var("end_dt") }}' AS DATE) - INTERVAL '1 DAY'
    and t1.date_kst <= '{{ var("end_dt") }}'
    and t2.date_kst >= CAST('{{ var("end_dt") }}' AS DATE) - INTERVAL '1 DAY'
    and t2.date_kst <= '{{ var("end_dt") }}'
```

조인 양쪽에 각각 걸어야 한다. 한쪽만 걸면 반대편 테이블은 그대로 다 읽는다. 여러 소스를 `union all`로 합치는 모델이라면 CTE마다 필터를 넣는다.

이 반복이 이 방식의 가장 큰 단점이다. 모델이 늘어날수록 같은 날짜 필터를 복붙하게 되고, 하나 빠뜨리면 조용히 느려진다.

## delete+insert와 merge

`delete+insert`는 `unique_key`로 매칭되는 기존 행을 지우고 새로 넣는다. `unique_key`가 필수다. merge를 지원하지 않는 엔진이거나, unique_key가 엄격하게 유일하지 않을 때 쓴다. 아주 큰 테이블에서는 merge보다 비효율적이다.

기본 전략인 `merge`는 매칭되면 update, 아니면 insert다.

여기서 `delete+insert`를 고른 이유는 갱신 단위가 행이 아니라 기간이기 때문이다. "이 날짜 구간을 통째로 지우고 다시 넣는다"가 의미상 자연스럽고, 소스에서 행이 삭제된 경우까지 반영된다. merge는 소스에 없어진 행을 대상 테이블에서 지워주지 않는다.

## end_dt는 오케스트레이터가 준다

이 설계의 전제는 실행 시점의 날짜를 외부에서 받는다는 것이다. Airflow에 Cosmos를 붙이면 `dbt_vars`로 넘긴다.

```python
@dag(dag_id="dag_with_dbt", schedule_interval="@daily", max_active_runs=1)
def dbt_dag():
    vars = {
        "end_dt": "{{ data_interval_end.in_timezone('Asia/Seoul').strftime('%Y-%m-%d') }}"
    }

    DbtTaskGroup(
        group_id="model_group",
        project_config=ProjectConfig(
            manifest_path="/usr/local/dbt_repo/target/manifest.json",
            project_name="my_first_dbt",
            dbt_vars=vars,
        ),
        render_config=RenderConfig(
            load_method=LoadMode.DBT_MANIFEST,
            test_behavior=TestBehavior.AFTER_EACH,
            select=["+price_of_kospi200_daily"],
        ),
        ...
    )
```

`data_interval_end`를 쓰는 게 핵심이다. `datetime.now()`를 쓰면 과거 구간을 다시 돌릴 때 `end_dt`가 전부 오늘 날짜로 찍혀서 백필이 통째로 망가진다. 스케줄러가 관리하는 실행 구간 값을 그대로 넘겨야 catchup이 각 날짜에 맞는 값을 받는다.

`select=["+price_of_kospi200_daily"]`의 `+`는 상류 모델까지 포함한다는 뜻이다. 모델에 붙여둔 `tags`로 `config.tags:kr`처럼 고를 수도 있다. `max_active_runs=1`은 증분 모델에서 중요하다. 여러 날짜가 동시에 같은 테이블을 지우고 넣으면 경합이 난다.

## dbt 1.9부터는 microbatch가 있다

위에서 손으로 짠 패턴(외부 파라미터, 룩백, 분기 제거)이 `microbatch` 전략으로 표준화됐다.

```sql
{{
    config(
        materialized='incremental',
        incremental_strategy='microbatch',
        event_time='event_occurred_at',
        batch_size='day',
        lookback=3,
        begin='2020-01-01',
        full_refresh=false
    )
}}

select * from {{ ref('stg_events') }}   -- 이 ref가 자동으로 기간 필터링된다
```

`ref`가 자동 필터링된다는 게 크다. 하류 모델마다 날짜 필터를 복붙하던 문제가 사라진다. `lookback`은 재처리할 이전 배치 수이고, 백필은 CLI 옵션으로 한다.

```bash
dbt run --event-time-start "2024-09-01" --event-time-end "2024-09-04"
```

`full_refresh=false`를 걸면 실수로 전체가 다시 구워지는 것도 막힌다. 배치는 각각 별도 트랜잭션으로 돌아서 일부가 실패해도 나머지는 남는다.

새로 짠다면 microbatch부터 검토하는 게 맞다. 다만 어댑터마다 지원 여부가 다르고 `event_time` 컬럼 지정이 전제이므로, 안 되는 환경에서는 3단계 패턴이 그대로 대안이 된다. 결국 하는 일은 같다.

## 정리

| 단계 | 필터 기준 | 특정 날짜 재처리 | 늦게 온 데이터 | full-refresh 시 동작 |
|---|---|---|---|---|
| `max({{ this }})` | 대상 테이블 상태 | 불가 | 반영 안 됨 | 전 기간 |
| `is_incremental()` + var | 외부 변수 | 가능 | 룩백 없음 | 전 기간 |
| 분기 제거 + 룩백 | 외부 변수 | 가능 | 룩백만큼 보정 | 지정 기간만 |
| `microbatch` | `event_time` 자동 | CLI 옵션 | `lookback` | `full_refresh=false`로 차단 |

핵심은 "얼마나 읽을지를 대상 테이블에게 묻지 않는다"다. 대상 테이블 상태를 기준으로 삼는 순간 재현이 안 되고, 재현이 안 되면 백필도 디버깅도 안 된다.

## 관련 글

- [[dbt 실전 기능 5종 정리]] — Source Freshness, Hook, Macro, Test, Docs
- [[Dagster 파티션키와 스케줄 실전 구성]] — Dagster로 같은 일을 할 때의 파티션키
