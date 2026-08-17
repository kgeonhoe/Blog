---
title: Dagster
tags:
  - dagster
  - orchestration
draft: true
created: 2026-08-15
---

Asset 중심 오케스트레이터인 Dagster를 개념부터 실전 구성까지 세 편으로 나눠 정리했다.

## 글 목록

1. [[Dagster의 자산 중심 워크플로우]]
   쿠키 비유로 보는 Task와 Asset의 차이, `@asset`이 정의하는 것, dbt 모델이 asset으로 올라오는 모습.

2. [[Airflow 3와 Dagster 비교]]
   축별 비교표, Airflow 3의 `@asset`이 왜 같아 보이는데 다른지, 리니지에서 갈리는 지점, Dagster 쪽 약점.

3. [[Dagster 파티션키와 스케줄 실전 구성]]
   `Definitions` 진입점, `ConfigurableResource` 클래스, 파티션키, asset 팩토리, `build_schedule_from_partitioned_job`, Launchpad, 파티션이 초록으로 칠해지는 원리.

## 실무 적용 기록

개념이 아니라 실제로 이 도구를 골라서 쓴 기록은 프로젝트 쪽에 있다.

- [[Projects/customer-analytics-mart/고객마트 Dagster 통합|고객마트 Dagster 통합 — 왜 Airflow가 아니었나]]
- [[Projects/customer-analytics-mart/index|프로젝트 개요]]

## 관련

- [[Studies/dbt/Index|dbt]] — Dagster에 물리는 변환 레이어
- [[Studies/Dagster]] — 도구 카탈로그 카드
