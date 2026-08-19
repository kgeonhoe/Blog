---
title: dbt 산출물이 메모리에서 사라지는 문제 — Trino + Iceberg 레이크하우스 도입기
categories:
  - "[[Projects]]"
tags:
  - stock-platform
  - dbt
  - trino
  - iceberg
  - lakehouse
  - minio
created: 2026-07-31
draft: false
---

## 한눈에 보기

- 문제: dbt-duckdb를 `:memory:`로 돌리면 `dbt run`이 끝나는 순간 결과 테이블이 사라진다. 파일 모드는 락 문제로 회귀한다.
- 원인: durable한 SQL 변환 산출물을 만들 실행 엔진과 테이블 포맷이 없었다.
- 선택: Trino + Iceberg + MinIO 레이크하우스. 단, bronze는 Iceberg로 복사하지 않고 Hive 커넥터로 zero-copy 노출.
- 결과: dbt 산출물이 별도 프로세스에서 재조회 가능한 진짜 테이블이 됐다. 그 과정에서 아키텍처를 하루 만에 한 번 뒤집었다.
- 핵심 교훈: 대안을 기각한 근거는 나중에 다시 검증하라. 틀린 기각 근거 하나가 불필요한 복사 아키텍처를 만들 뻔했다.

## 문제: `dbt run`이 끝나면 아무것도 남지 않는다

지표 계산 일부를 dbt로 옮기는 실험([[재귀 지표는 SQL로 풀 수 없다 - 실버 레이어가 Python에 남은 이유]])을 하면서 근본적인 문제에 부딪혔다. dbt-duckdb의 `path: ':memory:'` 설정에서 dbt `table` materialization은 실행 프로세스 안에만 존재한다. `dbt run`과 `dbt show`는 서로 다른 프로세스라 방금 만든 테이블을 다음 명령이 볼 수 없다. 검증조차 `on-run-end` 훅으로 결과를 파일로 내보내는 우회가 필요했다.

그렇다고 DuckDB 파일 모드로 돌리면 단일 writer 락 문제([[DuckDB는 저장소가 아니라 조회 엔진이다]])로 돌아간다. 여기에 기존 glob 방식의 한계가 겹쳤다 — bronze의 `**/*.parquet` 글롭은 파일 8만여 개 규모에서 view 생성에만 397~403초(2회 실측)가 걸렸고, NAS 대량 LIST 타임아웃 이력도 있었다.

정리하면 필요한 것은 세 가지였다. dbt가 만든 테이블이 프로세스가 죽어도 남을 것, 여러 클라이언트가 동시에 조회할 수 있을 것, 파일 목록 나열 없이 메타데이터로 스캔 범위를 결정할 것.

## 대안 비교

| 대안 | 평가 | 결론 |
|---|---|---|
| DuckDB `:memory:` + dbt table | 실행 프로세스 안에서만 존재 | 제외 |
| DuckDB external Parquet | commit/snapshot/동시 writer/schema evolution 관리 없음, incremental 미지원 | PoC 보조로만 |
| Trino + 일반 Hive Parquet | 파일 listing과 파티션 메타데이터 문제가 그대로 남음 | 전환 경로로만 |
| Presto + Iceberg | Trino 쪽이 문서·dbt 연동 기준 표준 | 제외 |
| **Trino + Iceberg + MinIO** | 메타데이터 기반 프루닝 + durable 테이블 + dbt-trino 어댑터 | **채택** |

Iceberg REST 카탈로그는 Lakekeeper(v0.12.0)를 썼다. 부수 결정 하나: Lakekeeper는 Postgres 15 이상을 요구하는데(`NULLS NOT DISTINCT` 구문), 기존 운영 Postgres는 13이었다. 운영 데이터가 있는 DB의 메이저 업그레이드는 리스크가 커서, 카탈로그 전용 postgres:16 컨테이너를 분리했다. "공유 인프라의 버전 요구가 갈리면 억지로 합치지 않는다"는 원칙이 여기서 생겼다.

## 하루 만에 뒤집은 결정: bronze는 복사하지 않는다

silver(dbt가 계산한 지표 테이블)를 Iceberg에 두는 건 자연스러웠다. 문제는 bronze였다. Trino가 bronze를 읽으려면 어떻게든 카탈로그에 등록해야 한다.

