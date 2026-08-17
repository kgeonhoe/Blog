---
title: dbt
tags:
  - dbt
  - data-modeling
draft: true
created: 2026-08-15
---

SQL 기반 변환 도구 dbt를 쓰면서 정리한 학습 노트.

## 글 목록

1. [[dbt 실전 기능 5종 정리]]
   Source Freshness, pre/post Hook, Macro(`run_query`·`date_spine`), Test(generic·singular), Docs·group·tags·meta·exposure. 그리고 ephemeral을 조인에 썼을 때의 한계.

2. [[dbt incremental 모델 — is_incremental()의 한계]]
   `max({{ this }})` 방식이 왜 무너지는지, 날짜를 변수로 빼고 `is_incremental()` 분기를 없애는 과정, 룩백과 `delete+insert`, Airflow에서 `data_interval_end`를 주입하는 법, dbt 1.9의 `microbatch`.

## 실무 적용 기록

실제 프로젝트에서 이 기능들을 어디까지 정착시켰는지는 프로젝트 쪽에 있다.

- [[Projects/customer-analytics-mart/index|SP 하나에 몰아넣던 고객 분석 마트, dbt로 옮기기]]
- [[Projects/customer-analytics-mart/고객마트 dbt 구조 진단]]
- [[Projects/customer-analytics-mart/고객마트 Dagster 통합]]

## 관련

- [[Studies/Data Orcastration/Dagster/Index|Dagster]] — dbt 모델을 asset으로 올려 오케스트레이션하는 쪽
- [[Studies/dbt]] — 도구 카탈로그 카드
