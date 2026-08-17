---
title: Dagster 파티션키와 스케줄 실전 구성
tags:
  - dagster
  - orchestration
  - partitioning
draft: true
created: 2026-08-15
---

개념은 [[Dagster의 자산 중심 워크플로우]]에 정리했고, 여기서는 파일을 어디에 두고 무엇을 클래스로 빼고 파티션키를 어떻게 붙여서 UI에서 초록 칸을 보게 만드는지를 다룬다.

## 파일 구조와 진입점

Dagster 프로젝트의 진입점은 딱 하나, `Definitions` 객체다. 이 객체가 asset·job·schedule·sensor·resource를 전부 들고 있고, `dagster dev`나 데몬은 이걸 찾아서 로드한다.

```
my-project
├── pyproject.toml
├── src
│   └── my_project
│       ├── __init__.py
│       ├── definitions.py      ← 진입점. 여기서 다 모은다
│       ├── resources.py        ← 접속·설정 클래스
│       ├── partitions.py       ← 파티션 정의 모음
│       └── defs
│           ├── __init__.py
│           ├── ingest.py       ← asset 정의
│           └── mart.py
└── tests
```

`defs/` 밑에 파일만 만들어두면 자동으로 긁어가는 방식(`dg.load_from_defs_folder`)도 있고, 예전처럼 `definitions.py`에서 명시적으로 나열하는 방식도 있다. 나는 명시 방식을 선호한다. 무엇이 로드되는지가 파일 하나에 다 보이기 때문이다.

```python
# src/my_project/definitions.py
import dagster as dg

from my_project.defs import ingest, mart
from my_project.resources import DuckDBWarehouse
from my_project.schedules import daily_ingest_job, daily_ingest_schedule

defs = dg.Definitions(
    assets=[*ingest.all_assets, mart.daily_sales_summary],
    jobs=[daily_ingest_job],
    schedules=[daily_ingest_schedule],
    resources={
        "warehouse": DuckDBWarehouse(database_path=dg.EnvVar("DUCKDB_PATH")),
    },
)
```

`dg.EnvVar`를 쓰면 값이 코드에 박히지 않고 실행 시점에 환경변수에서 읽힌다. UI의 Resource 탭에도 값이 마스킹돼서 표시된다.

## 접속·설정을 클래스로 빼기

Dagster는 DB 커넥션, API 클라이언트, 파일 경로 같은 외부 의존성을 `ConfigurableResource`를 상속한 클래스로 정의한다. Pydantic 모델이라 필드 타입이 그대로 검증된다.

```python
# src/my_project/resources.py
from contextlib import contextmanager

import duckdb
import dagster as dg


class DuckDBWarehouse(dg.ConfigurableResource):
    database_path: str
    read_only: bool = False

    @contextmanager
    def connect(self):
        conn = duckdb.connect(self.database_path, read_only=self.read_only)
        try:
            yield conn
        finally:
            conn.close()

    def execute(self, sql: str) -> int:
        with self.connect() as conn:
            cur = conn.execute(sql)
            return cur.rowcount or 0
```

asset에서는 **인자 이름으로 주입**받는다. `Definitions(resources={"warehouse": ...})`의 키와 함수 인자명이 같아야 한다.

```python
import dagster as dg

from my_project.resources import DuckDBWarehouse


@dg.asset
def raw_orders(context: dg.AssetExecutionContext, warehouse: DuckDBWarehouse) -> None:
    rows = warehouse.execute(
        "CREATE OR REPLACE TABLE raw_orders AS SELECT * FROM read_csv('data/orders/*.csv')"
    )
    context.log.info(f"loaded {rows} rows")
```

이렇게 빼두면 테스트할 때 `raw_orders(build_asset_context(), DuckDBWarehouse(database_path=":memory:"))`처럼 직접 호출할 수 있다. Airflow의 Connection/Hook을 쓰다가 넘어오면 이 부분이 제일 편하다. 커넥션이 전역 상태가 아니라 함수 시그니처에 드러난다.

기존에 이미 만들어둔 클래스가 있어서 `ConfigurableResource`를 상속시키기 곤란하면 `create_resource`로 감싼다.

