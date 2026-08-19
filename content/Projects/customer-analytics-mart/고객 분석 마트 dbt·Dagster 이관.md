---
title: SP에 몰아넣던 고객 분석 마트, dbt와 Dagster로 옮기기
created: 2026-08-17
tags:
  - project
  - portfolio
draft: false
---


# SP에 몰아넣던 고객 분석 마트, dbt와 Dagster로 옮기기

> 보험사 TM 캠페인용 고객 리스트를 매주 뽑던 Stored Procedure 2~3개를 dbt 모델 64개로 쪼개고, Dagster로 실행·모니터링하게 만든 과정을 정리합니다. 실행 환경은 폐쇄망 가상 윈도우 한 대였습니다.

---

## 목차

1. [프로젝트 소개](#1-프로젝트-소개)
2. [기술 스택과 선택 이유](#2-기술-스택과-선택-이유)
3. [아키텍처 설계](#3-아키텍처-설계)
4. [구현 과정](#4-구현-과정)
   - [프로젝트 설정](#4-1-프로젝트-설정)
   - [소스 등록과 freshness](#4-2-소스-등록과-freshness)
   - [프로시저 단계 → 모델](#4-3-프로시저-단계--모델)
   - [#temp → ephemeral](#4-4-temp--ephemeral)
   - [파라미터와 매크로](#4-5-파라미터와-매크로)
   - [태그로 캠페인 단위 실행](#4-6-태그로-캠페인-단위-실행)
   - [테스트와 문서화](#4-7-테스트와-문서화)
   - [Dagster 오케스트레이션](#4-8-dagster-오케스트레이션)
5. [회고 및 배운 점](#5-회고-및-배운-점)

---

## 1. 프로젝트 소개

보험사 콜센터(TM) 캠페인에 쓸 고객 리스트를 매주 뽑아 배분하는 일을 맡고 있었습니다. 캠페인마다 추출 조건과 배분 전략이 달랐고 그 로직 전부가 Stored Procedure 2~3개 안에 들어 있었습니다. 프로시저는 `#temp` 테이블을 단계마다 만들어 다음 단계로 넘겼습니다. 이 구조에서는 세 가지가 문제였습니다.

1. 버전 관리가 안 됐습니다. SP 안에 성격이 다른 테이블들이 섞여 있어 테이블별로 변경 이력을 추적하기 어려웠습니다.
2. 어떤 테이블이 어떤 테이블에 기대는지는 코드를 끝까지 읽어야 알 수 있었습니다.
3. 실행이 중간에 멈추면 어느 단계에서 멈췄는지 찾는 데만 시간이 갔습니다. 매주 추출할 때마다 이 비용을 그대로 치렀습니다.

그래서 프로시저 안의 단계들을 dbt 모델로 하나씩 물리화하고 실행은 Dagster에 맡기기로 했습니다.

- 프로시저 2~3개 → **dbt 모델 64개**(부품 42 / 조립 18 / 기타 4) + 매크로 2개
- `ref()`/`source()` 참조 111곳, 가장 긴 직렬 체인 모델 9개
- dbt 모델을 asset으로 읽어 실행·모니터링하는 Dagster 프로젝트

| 항목 | 내용 |
|---|---|
| 기간 | 2022.08~2023.03, 단독 진행 |
| 배경 | 보험사 TM 캠페인 고객 리스트 주간 추출·배분 |
| 문제 | SP 2~3개에 로직 집중 → 버전 관리·의존성 파악·실패 지점 식별 불가 |
| 스택 | dbt (dbt-sqlserver) · Dagster · MSSQL |
| 규모 | 모델 64개, 참조 111곳, 최장 체인 9개 |
| 환경 | 폐쇄망 가상 윈도우. 도커·리눅스 VM·인터넷 불가 |

### 원천 데이터 구조

모델이 읽는 원천은 크게 세 곳입니다. 이 구분이 뒤의 설계에 계속 등장합니다.

| 원천 | 성격 | 주요 내용 |
|---|---|---|
| 기간계 | 실시간 원장. 링크드 서버 경유. 월별 스냅샷 키 없이 "현재 상태"만 있음 | 계약·특약·동의·블랙리스트 뷰 |
| 정보계 | 월별 스냅샷 DM. `baseym`(기준월) 키 보유 | 계약 분석 스냅샷, 청구 상세, 보장금액 |
| 캠페인 DB | 캠페인 운영 테이블 | 캠페인 결과, 통제 테이블, 콜센터 통화 결과 |

---

## 2. 기술 스택과 선택 이유

| 도구 | 역할 |
|---|---|
| dbt-core + dbt-sqlserver | SQL 모델링, 리니지, 테스트, 문서화 |
| MSSQL | 기존 운영 DB 그대로 사용 |
| Dagster | 오케스트레이션, 실행 이력 UI |
| dbt_utils | 테스트 매크로 (`dbt_expectations`도 설치돼 있었지만 실제로 쓴 곳은 없음) |
| APScheduler → Dagster | 이관 전 배치 스케줄러 |

### 환경 제약이 먼저였다

보험사라 DB는 폐쇄망에 있었고 접근하려면 전산센터 단말기에서 가상 윈도우에 붙어야 했습니다. 인터넷이 안 되니 파이썬 라이브러리 하나도 밖에서 받아 물리적으로 반입해야 했습니다. SSIS 같은 배치 도구도 없어서 처음엔 파이썬 스크립트를 윈도우 작업 스케줄러에 걸었고 나중에 APScheduler로 옮겼습니다. 실행 이력은 로그 파일에만 남았습니다. 어느 스크립트가 언제 실패했는지 보려면 파일을 직접 뒤져야 했습니다.

할당된 자원은 그 가상 윈도우 하나뿐이었습니다. Hyper-V가 막혀 있어 그 위에 리눅스 VM이나 도커를 올릴 수 없었고, 별도 리눅스 리소스를 받는 것도 어려웠습니다. 별도 서버나 컨테이너가 필요한 도구는 애초에 후보가 아니었습니다.

### 왜 dbt인가

프로시저 안의 단계마다 이름 있는 산출물이 있고, 산출물 사이의 의존성이 코드에서 저절로 뽑히기를 바랐습니다. dbt는 SQL 파일 하나가 모델 하나(테이블 또는 뷰)이고 다른 모델을 `ref()`로 부르면 그 호출이 곧 의존성 그래프가 됩니다. 프로시저의 `SELECT ... INTO #temp` 한 단계를 `SELECT` 하나짜리 파일로 옮기면 그대로 모델이 되니 이관 자체는 기계적으로 진행할 수 있었습니다. 모델이 파일이니 버전 관리는 따라옵니다. 실행이 멈추면 dbt는 실패한 모델 이름을 로그에 남기고 `--select`로 그 모델부터 다시 돌릴 수 있습니다. 애초의 문제 세 가지가 도구 선택만으로 상당 부분 풀렸습니다.

저장소는 기존 운영 DB인 MSSQL 그대로였고 어댑터는 `dbt-sqlserver`를 썼습니다. dbt는 파이썬 패키지 하나로 설치되니 위 제약에 걸리지 않았습니다.

```yaml
# ~/.dbt/profiles.yml (형태만 — 값은 예시)
my_dbt_project:
  target: prod
  outputs:
    prod:
      type: sqlserver
      driver: "ODBC Driver 17 for SQL Server"
      server: <DB_HOST>
      database: CAMPAIGN_DB
      schema: dbo
      threads: 4
```

### 왜 Dagster인가

Dagster는 순수 파이썬이라 `pip install dagster dagster-webserver` 뒤 `dagster dev` 한 줄로 웹 UI가 떴습니다. 이 환경에서 UI로 배치를 관리할 수 있는 도구는 사실상 이것뿐이었습니다.

다만 환경은 진입 조건이었고 계속 쓴 이유는 워크플로우 모델입니다. Airflow류는 "무엇을 실행할지"(task)를 나열하고 Dagster는 "무엇이 만들어지는지"(asset)를 선언합니다. dbt의 모델이 정확히 후자입니다. 모델 하나가 테이블 하나이고 `ref()`가 계보를 만듭니다. Dagster는 dbt 프로젝트를 읽어 모델을 asset으로 그대로 흡수합니다. dbt의 리니지가 asset 그래프로, dbt의 `group`과 `tags`가 UI의 그룹 뷰로 이어집니다.

트레이드오프도 있었습니다. Airflow에 비해 커뮤니티와 한국어 자료가 적어 공식 문서로 익혔고, asset·materialization·partition 같은 개념이 낯설어 초기 진입이 느렸습니다. Airflow와의 개념 비교는 블로그에 따로 정리했습니다.

---

## 3. 아키텍처 설계

### 부품 → 조립 2계층

모델은 두 층으로 나눴습니다. 부품 모델 42개는 원장·캠페인 DB에서 고객 단위 속성을 집계합니다. 조립 모델 18개는 그 부품을 조립해 고객 마스터와 캠페인 타겟을 만듭니다. 의존 방향은 부품 → 조립 한 방향이고 거꾸로 가는 참조는 없습니다.

```text
models/
├── sources/                   # 소스 선언 yml (등록 6개)
├── source_view/               # 1개 — 정보계 스냅샷 최신월 필터 + 타입 캐스팅
├── subtable/                  # 42개 — 부품 모델
├── pom_procedure/             # 18개 — 프로시저 단계 체인 + 최종 마트
├── maturity_dashboard/        # 1개 — 만기 대시보드용
└── testfile/                  # 2개 — 실험용 스크래치
```

dbt 관례인 staging / intermediate / marts 폴더는 아니고, 프로시저 기준으로 나눈 폴더입니다. 레이어 정보는 파일명 접두사에 넣었습니다(`POMSUB_` = 중간 산출물, `_TMP` = 프로시저의 한 단계). 

### Lineage — 프로시저 실행 순서가 그대로 체인이 됐다

```mermaid
graph LR
  E["콜 에러 정제"] --> RP["최근 증권"]
  RP --> BASE["고객·증권 베이스"]
  BASE --> DATA["고객·증권 데이터"]
  DATA --> G["고객 구분"]
  G --> GRP["그룹 집계"]
  GRP --> SEG["고객·증권 세그먼트"]
```

캠페인 대상 세그먼트가 만들어지는 메인 체인을 단계 몇 개만 남기고 그린 것입니다. 왼쪽부터 읽으면 이렇습니다. 콜센터 통화 결과에서 전화번호 오류 등의 에러를 걸러내고, 고객 별로 가장 최근 증권번호를 뽑습니다(해당 증권에 가입할 때 넣은 전화번호가 가장 최신일 가능성이 높으므로). 거기에 계약·특약·동의·블랙리스트 같은 원장 정보를 붙여 고객 한명이 한 행인 넓은 테이블을 만듭니다. 이게 가운데의 "고객·증권 베이스" 입니다. 그 뒤 단계는 전부 이 테이블에서 시작합니다. 고객을 조건별로 나누고 나눈 결과를 묶어 최종 세그먼트 테이블까지 이어집니다.

이 베이스 테이블을 직접 읽는 모델이 8개입니다. 프로젝트에서 여러 곳에 재사용되는 테이블은 사실상 이것 하나이고, 나머지 부품 모델 대부분은 딱 한 군데서만 쓰입니다. 그래서 베이스의 컬럼 하나가 바뀌면 뒤의 모델 8개와 그 아래가 전부 영향을 받습니다.

### 그레인 설계

허브인 고객·증권 베이스는 고객 한 명이 한 행인 넓은 테이블입니다. 부품 모델은 목적에 따라 고객 단위·증권 단위·피보험자 단위로 그레인이 다르고, 이 그레인을 각 모델의 태그에 명시했습니다(`'고객단위'`, `'증권단위'`, `'피보험자단위'`). 조립할 때 그레인이 다른 부품을 섞지 않도록 태그로 먼저 거르는 용도입니다.

### Materialization 전략

| 대상 | Materialization | 이유 |
|---|---|---|
| 부품·조립 모델 대부분 (53개) | table | 매주 통째로 다시 만드는 배치. 다음 단계가 물리 테이블을 읽음 |
| 프로시저의 `#temp` 단계 (9개) | ephemeral | 물리 테이블 없이 단계 분해만 유지. 컴파일 시 CTE로 인라인 |
| 폴더별 설정을 안 잡은 2개 (스냅샷 최신월 뷰, 만기 대시보드) | view (dbt 기본값) | 의도한 게 아니라 폴더 기본값이 없어 기본값으로 떨어진 것 |

프로시저의 임시 테이블을 전부 물리 테이블로 승격하면 DB에 중간 산출물이 그만큼 더 쌓입니다. 그래서 `#temp`는 ephemeral로 옮겼습니다. 예외가 하나 있었는데 4-4에서 다룹니다.

### 프로시저 → dbt 대응 규칙

| 프로시저 | dbt |
|---|---|
| `SELECT ... INTO #temp` 단계 | 모델 파일 하나 (`ref()`로 연결) |
| `#temp` 임시 테이블 | `materialized='ephemeral'` |
| `@campmonth` 파라미터 | `vars: campmonth` → `var('campmonth')` |
| 프로시저마다 반복되던 "캠페인월 ±N개월" 계산 | 매크로 `add_month()` |
| 3/4-part 하드코딩 테이블명 | 프로젝트 안이면 `ref()`, 밖이면 `source()` |
| 캠페인별 단계 실행 | `dbt run --select tag:...` |

---

## 4. 구현 과정

### 4-1. 프로젝트 설정

`dbt_project.yml`에 캠페인 대상월 변수, 폴더별 materialization 기본값, 모델별 실행 시간을 남기는 hook을 정의했습니다.

```yaml
# dbt_project.yml (의도한 설정 — 실제 파일은 마지막 편집에서 문법이 깨진 채 남았습니다. 회고 참조)
name: my_dbt_project
profile: my_dbt_project

vars:
  campmonth: "'202410'"      # 캠페인 대상월 (예시). 매월 이 값만 바꿔 재실행
  ltddashmonth: "'202409'"

models:
  my_dbt_project:
    +pre-hook:
      - "INSERT INTO dbt_model_logs (model_name, start_time) VALUES ('{{ this.name }}', GETDATE())"
    +post-hook:
      - "UPDATE dbt_model_logs SET end_time = GETDATE() WHERE model_name = '{{ this.name }}' AND end_time IS NULL"
    subtable:
      +materialized: table
    pom_procedure:
      +materialized: table
```

`campmonth` 값에 작은따옴표가 포함된 건 의도한 것입니다. `{{ var('campmonth') }}`가 SQL에서 그대로 `'202410'` 문자열 리터럴로 렌더링됩니다.

테스트 매크로 패키지는 `dbt_utils`를 썼습니다. `dbt_expectations`도 설치돼 있었지만 실제로 쓴 곳은 없습니다.

### 4-2. 소스 등록과 freshness

외부 테이블은 `sources.yml`에 등록하고 `source()`로 읽습니다. 가장 상류인 정보계 스냅샷 뷰에는 `loaded_at_field`를 걸어 freshness를 켰습니다.

```yaml
# models/sources/sources.yml (이름 일반화)
version: 2

sources:
  - name: CAMPAIGN_DB
    database: CAMPAIGN_DB
    schema: DBO
    tables:
      - name: view_PolicyAnalysisRecentMonth      # 정보계 스냅샷 최신월 뷰
        loaded_at_field: ETLDate_datetime
        freshness:
          warn_after:  {count: 1, period: day}
          error_after: {count: 5, period: day}
      - name: CAMPAIGN_RESULT
      - name: COVERAGE_CONTROL

  - name: DW                                     # 정보계 DM
    database: DW
    schema: DBO
    tables:
      - name: CLAIM_DETAIL
      - name: POLICY_COVERAGE_INSURED_AMOUNT
```

freshness의 기준이 되는 `ETLDate_datetime`은 최상류 뷰 모델에서 만들어 줍니다. 정보계 스냅샷 테이블에서 최신 기준월(`baseym`)만 남기고 적재 시각을 `datetime2`로 캐스팅한 얇은 뷰입니다.

```sql
-- models/source_view/view_PolicyAnalysisRecentMonth.sql
with tbl1 as (
    select max(baseym) as baseym
    from DW.dbo.PolicyAnalysis                -- 정보계 월별 스냅샷
)
select cast(ETLDATE as datetime2) as ETLDate_datetime
     , *
  from DW.dbo.PolicyAnalysis
 where baseym in (select * from tbl1)
   and CLOSINGCODE = 'L'
```

```bash
dbt source freshness
```

두 가지를 같이 적어 둡니다. 이 뷰 자체는 정보계 테이블을 아직 하드코딩으로 읽습니다(회고의 98곳 중 하나). 그리고 이 뷰는 dbt 모델이면서 `sources.yml`에도 소스로 등록돼 있어, 소비자 모델들은 `ref()`가 아니라 `source()`로 읽습니다. freshness를 걸기 위한 등록이었지만 dbt가 모델 → 소비자 의존성을 모르게 되는 부작용이 있었고, 회고에서 다룹니다.

### 4-3. 프로시저 단계 → 모델

프로시저의 한 단계를 모델 하나로 옮기는 기본형은 이렇습니다.

```sql
-- 이관 전: 프로시저의 한 단계 (단순화)
SELECT c.CustomerKey, MAX(p.PolicyNo) AS RecentPolicyNo
INTO #recent_policy
FROM dw.PolicyLatest p
JOIN #valid_customer c ON c.CustomerKey = p.CustomerKey
GROUP BY c.CustomerKey;
```

```sql
-- 이관 후: models/subtable/recent_policy.sql (단순화)
{{ config(materialized='table') }}

SELECT c.CustomerKey, MAX(p.PolicyNo) AS RecentPolicyNo
FROM {{ source('dw', 'PolicyLatest') }} p
JOIN {{ ref('valid_customer') }} c ON c.CustomerKey = p.CustomerKey
GROUP BY c.CustomerKey
```

실제 모델 하나를 보면 이렇습니다. 고객별 최신 증권에서 전화번호 유무를 뽑는 부품 모델입니다. `config()`에 materialization과 태그가 있고, 콜센터 통화 오류 정제 모델을 `ref()`로 읽고, 기간계 원장 뷰는 링크드 서버 경유로 읽습니다.

```sql
-- models/subtable/POMSUB_RECENT_POLICYNO.sql (요약)
{{ config(materialized='table', tags=['제외조건','고객단위']) }}

SELECT A.POLICYHOLDERID
     , A.POLICYNO
     , A.APPDATE
     , CASE WHEN (A.HOMETELYN = 'Y' OR A.MOBILETELYN = 'Y' OR A.OFFICETELYN = 'Y')
             AND ERR2.POLICYHOLDERID IS NULL THEN 1 ELSE 0 END AS PHONE_EXISTS_YN
     , GETDATE() AS ETLDATE
  FROM (
        SELECT CONVERT(BIGINT, CON.POLICYHOLDERIDKEY) AS POLICYHOLDERID
             , CON.POLICYNO
             , CON.APPDATE
             , CASE WHEN SUBSTRING(CON.MOBILETELNO, 1, 3) IN ('010','011','016','017','018','019')
                    THEN 'Y' ELSE 'N' END AS MOBILETELYN
             -- HOMETELYN, OFFICETELYN 동일 패턴
             , ROW_NUMBER() OVER (PARTITION BY CON.POLICYHOLDERIDKEY
                                  ORDER BY IIF(ERR.APPLYDATE > CON.APPDATE, ERR.APPLYDATE, CON.APPDATE) DESC) AS ROWNUM
          FROM [LINK].CORE.dbo.V_CONTRACT CON WITH(NOLOCK)      -- 기간계 원장 (링크드 서버 4-part 참조)
          LEFT JOIN {{ ref('POMSUB_TEMP_CALL_ERROR') }} ERR      -- 콜센터 통화 오류 정제
            ON CON.POLICYNO = ERR.POLICYNO
         WHERE SUBSTRING(CON.POLICYNO, 1, 3) NOT IN ('DTA', 'OTA')
       ) A
  LEFT JOIN {{ ref('POMSUB_TEMP_CALL_ERROR2') }} ERR2
    ON A.POLICYHOLDERID = ERR2.POLICYHOLDERID
 WHERE A.ROWNUM = 1
```

모든 모델에 `GETDATE() AS ETLDATE`를 넣어 적재 시각을 남겼습니다. 하드코딩 테이블명을 `ref()`로 바꾼 자리에는 원래 이름을 주석으로 남겼고, 프로시저의 `-- INTO ##TEMP_*` DDL도 주석으로 보존했습니다. 금융권에서 프로시저를 다른 도구로 옮기면 원본과 1:1로 대조하는 검증을 요구받는 경우가 많고, 이 주석들이 그 대조표 역할을 합니다.

### 4-4. #temp → ephemeral

프로시저 단계 체인의 `#temp`는 `materialized='ephemeral'`로 두어 컴파일 시 CTE로 인라인되게 했습니다. 물리 테이블 없이 단계 분해는 그대로 유지됩니다.

```sql
-- models/pom_procedure/POM_DB_FREQ_TMP_POM_ONLY.sql (요약, 이름 일반화)
{{ config(
    materialized='ephemeral',
    tags= ['고객단위','모수테이블']
) }}
SELECT *
 FROM
(SELECT
 customerIDKey
 FROM {{ ref("POM_DB_FREQ_TMP_CNT_DIFF_CNT2_0") }} WHERE 1=1
UNION
SELECT
 customerIDKey
 FROM {{ ref("POM_DB_FREQ_TMP_CNT_SAME_CNT2_0") }} WHERE 1=1 ) A
```


- ephemeral 모델은 컴파일 시 아래와 같이 나온다. 
```sql
-- models/POM_DB_FREQ_TMP_POM_ONLY.sql
with __dbt__cte__POM_DB_FREQ_TMP_CNT_DIFF_CNT2_0 as ( ... )
,  __dbt__cte__POM_DB_FREQ_TMP_CNT_SAME_CNT2_0 as ( ... )

```


예외가 하나 있었습니다. dbt의 ephemeral 인라인은 참조 대상 모델의 컴파일된 SQL을 파싱하지 않고 문자열 그대로 감싸는 모델의 CTE 괄호 안에 넣습니다. 문제가 된 프로시저 단계는 자기 안에서 이미 `WITH`로 별도 CTE를 쓰고 있었는데, 이걸 ephemeral로 두니 `WITH cte1 AS ( WITH tbl2 AS (...) SELECT ... ) SELECT ...` 형태의 중첩 `WITH`가 만들어졌습니다. T-SQL은 CTE를 문(statement) 맨 앞에서만 정의하도록 강제하고 서브쿼리 안에 중첩 정의하는 걸 허용하지 않아서 이 지점에서 문법 에러가 났습니다. 그 CTE를 손으로 최상위까지 끌어올려 평탄화했으면 통과했을 거라는 짐작은 구조적으로 맞았습니다 — dbt의 ephemeral 인라인은 ephemeral끼리 체인될 때만 그렇게 자동으로 평탄화하고, 모델이 스스로 CTE를 쓰는 경우는 손대지 않기 때문입니다. 다만 그 자리에서 검증할 시간이 없어 더 확실한 방법인 table 승격으로 우회했습니다.

최종 분포는 table 53, ephemeral 9였고 나머지 2개는 폴더별 설정이 없어 기본값 view로 떨어져 있었습니다.

### 4-5. 파라미터와 매크로

`@campmonth` 파라미터는 `vars`로 올렸습니다. 프로시저는 캠페인 대상월을 파라미터로 받아 계약 경과월을 계산하고 휴지기(재접촉 유예 기간)에 걸리는 고객을 걸러냈습니다. 이 값을 `dbt_project.yml`의 `vars`로 빼고 모델에서는 `var('campmonth')`로 읽게 했습니다. 매월 값 하나만 바꿔 같은 프로젝트를 다시 돌리면 됩니다.

```sql
-- models/pom_procedure/POMSUB_REST_PERIOD.sql — 휴지기 계산
{{ config(materialized='table', tags=['고객단위','제외조건']) }}

SELECT customerIDKey
     , MAX(DATEDIFF(MONTH, CONVERT(VARCHAR(8), firstpolicyappDate, 112), {{ var('campmonth') }} + '01')) AS RestPeriod
  FROM {{ ref('POMSUB_CUSTOMER_POL_BASE') }}
 WHERE True
 GROUP BY customerIDKey
```

프로시저마다 반복되던 "캠페인월 ±N개월" 계산은 매크로 하나로 뽑아 25곳에서 재사용했습니다.

```sql
-- macros/add_month.sql
{% macro add_month(returnstring, datepart, interval, campmonth) %}
  CONVERT(VARCHAR(6), DATEADD({{ datepart }}, {{ interval }}, CONVERT(DATE, {{ campmonth }} + '01', 112)), 112)
{% endmacro %}
```

```sql
-- 호출 예: 캠페인월 3개월 전 (YYYYMM)
WHERE appYM >= {{ add_month(6, 'MONTH', -3, var('campmonth')) }}
```

첫 파라미터 `returnstring`(반환 길이)은 매크로 본문에서 쓰이지 않습니다. 호출부가 6을 주든 8을 주든 항상 6자리를 돌려주고, 그래서 호출부마다 `SUBSTRING`으로 좌변을 자르는 방어 코드가 붙어 있습니다. 회고의 남은 빚에 다시 적었습니다.

스냅샷 테이블의 최신 기준월을 `run_query`로 조회해 기본값으로 쓰는 매크로도 하나 뒀습니다.

```sql
-- macros/get_latest_policyanalysis_month.sql
{% macro get_latest_policyanalysis_month() %}
  {% set latest_month_query %}
    select top 1 baseym
    from DW.dbo.PolicyAnalysis
    order by baseym desc
  {% endset %}
  {% set latest_month_result = run_query(latest_month_query) %}
  {% if latest_month_result %}
    {% set latest_month_value = latest_month_result.columns[0].values()[0] %}
  {% endif %}
  {{ return("'" ~ latest_month_value ~ "'") }}
{% endmacro %}
```

### 4-6. 태그로 캠페인 단위 실행

캠페인마다 필요한 모델 집합이 달랐습니다. 그래서 모델 이름 대신 태그로 실행 단위를 잡았습니다. 대부분의 모델에 세 축의 태그를 붙였습니다.

| 축 | 태그 값 | 용도 |
|---|---|---|
| 그레인 | `고객단위` / `증권단위` / `피보험자단위` | 조립 시 그레인이 다른 부품을 섞지 않도록 |
| 역할 | `모수테이블` / `제외조건` | 대상 모수를 만드는 모델인지, 거르는 조건 모델인지 |
| 캠페인 | 캠페인 코드, `campmonth` | 캠페인별 부분 실행, 월 파라미터를 쓰는 모델 표시 |

```bash
# 대상월만 바꿔 특정 캠페인 모델군만 실행 (예시)
dbt run --select tag:campaign_a --vars "{campmonth: \"'202401'\"}"   # 값에 작은따옴표 포함 (4-1 참조)

# 고객 단위 제외조건 모델만
dbt run --select tag:고객단위,tag:제외조건
```

`schema.yml`에는 모델마다 `group`을 정의해(`subtable`, `pom_procedure`) Dagster UI의 그룹 뷰와 연결되게 했습니다.

### 4-7. 테스트와 문서화

테스트는 복합키 정합성 검증에 `dbt_utils.unique_combination_of_columns`를 썼습니다.

```yaml
# models/subtable/schema.yml (일부 — 실제 조합은 측정값까지 10개 컬럼)
  - name: POMSUB_CLAIMSTAT_PolicyHolder
    tests:
      - dbt_utils.unique_combination_of_columns:
          combination_of_columns:
            - customerIDKey
            - claimCount
            - lossPaidAmount
            # ... 측정값 컬럼 7개 더
```

문서는 `schema.yml`에 group·모델·컬럼 설명으로 남겼습니다. 코드만 읽어서는 복원할 수 없는 도메인 지식 — 청구 플래그의 판정 임계값, 정책 변경 이력(날짜와 사유), 상태코드 목록 — 을 여기 적었습니다.

```yaml
  - name: POMSUB_CustomerConsentList
    config:
      group: subtable
    description: 고객 마케팅 동의 현황
    columns:
      - name: customerIDKey
        description: 고객ID
      - name: byPhoneAgreeYN
        description: 가입권유 연락방식 선택 전화
      - name: byTextAgreeYN
        description: 가입권유 연락방식 선택 문자
      - name: consentStartDate
        description: 동의 시작일
      - name: consentEndDate
        description: 동의 종료일
```

```bash
dbt docs generate && dbt docs serve
```

### 4-8. Dagster 오케스트레이션

dbt 프로젝트를 Dagster에 얹는 골격은 dagster-dbt의 표준 패턴 그대로입니다. manifest를 읽어 모델 64개를 asset으로 등록하고, `dbt build`를 DAG 순서대로 실행합니다.

```python
# project.py
from pathlib import Path
from dagster_dbt import DbtProject

dbt_project = DbtProject(project_dir=Path(__file__).joinpath("..", "..", "my_dbt_project").resolve())
dbt_project.prepare_if_dev()
```

```python
# assets.py
from dagster import AssetExecutionContext
from dagster_dbt import DbtCliResource, dbt_assets
from .project import dbt_project

@dbt_assets(manifest=dbt_project.manifest_path)
def customer_mart_dbt_assets(context: AssetExecutionContext, dbt: DbtCliResource):
    yield from dbt.cli(["build"], context=context).stream()
```

```python
# definitions.py
from dagster import Definitions
from dagster_dbt import DbtCliResource
from .assets import customer_mart_dbt_assets
from .project import dbt_project

defs = Definitions(
    assets=[customer_mart_dbt_assets],
    resources={"dbt": DbtCliResource(project_dir=dbt_project)},
)
```

```bash
dagster dev
# → http://localhost:3000 에서 asset 그래프 확인·실행
```

운영에서 달라진 건 이겁니다. 어떤 마트가 언제 갱신됐는지를 UI에서 테이블 단위로 바로 볼 수 있게 됐습니다. 장애가 나면 그래프에서 upstream 테이블을 따라 올라가는 것으로 원인 추적이 끝났습니다. 품질 이슈가 생기면 문제 asset과 그 downstream만 특정할 수 있었고, 변경된 자산만 골라 다시 materialize할 수 있었습니다. 스크립트를 작업 스케줄러에 걸고 로그 파일을 뒤지던 때와 비교하면 실행 이력이 "보이는" 상태가 된 겁니다.

Dagster 쪽에서 만든 값을 dbt 모델이 읽게 하는 연결도 설계했습니다. `sources.yml`에 Dagster asset을 소스로 등록해 두면 dbt 모델이 그 asset에 의존하는 것으로 그래프에 잡힙니다.

```yaml
# sources.yml — Dagster asset을 dbt source로
  - name: dagster
    tables:
      - name: weekly_target_dates
        meta:
          dagster:
            asset_key: ["weekly_target_dates"]
```

청약 주차별 캠페인 타겟 모델이 이 값을 받아 주차 경계 날짜로 쓰도록 하려던 것인데, 이 연결은 끝내지 못했습니다. 회고에서 다룹니다.

---

## 5. 회고 및 배운 점

### 잘 된 점

- **`#temp`를 물리 테이블로 승격하지 않고 ephemeral로 옮긴 것.** 프로시저의 단계 분해는 그대로 살리면서 DB에 중간 산출물을 쌓지 않았습니다.
- **태그를 그레인·역할·캠페인 세 축으로 설계한 것.** 캠페인마다 다른 모델 집합을 이름 나열 없이 `--select tag:`로 실행할 수 있었습니다.
- **`campmonth`를 vars로 뺀 것.** 프로시저에 흩어져 있던 "캠페인월 ±N개월" 계산이 매크로 하나로 모였고, 매월 값 하나만 바꿔 재실행합니다.
- **최상류 소스에 freshness를 건 것.** 정보계 스냅샷이 밀리면 하류를 돌리기 전에 경고가 납니다.
- **도메인 지식을 schema.yml에 남긴 것.** 커버리지는 64개 중 12개로 낮았지만, 판정 임계값·정책 변경 이력·상태코드 목록처럼 코드만으로는 복원할 수 없는 내용이 들어 있습니다.
- **Dagster UI로 실행 이력이 보이게 된 것.** 로그 파일을 뒤지던 운영이 그래프에서 클릭하는 운영으로 바뀌었습니다.

### 어려웠던 점

- **폐쇄망 반입.** 라이브러리 하나를 쓰려면 밖에서 받아 물리적으로 옮겨야 했습니다. 도구 선택지가 "파이썬 패키지 하나로 끝나는가"로 좁혀진 이유입니다.
- **ephemeral과 중첩 `WITH`.** 자기 안에서 CTE를 쓰는 프로시저 단계를 ephemeral로 두니 T-SQL이 허용하지 않는 중첩 `WITH`가 만들어져 문법 에러가 났습니다. 원인은 짚었지만 그 자리에서 검증할 시간이 없어 table 승격으로 우회했습니다(4-4).
- **`campmonth`로 과거 시점을 재현할 수 없다는 것.** 기간계 원장은 스냅샷 키 없이 "현재 상태"만 있어서, 다른 `campmonth`로 실행해도 고객·계약 모집단은 실행 시점의 현재 상태로 고정되고 날짜 파생 컬럼만 그 달인 것처럼 나옵니다. `campmonth`의 역할은 휴지기 계산이지 시점 재현이 아니었으니 설계 결함이라기보다 쓰임의 한계인데, 기간계를 직접 읽는 모델 12개 중 11개에 `campmonth`가 없다는 걸 나중에야 정리했습니다. 정보계 쪽은 `baseym` 키가 있어 필터가 가능한 구조입니다.
- **Dagster 러닝커브.** 한국어 자료가 거의 없어 공식 문서로 익혔고, asset 개념이 잡히기 전까지는 진입이 느렸습니다..
- **incremental 없음.** 51개 모델이 매번 전체 재생성이고, 기간계 데이터를 Debezium 등을 통해 증분 모델로 만들 수 있는 기회가 있었다면 많은 것을 배웠을 것 같습니다. 

---

## 관련 링크

- dbt-mini-mart: https://github.com/kgeonhoe/dbt_mini_mart — 공개 데이터셋으로 표준 4계층 모델링을 연습한 학습 프로젝트. 이번 실무 구조와 대비해 읽으면 좋습니다
