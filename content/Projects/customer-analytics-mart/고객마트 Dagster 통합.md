---
title: 고객마트 Dagster 통합 — 왜 Airflow가 아니었나
categories:
  - "[[Projects]]"
created: 2026-08-13
topics:
  - "[[Dagster]]"
  - "[[dbt]]"
tags:
  - dagster
  - dbt
  - orchestration
draft: true
---

[[Projects/customer-analytics-mart/index|프로젝트 개요]]로 돌아가기

오케스트레이션 도구를 고를 때 제약이 둘 있었습니다. 실행 환경이 폐쇄망 가상 윈도우 한 대(Hyper-V 불가)라는 것, 그리고 변환 레이어를 이미 dbt로 짜고 있었다는 것입니다. Airflow는 이 환경에서 띄울 수 없었고, Dagster는 순수 파이썬이라 `pip install dagster dagster-webserver` 뒤 `dagster dev` 한 줄로 웹 UI가 떴습니다. 환경 얘기는 [[Projects/customer-analytics-mart/index|개요 글]]에 적었으니, 여기서는 dbt 프로젝트가 Dagster 위에 어떻게 얹혔고 dbt 기능들이 설계 대비 실제로 어디까지 갔는지를 적습니다.

## dbt 모델이 그대로 asset이 된다

Airflow류는 "무엇을 실행할지"(task)를 나열하고 Dagster는 "무엇이 만들어지는지"(asset)를 선언합니다. dbt 모델이 정확히 후자라서, Dagster는 dbt 프로젝트를 읽어 모델 64개를 asset으로 그대로 흡수하고 dbt의 리니지·`group`·`tags`가 UI에 그대로 나타납니다. 그 덕에 테이블 단위로 갱신 상태를 보고 그래프에서 upstream을 따라 장애를 추적할 수 있게 된 얘기는 개요 글에 적었습니다. 스크립트를 윈도우 작업 스케줄러에 걸고 로그 파일을 뒤지던 때와 비교하면 실행 이력이 "보이는" 상태가 된 겁니다.

트레이드오프는 러닝커브입니다. asset·materialization·partition 같은 개념이 낯설고 Airflow에 비해 커뮤니티와 한국어 자료가 적어 공식 문서로 익혔습니다. 개념 비교는 [[Dagster의 자산 중심 워크플로우]]와 [[Airflow 3와 Dagster 비교]]에 따로 있습니다.

## dbt 기능 5종 — 설계와 실제

프로젝트에서 쓰려던 dbt 기능과 실제로 어디까지 갔는지를 나란히 놓으면 이렇습니다. 각 기능의 문법과 설정 예시는 [[dbt 실전 기능 5종 정리]]에 있습니다.

| 기능 | 하려던 것 | 실제 |
|---|---|---|
| Source freshness | 최상류 스냅샷 뷰에 `loaded_at_field`, warn 1일 / error 5일 | 정확히 동작. 단 소스 6개 중 1개에만 |
| pre/post hook | 모델별 실행 시작·종료 시각을 로그 테이블에 기록해 튜닝 근거로 | 설정 파일 YAML 파손으로 한 번도 적용되지 않음. dbt가 남기는 `run_results.json`과 기능이 겹치기도 함 |
| Macro | 캠페인월 ±N개월 계산, 스냅샷 최신 기준월 동적 조회(`run_query`) | 25곳에서 실사용, 프로시저 반복 코드를 실제로 줄임. 파라미터 결함은 [[고객마트 dbt 구조 진단]] |
| Test | 복합키 정합성(`dbt_utils.unique_combination_of_columns`) | 동작하는 테스트 1건. 나머지는 스크래치 |
| Docs | schema.yml에 group·모델·컬럼 설명 | 64개 중 12개. 판정 임계값과 정책 변경 이력까지 적어 내용은 밀도 있음 |

"기능을 아는 것"과 "프로젝트 전체에 계약으로 정착시키는 것" 사이의 간극이 이 표에 그대로 있습니다. freshness도 hook도 테스트도 첫 사례는 정확했는데 나머지로 퍼지지 못했습니다.

## 미완으로 남긴 것

당시 TODO 기준으로 끝낸 것은 둘입니다. 스테이징 뷰를 소스로 등록해 freshness를 걸었고, hook으로 실행 시간을 기록하는 설계를 잡았습니다(적용은 위 표대로 실패).

남은 것은 이렇습니다.

- Dagster asset을 dbt source로 등록해 모델이 거기에 의존하게 하기 — 청약 주차별 타겟 모델에 `-- depends_on: source('dagster', ...)` 주석 흔적만 남아 있습니다
- Dagster에서 dbt asset으로 변수 넘기기 — 이게 됐다면 그 타겟 모델의 파라미터 유실은 없었을 겁니다
- upsert(증분) — incremental 도입과 같은 과제
- dagster + dlt 연계, 로컬 key-value 스토리지

앞의 둘(변수 주입, asset-source 의존)이 정확히 조용히 틀리는 지점과 겹칩니다. 오케스트레이션 통합은 "있으면 좋은 것"이 아니라 정합성 문제였습니다.

다시 [[Projects/customer-analytics-mart/index|프로젝트 개요]]로
