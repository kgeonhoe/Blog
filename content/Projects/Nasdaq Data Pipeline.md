---
categories:
  - "[[Projects]]"
status: completed
stack:
  - "[[Airflow]]"
  - "[[Docker]]"
  - "[[Kafka]]"
  - "[[Spark]]"
  - "[[DuckDB]]"
repo:
created: 2026-03-05
topics:
  - "[[Data Pipelines]]"
tags:
  - project
  - pipeline
draft: false
---

## 목표

Nasdaq 주식 데이터를 실시간으로 수집하여 분석 가능한 형태로 제공하는 데이터 파이프라인.

## 아키텍처

```
Nasdaq API → Kafka → Spark → DuckDB → Streamlit
```

## 기술 스택

- **수집**: Kafka
- **처리**: Spark
- **저장**: DuckDB
- **스케줄링**: Airflow
- **시각화**: Streamlit
- **인프라**: Docker