```python
class WarehouseResource(dg.ConfigurableResource):
    dsn: str

    def create_resource(self, context: dg.InitResourceContext) -> LegacyWarehouseClient:
        return LegacyWarehouseClient(self.dsn)   # 기존 클래스 그대로
```

## 파티션키 정의

파티션 정의는 별도 모듈로 빼서 여러 asset이 같은 객체를 공유하게 한다. 파티션 정의가 다르면 asset끼리 의존을 걸 때 매핑을 따로 써야 해서 피곤하다.

```python
# src/my_project/partitions.py
import dagster as dg

daily = dg.DailyPartitionsDefinition(
    start_date="2024-01-01",
    timezone="Asia/Seoul",
)

region = dg.StaticPartitionsDefinition(["KR", "JP", "US"])

# 날짜 × 지역 2차원
daily_by_region = dg.MultiPartitionsDefinition(
    {"date": daily, "region": region}
)
```

asset에 붙이고 실행 중에는 `context.partition_key`로 꺼내 쓴다.

```python
import dagster as dg

from my_project.partitions import daily
from my_project.resources import DuckDBWarehouse


@dg.asset(partitions_def=daily, group_name="ingest")
def daily_sales(
    context: dg.AssetExecutionContext, warehouse: DuckDBWarehouse
) -> dg.MaterializeResult:
    date = context.partition_key            # "2026-08-14"

    rows = warehouse.execute(f"""
        CREATE OR REPLACE TABLE daily_sales_{date.replace('-', '')} AS
        SELECT * FROM raw_sales WHERE order_date = DATE '{date}'
    """)

    return dg.MaterializeResult(
        metadata={
            "partition": date,
            "dagster/row_count": rows,
        }
    )
```

`MaterializeResult`의 metadata는 UI 파티션 칸을 클릭하면 그대로 보인다. row_count를 넣어두면 어느 날짜에 데이터가 비었는지 파티션 그리드만 봐도 잡힌다. 이게 Airflow 대비 체감이 제일 큰 부분이다.

멀티 파티션은 키가 문자열이 아니라 객체로 온다.

```python
@dg.asset(partitions_def=daily_by_region)
def sales_by_region(context: dg.AssetExecutionContext) -> None:
    keys = context.partition_key.keys_by_dimension
    date, region = keys["date"], keys["region"]
```

백필처럼 여러 파티션을 한 번에 처리할 때는 파티션마다 런을 띄우는 대신 범위로 한 번에 처리할 수 있다. dbt나 Spark처럼 엔진이 병렬을 알아서 하는 경우 이쪽이 훨씬 싸다.

```python
@dg.asset(
    partitions_def=daily,
    backfill_policy=dg.BackfillPolicy.single_run(),
)
def events(context: dg.AssetExecutionContext) -> None:
    start, end = context.partition_time_window   # datetime 두 개
    overwrite_range(start, end)
```

## 클래스와 팩토리로 asset 찍어내기

소스가 10개인데 로직이 같다면 asset을 10번 복붙할 이유가 없다. asset 데코레이터는 함수를 `AssetsDefinition` 객체로 바꿔주는 것뿐이라, 함수 안에서 만들어 리턴하면 그대로 팩토리가 된다.

```python
# src/my_project/defs/ingest.py
from dataclasses import dataclass

import dagster as dg

from my_project.partitions import daily
from my_project.resources import DuckDBWarehouse


@dataclass(frozen=True)
class SourceSpec:
    name: str
    endpoint: str
    owner: str


SOURCES = [
    SourceSpec("orders", "https://api.example.com/orders", "gray"),
    SourceSpec("customers", "https://api.example.com/customers", "gray"),
    SourceSpec("products", "https://api.example.com/products", "data-team"),
]


def build_ingest_asset(spec: SourceSpec) -> dg.AssetsDefinition:
    @dg.asset(
        name=f"raw_{spec.name}",
        key_prefix=["raw"],
        group_name="ingest",
        partitions_def=daily,
        metadata={"owner": spec.owner, "endpoint": spec.endpoint},
    )
    def _asset(
        context: dg.AssetExecutionContext, warehouse: DuckDBWarehouse
    ) -> dg.MaterializeResult:
        date = context.partition_key
        payload = fetch(spec.endpoint, date=date)
        rows = warehouse.execute(load_sql(spec.name, payload, date))
        return dg.MaterializeResult(metadata={"dagster/row_count": rows})

    return _asset


all_assets = [build_ingest_asset(spec) for spec in SOURCES]
```

