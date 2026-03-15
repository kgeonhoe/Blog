---
categories:
  - "[[Projects]]"
status: completed
stack:
  - "[[Kafka]]"
  - "[[Spark]]"
  - "[[Airflow]]"
  - "[[Docker]]"
  - "[[Python]]"
repo: https://github.com/kgeonhoe/stock-kafka3/tree/postgres
created: 2025-07-28
topics:
  - "[[Data Pipelines]]"
  - "[[Data Engineering]]"
tags:
  - project
  - pipeline
draft: false
---

# Nasdaq Stock Data Pipeline

KIS API와 yfinance로부터 주식 데이터를 실시간으로 수집하고 Spark로 기술적 지표를 계산하는 통합 데이터 파이프라인입니다.
배치와 스트리밍을 동시에 운영하는 **Lambda Architecture** 기반으로 설계되었습니다.

## 기술 스택

| 역할 | 도구 |
|------|---------|
| 수집 | Kafka (KIS API / yfinance) |
| 스트리밍 처리 | Spark Structured Streaming |
| 배치 수집 | Airflow + FinanceDataReader |
| 저장 | PostgreSQL, Redis |
| 시각화 | Streamlit |
| 인프라 | Docker Compose |

## 상세 페이지

- [[Activities/Nasdaq-Stock-Pipeline/index|프로젝트 상세]]
- [[Activities/Nasdaq-Stock-Pipeline/회고록|회고록]]
