---
categories:
  - "[[Courses]]"
platform:
instructor:
url:
created: 2026-03-10
start:
end:
rating:
topics: []
tags:
  - course
draft: false
---
# Analytics Engieering

Analytics Engineering(AE) 은  
Raw Data → 신뢰 가능한 분석 데이터(Analytics-ready data) 로 전환하는 역할을 담당하는 데이터 직무/영역입니다.

- 데이터 엔지니어링과 데이터 분석의 중간 지점
- SQL 기반으로 변환(Transformation), 모델링(Modeling), 품질 관리(Data Quality) 를 책임
- 분석가 바로 사용할 수 있는 Fact / Dimension / Mart 레벨 데이터를 제공

# 생성 배경

(1) 기존 역할 분리의 한계

과거 구조:  
Data Engineer: 수집·적재(ETL)  
Data Analyst: SQL로 직접 Raw 데이터 분석

문제점:

- Raw 데이터 구조가 복잡 → 분석가 생산성 저하
- 동일 지표가 사람마다 다르게 계산됨
- SQL 로직이 개인 PC·노트북에 흩어짐 (재사용 불가)
- 데이터 품질·변경 이력 관리 부재

(2) Modern Data Stack의 등장

- Cloud DW(BigQuery, Snowflake, Redshift)
- ELT 패턴 확산 (Load 먼저, Transform 나중에)
- SQL 중심의 Transformation 요구 증가

👉 “Transform을 누가, 어떻게 관리할 것인가?”  
→ 이 공백을 메운 역할이 Analytics Engineering 입니다. 

# 주로 어떤일을 하는가? 

1️⃣ 데이터 모델링

- Raw → Staging → Intermediate → Mart
    - Star Schema / Wide Table / Metric Mart 설계
- 비즈니스 정의가 반영된 컬럼 단위 설계

2️⃣ Transformation 관리

- SQL 기반 변환 로직 표준화
- 재사용 가능한 모델 단위 관리
- Incremental / Snapshot 전략 설계

3️⃣ 데이터 품질 보장

- Not Null, Unique, Referential Integrity
- 지표 일관성 유지
- 변경 영향도 관리

4️⃣ 분석가 생산성 향상

- “어떻게 계산할지”가 아닌
- “무엇을 볼지”에 집중할 수 있게 함

# DBT 의 도입 및 Analytics Engineering과의 시너지

dbt(Data Build Tool) 는 Analytics Engineering을 가능하게 만든 핵심 도구입니다.

|항목|기존 방식|dbt 기반 AE|
|---|---|---|
|변환 위치|Python/ETL 서버|Data Warehouse 내부|
|언어|Python + SQL|SQL 중심|
|테스트|테스트 로직 직접 설계해야함|dbt test 기능 사용|
|문서화|수동|자동 생성|

# DBT 기능 설명

## 1.analyses

analyses는 dbt 프로젝트 내에서  
모델로 관리하지는 않지만, SQL로 관리하고 싶은 쿼리를 두는 공간입니다.

특징

- dbt가 table/view로 materialize 하지 않음
- 문서(doc)나 lineage에 노출되지 않음
- dbt run 대상이 아님
- 실무 활용 예
- 데이터 품질 리포트(SQL 기반)
- 임시 분석 쿼리
- 운영 점검용 SQL (row count, null ratio 등)
- 내부 참고용 쿼리
    - 👉 분석은 필요하지만, 데이터 제품으로 공개하고 싶지 않을 때 적합
    - 참고: 실제로 많은 팀에서 거의 사용하지 않지만,
    - DQ 점검용 SQL 관리 공간으로는 매우 유용함

## 2. dbt_project.yml

- dbt 프로젝트의 “설정 파일이자 시작점”

역할

- 프로젝트 이름 정의
- 모델 기본 materialization 설정
- 디렉토리별 기본 설정
- dbt 실행에 필요한 필수 파일

핵심 포인트

- 이 파일이 없으면 dbt 명령 실행 불가
- defaults를 정의하는 곳
- 폴더 단위로 설정 상속 가능
- dbt Core 사용 시 주의
- dbt_project.yml의 profile 이름은 ~/.dbt/profiles.yml에 정의된 profile과 반드시 일치해야 함

👉 dbt의 “컨트롤 타워” 역할

## 3. macros

재사용 가능한 SQL 로직 함수

개념

- Python 함수처럼 동작
- Jinja 템플릿 기반
- SQL 로직을 한 곳에 캡슐화
- 사용하는 이유
- 반복 SQL 제거
- 팀 공통 로직 표준화
- 실수 감소 및 유지보수성 향상

실무 예

- 날짜 필터 로직
- 공통 CASE WHEN
- 컬럼 표준 처리 규칙
- Incremental 조건 분기

👉 “SQL을 코드처럼 관리”하게 해주는 핵심 기능

4. README.md

프로젝트 최상위 문서

포함해야 할 내용

- 프로젝트 목적
- 데이터 범위
- 설치 및 실행 방법
- 디렉토리 구조 설명
- 주요 지표 정의
- 담당자 / 연락처

👉 dbt Docs 이전에, 사람이 처음 읽는 문서

5. seeds

- CSV / Flat file을 dbt 테이블로 로드하는 기능

특징

- dbt seed 실행 시 테이블 생성
- 빠르고 간단
- 소규모 데이터에 적합
- 실무 사용 예
- 코드 테이블
- 매핑 테이블
- 임시 기준 데이터

⚠️ 주의

“Quick & Dirty” 용도 (근본적으로는 Source에서 해결하는 것이 바람직)

6. snapshots

- 테이블의 “시점별 상태”를 저장하는 기능

목적

- 값이 overwrite 되는 컬럼의 이력 추적
- Slowly Changing Dimension(SCD) 관리

언제 필요한가

- 가격 변경 이력
- 상태값 변경
- 속성 컬럼 변경 추적

👉 “언제 값이 바뀌었는지”를 기록하는 장치

7. tests

- 데이터 품질을 검증하는 공간

역할

- Assertion(검증 로직)을 SQL로 정의
- Singular Test 전용 위치

동작 방식

- SQL 실행 결과가 0 rows → 성공
- 1 row 이상 → dbt build 실패

활용 예

- 비즈니스 규칙 위반 탐지
- 복합 조건 품질 검사

Custom Data Quality Rule

👉 데이터 품질을 코드로 관리

8. models (핵심)

dbt는 모델 디렉토리 구조를 통해 데이터 계층을 명확히 나누는 것을 권장

1️⃣ staging

- Raw 데이터의 정제 계층
- Source 테이블 기반
- 1:1 구조 유지
- 최소한의 가공만 수행
- 정제 범위:
    - 데이터 타입 캐스팅
    - 컬럼명 표준화
    - 기본적인 클렌징

👉 Raw → Analytics의 관문

2️⃣ intermediate

- 복잡한 변환을 위한 중간 계층
- Raw도 아니고
- 소비용 데이터도 아님

특징:

- 명확한 규칙 없음
- 복잡한 Join
- Heavy transformation
- 비즈니스 로직 분리

👉 “지저분한 계산을 숨기는 공간”

3️⃣ marts

- 최종 소비 계층
- 대시보드/리포트용
- Fact / Dimension 테이블
- 비즈니스 정의 완료
- 특징:
- 안정적 스키마
- 신뢰 가능한 지표
- 바로 사용 가능

👉 “이 계층에 있으면 바로 써도 된다”