주의할 점은 `name`을 반드시 다르게 줘야 한다는 것이다. 안 그러면 asset key가 충돌해서 로드 자체가 실패한다. 나는 처음에 이걸 놓쳐서 `Duplicate asset key` 에러를 한참 봤다.

## Job과 스케줄

asset을 골라 job으로 묶고, job에 스케줄을 건다. 파티션 job은 스케줄을 직접 쓰지 않고 `build_schedule_from_partitioned_job`으로 만드는 게 기본이다. 파티션 주기(daily)에서 cron을 자동으로 유도하고, 실행 시점의 파티션키까지 알아서 채워준다.

```python
# src/my_project/schedules.py
import dagster as dg

from my_project.partitions import daily

daily_ingest_job = dg.define_asset_job(
    name="daily_ingest_job",
    selection=dg.AssetSelection.groups("ingest"),
    partitions_def=daily,
)

daily_ingest_schedule = dg.build_schedule_from_partitioned_job(
    daily_ingest_job,
    name="daily_ingest_schedule",
)
```

실행 시각이나 대상 파티션을 직접 제어하고 싶으면 `@dg.schedule`로 내려간다. 새벽 6시 30분에 어제 파티션을 돌리는 형태다.

```python
from datetime import timedelta

import dagster as dg


@dg.schedule(
    job=daily_ingest_job,
    cron_schedule="30 6 * * *",
    execution_timezone="Asia/Seoul",
)
def daily_ingest_schedule(context: dg.ScheduleEvaluationContext):
    target = (context.scheduled_execution_time.date() - timedelta(days=1)).isoformat()
    return dg.RunRequest(run_key=target, partition_key=target)
```

`run_key`를 파티션키와 같게 주면 같은 키로는 런이 중복 생성되지 않는다. 데몬이 재시작되거나 틱이 두 번 평가돼도 중복 실행이 막힌다.

스케줄은 정의만으로는 안 돈다. `dagster-daemon`이 떠 있어야 하고(`dagster dev`는 데몬을 같이 띄운다), UI의 Automation 탭에서 토글이 켜져 있어야 한다. 여기서 안 켜서 "왜 안 돌지" 하는 경우가 흔하다.

cron 대신 의존성 기반으로 굴리려면 `AutomationCondition`을 쓴다. 업스트림 파티션이 채워지면 다운스트림이 알아서 따라 도는 방식이다.

```python
@dg.asset(
    partitions_def=daily,
    deps=[dg.AssetKey(["raw", "raw_orders"])],
    automation_condition=dg.AutomationCondition.eager(),
)
def stg_orders(context: dg.AssetExecutionContext) -> None: ...
```

## Launchpad에서 파라미터 넣고 실행

Launchpad는 UI에서 런 설정(run config)을 YAML로 넣고 수동 실행하는 화면이다. Jobs → 해당 job → Launchpad 탭에 있다. 파티션 job이면 상단에 파티션 선택 드롭다운이 붙고, 파티션을 고르면 해당 키로 태그가 자동으로 채워진다.

Launchpad에서 값을 받으려면 asset에 `dg.Config` 클래스를 인자로 선언한다.

```python
import dagster as dg


class IngestConfig(dg.Config):
    force_refresh: bool = False
    row_limit: int = 100_000


@dg.asset(partitions_def=daily, group_name="ingest")
def raw_orders(
    context: dg.AssetExecutionContext,
    config: IngestConfig,
    warehouse: DuckDBWarehouse,
) -> None:
    if config.force_refresh:
        warehouse.execute("DROP TABLE IF EXISTS raw_orders")
    context.log.info(f"limit={config.row_limit}")
```

