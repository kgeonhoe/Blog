---
categories:
  - "[[Courses]]"
platform:
instructor:
url:
created: 2026-03-15
start:
end:
rating:
topics:
  - "[[Data Engineering]]"
  - "[[Data Pipelines]]"
tags:
  - course
draft: true
---
# 1. dbt란?

Data Build tool으로 ELT, ETL 파이프라인 Flow 에서 T (Transform) 의 역할을 수행한다.
Tool (Python lib) used in building a data warehouse -> 데이터 웨어 하우스에 붙어서 데이터 변환 작업을 수행

FrameWork (dango, Flask 와 같이) transfrom 역할을 하나의 틀로 만들어준 라이브러리 
진자탬플릿 등을 활용하여 반복 업무를 수행 -> dbt compile 시, 모두 sql 코드로 변환을 시켜준다. 

Independent with Warehouse, orchestration solution 

## 호환성 확인 

| dbt adapter / DB                     | append | merge | delete+insert | insert_overwrite | microbatch |
| ------------------------------------ | ------ | ----- | ------------- | ---------------- | ---------- |
| **dbt-postgres / PostgreSQL**        | ✅      | ✅     | ✅             | ✅                | ❌          |
| **dbt-redshift / Amazon Redshift**   | ✅      | ✅     | ✅             | ✅                | ❌          |
| **dbt-bigquery / BigQuery**          | ✅      | ✅     | ✅             | ❌                | ✅          |
| **dbt-spark / Spark**                | ✅      | ✅     | ❌             | ✅                | ❌          |
| **dbt-databricks / Databricks**      | ✅      | ✅     | ✅             | ✅                | ✅          |
| **dbt-snowflake / Snowflake**        | ✅      | ✅     | ✅             | ✅                | ✅          |
| **dbt-trino / Trino**                | ✅      | ✅     | ✅             | ✅                | ❌          |
| **dbt-fabric / Microsoft Fabric DW** | ✅      | ✅     | ✅             | ❌                | ✅          |
| **dbt-athena / Amazon Athena**       | ✅      | ✅     | ✅             | ✅                | ❌          |
| **dbt-teradata / Teradata**          | ✅      | ✅     | ✅             | ✅                | ❌          |
출처 : https://docs.getdbt.com/docs/build/incremental-strategy?utm_source=chatgpt.com

version control 
automated documentation 
automated data lineage 
intergrated testing 


# dbt 핵심 개념 

SQL + YAML + Jinja 

Source 
	데이터
Profile
	Data Connection info를 기록하는 yaml 파일이다. 
	환경 dev 환경 prod 환경 분리 
		dev prod 나누는 이유
			먼저 dev 환경에서 로직 테이블등을 테스트 해보고 prod 환경에 배포를 하게 된다 
			dev prod 연결(source 다름)을 따로 가져가고, dev에서 충분히 테스트가 완료되면 prod에 배포 하는 과정을 거치게 된다.  

compole + run 구조 
	dbt 에서 만든 jinja, yaml 파일의 경우 결국에는 해당warehouse 에서 인식할수 있는 sql 스크립트 형태가 되어야한다. 
	yaml, jinja 구조의 변수들을 해당 sql에 맞게 변환하여 실행할 수 있게 해준다. 
## 핵심 요약



## 실습 메모