처음 선택은 pyiceberg로 bronze를 Iceberg 테이블에 **복사**하는 것이었다(Option C). Iceberg의 zero-copy 등록(`add_files`)이 파티션 테이블에서 Trino 버그(trinodb/trino#23866, 당시 open)로 막혀 있었기 때문에, 복사가 불가피하다고 봤다.

이 구조는 하루 만에 뒤집혔다. 계기는 "그냥 디렉토리 복사면 왜 Iceberg로 나눴냐, Trino가 그 디렉토리를 직접 읽으면 안 되냐"는 지적이었다. 다시 파보니 두 가지가 드러났다.

첫째, Hive 커넥터를 기각했던 근거("file metastore 방식은 문서에 명확히 없다")가 틀렸다. `hive.metastore=file`은 별도 Thrift 서버 없이 동작했다. 둘째, 더 근본적으로 — bronze는 이미 MinIO에 안전하게 있는 정본이다. Iceberg가 제공하는 durability 보증이 bronze에는 애초에 필요 없었다. 막힌 zero-copy를 우회해서 복사할 게 아니라, 복사 자체가 무의미했던 것이다.

그래서 만들었던 로더와 정합성 검증(reconciliation) 코드를 삭제하고, bronze는 Hive 커넥터로 기존 파일을 그대로 가리키는 external table로 노출했다. 사본이 없으니 drift라는 개념 자체가 사라졌고, 검증 코드도 함께 사라졌다. **silver는 계산된 결과물이라 durability가 실제로 필요하므로 Iceberg에 남는다** — 레이어마다 보증 요구가 다르다는 걸 이 사건으로 배웠다.

삭제된 코드에도 배울 게 있었다. reconciliation 검증을 심볼별 순차 조회로 짰더니 파일럿(2심볼)에선 멀쩡했는데 실제 유니버스(919심볼)에서 31분 만에 네트워크 오류로 붕괴했다. 단일 벌크 스캔으로 다시 짜니 38초. daily 스케줄은 첫날부터 전체 유니버스로 돌기 때문에, 이 버그는 반드시 프로덕션에서 터졌을 것이다. 파일럿 규모와 프로덕션 규모 사이의 함정은 이후 모든 설계에서 점검 항목이 됐다.

## incremental이 full-refresh보다 느렸던 날

silver 지표 테이블은 처음부터 **full-refresh로 고정**했다. OBV·SMA_60·CCI 같은 롤링 지표는 심볼별 전체 이력을 요구해서, 순진한 incremental은 워밍업 경계에서 **조용히 틀린 값**을 낸다. 빠르고 틀린 것보다 느리고 맞는 게 먼저였다.

나중에 파티션 프루닝을 전제로 incremental MERGE를 도입했을 때 예상 밖의 결과가 나왔다. NASDAQ 기준 incremental이 764.7초 — full-refresh(516.5초)보다 **느렸다**. `EXPLAIN ANALYZE`로 확인하니 Splits가 28,690개, 전체 파티션을 다 읽고 있었다. 원인은 두 겹이었다. 데이터 컬럼(`date`)에 건 필터로는 파티션 컬럼(`year`)이 프루닝되지 않고, 중간 staging 뷰가 `year`를 select조차 하지 않으면 프루닝 시도 자체가 불가능하다. 뷰에 파티션 컬럼을 통과시키고 lookback CTE에 `year IN`을 명시하자 Splits 28,690→7,995(72% 감소), 대기 시간 310초→39.5초(8배)가 됐다.

다만 정직하게 기록하면, 최종 개선 폭은 KRX 9.4%, NASDAQ 11.5%에 그쳤다. 장기 lookback 지표(sma_448의 730일)가 전체 이력의 상당 부분을 어차피 읽어야 하기 때문에 구조적으로 제한된 개선이었다. 순수 이득이라 유지했지만, "incremental = 극적으로 빠름"이라는 기대는 지표의 lookback 구조 앞에서 꺾인다.

이 밖에도 전체 유니버스 CTAS가 옵티마이저 타임아웃(기본 180초)에 반복적으로 걸려 세션 프로퍼티로 여유를 주는 우회(`iterative_optimizer_timeout: 10m` 등), NASDAQ bronze의 volume 물리 타입이 파일마다 int64/double로 섞여 있던 문제(pandas가 NaN 섞인 컬럼을 조용히 float64로 업캐스트한 흔적) 같은 자잘한 싸움이 있었다. 500개 파일을 샘플링한 검증에도 안 걸렸던 타입 혼재가 프로덕션 전체 스캔에서 터졌다.

## 쿼리 엔진은 별도 머신으로

레이크하우스가 자리 잡자 Trino와 Lakekeeper 체인(총 6개 서비스)을 데스크톱에서 별도 PC로 옮겼다. Trino "만" 옮길 수는 없었다 — hive 카탈로그는 Vault와 MinIO 접근만 있으면 되지만, iceberg 카탈로그는 Lakekeeper 체인 전체가 필요해서 의존성 요구가 갈린다. 체인 전체를 함께 옮기고, Vault는 LAN 너머로 참조하도록 남겼다(AppRole 자격증명이 TTL 없이 발급돼 있어 파일 복사만으로 인증이 유지됐다).

이관은 ansible 플레이북으로 자동화했고, 원격 Trino로의 `dbt build`는 PASS 5개, KRX 644만 행 + NASDAQ 1,205만 행을 총 838초에 빌드하며 검증을 마쳤다. 상시 켜져 있어야 하는 쿼리 엔진과 재부팅이 잦은 개발 머신을 분리한 것은 그 자체로 운영 안정성 개선이었다.

## 정리

| 얻은 것 | 감수한 것 |
|---|---|
| dbt 산출물이 프로세스와 무관하게 생존 | Trino/카탈로그/전용 Postgres라는 운영 대상 증가 |
| 메타데이터 기반 스캔 (glob LIST 소멸) | 원격 쿼리 엔진 가용성에 대한 의존 |
| bronze zero-copy — 사본도 drift도 없음 | Hive 커넥터의 파티션 나열 병목은 남음 (다음 글) |
| full-refresh의 정확성 | incremental의 속도 (부분적으로만 회복) |

가장 오래 남을 교훈은 번복의 경위다. 대안을 기각할 때 적어둔 근거는 시간이 지나면 사실이 아니게 되거나, 처음부터 틀렸을 수 있다. "왜 안 되는지"를 다시 물어봐 준 한 마디가 없었다면, 지금도 매일 bronze를 복사하며 정합성 검증을 돌리고 있었을 것이다.

Hive 커넥터로 남겨둔 bronze의 병목은 결국 따로 해결해야 했다 — [[쿼리 한 번에 104초 - 작은 파일 8만 개와의 싸움]].