Launchpad에 붙여넣는 YAML은 이렇게 생겼다. asset도 내부적으로는 op이라 `ops:` 아래에 asset 이름으로 들어간다.

```yaml
ops:
  raw_orders:
    config:
      force_refresh: true
      row_limit: 5000
```

`Scaffold missing config` 버튼을 누르면 기본 골격을 자동으로 채워준다. 타입이 틀리면 실행 전에 빨간 줄로 잡히기 때문에, 잘못된 설정으로 런을 태우는 일이 없다.

터미널에서 특정 파티션만 돌릴 수도 있다. 백필 재현이나 디버깅에는 이쪽이 빠르다.

```bash
dagster asset materialize \
  -m my_project.definitions \
  --select raw/raw_orders \
  --partition 2026-08-14
```

## 실행되면 파티션이 완료로 뜨는 원리

이 부분은 별도 설정이 없다. asset 함수가 예외 없이 끝나면 Dagster가 그 런의 파티션키로 `AssetMaterialization` 이벤트를 이벤트 로그에 기록하고, UI의 파티션 그리드는 그 이벤트를 기준으로 칸을 칠한다.

- 초록: 해당 파티션의 materialization 이벤트가 있음
- 회색: 이벤트 없음(한 번도 안 돎)
- 빨강: 마지막 시도가 실패

그래서 파티션이 완료로 안 뜬다면 원인은 대개 셋 중 하나다.

1. **런에 파티션키가 안 붙었다.** `partitions_def` 없는 asset을 돌렸거나, `RunRequest`에 `partition_key`를 안 넘겼다. 런 상세의 태그에서 `dagster/partition` 값을 확인하면 바로 보인다.
2. **함수가 예외로 끝났다.** 중간까지 잘 돌았어도 마지막에 터지면 materialization은 기록되지 않는다. 부분 성공을 남기고 싶으면 중간에 `yield dg.MaterializeResult(...)`를 명시적으로 낸다.
3. **이벤트 로그가 날아갔다.** `DAGSTER_HOME`을 안 잡아두면 임시 디렉터리에 SQLite로 저장돼서 재시작 때 상태가 사라진다. 파티션 이력이 매번 초기화되면 이걸 의심한다.

```bash
export DAGSTER_HOME=/opt/dagster/home   # dagster.yaml이 여기 놓인다
dagster dev
```

운영에서는 `dagster.yaml`에서 스토리지를 Postgres로 바꿔둔다. 파티션 상태가 곧 운영 대시보드라, 이게 날아가면 Dagster를 쓰는 이유의 절반이 없어진다.

```yaml
# $DAGSTER_HOME/dagster.yaml
storage:
  postgres:
    postgres_db:
      username:
        env: DAGSTER_PG_USER
      password:
        env: DAGSTER_PG_PASSWORD
      hostname:
        env: DAGSTER_PG_HOST
      db_name: dagster
      port: 5432
```

## 붙이면서 걸렸던 것들

`define_asset_job`의 `partitions_def`는 선택한 asset들의 파티션 정의와 같아야 한다. 그룹 안에 파티션 없는 asset이 섞여 있으면 job 생성 단계에서 막힌다. 그룹을 나누거나 `AssetSelection.assets(...)`로 명시하는 편이 낫다.

`DailyPartitionsDefinition`의 마지막 파티션은 "현재 시각 이전에 끝나는 구간"까지다. 오늘 날짜 파티션을 오늘 돌리려면 `end_offset=1`을 줘야 한다. 이걸 모르고 "오늘 칸이 왜 없지" 하고 헤맸다.

파티션 정의를 나중에 바꾸면(시작일 변경, 주기 변경) 기존 파티션키와 매칭이 깨져서 과거 이력이 회색으로 돌아간다. 파티션 정의는 처음에 신중하게 잡고, 바꿔야 한다면 asset key를 새로 파는 쪽이 안전하다.

## 관련 글

- [[Dagster의 자산 중심 워크플로우]]
- [[Airflow 3와 Dagster 비교]]
