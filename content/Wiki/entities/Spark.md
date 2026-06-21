---
title: "Spark"
categories:
  - "[[Wiki]]"
  - "[[Data Engineering]]"
tags:
  - distributed-computing
  - stream-processing
  - batch-processing
  - pyspark
draft: false
created: 2026-05-14
updated: 2026-05-14
sources:
  - "[[Studies/Spark]]"
  - "[[Projects/Nasdaq-Stock-Pipeline/2. Kafka Consumer (Spark Structured Streaming)]]"
  - "[[Activities/DataTalksClub-data-engineering/week6(Batch Pipeline - spark)]]"
---

## 개요

**Apache Spark**는 대규모 데이터 처리를 위한 통합 분석 엔진입니다. 메모리 기반 처리로 Hadoop MapReduce 대비 100배 이상 빠른 성능을 제공하며, 배치 처리와 스트리밍 처리를 단일 API로 지원합니다.

> *Source: [[Studies/Spark]]*

---

## 핵심 개념

### Spark Structured Streaming

실시간 데이터 스트림을 DataFrame/Dataset API로 처리하는 Spark의 스트림 처리 엔진입니다.

- **Micro-batch 처리**: 스트림 데이터를 작은 배치로 나누어 처리
- **Exactly-once 보장**: Checkpoint와 Write Ahead Log로 장애 복구
- **통합 API**: 배치 처리 코드를 거의 수정 없이 스트리밍에 적용 가능

> *Source: [[Projects/Nasdaq-Stock-Pipeline/2. Kafka Consumer (Spark Structured Streaming)]]*

### Lambda Architecture with Spark

Spark는 람다 아키텍처에서 **Speed Layer와 Batch Layer를 모두 담당**할 수 있습니다.

```
Batch Layer (Spark Batch)    Speed Layer (Spark Streaming)
        │                              │
        ▼                              ▼
    PostgreSQL ←──────────────→    Redis (Serving Layer)
```

**Nasdaq 프로젝트 적용 사례**:
- **Batch Layer**: Airflow가 트리거, Spark가 과거 데이터 수집
- **Speed Layer**: Spark Structured Streaming이 Kafka 토픽 실시간 소비
- **Serving Layer**: Redis에서 배치 데이터(과거 가격) + 실시간 데이터(현재가) 결합

이를 통해 **200일 이동평균선** 같은 장기 지표를 실시간으로 계산할 수 있습니다.

> *Source: [[Projects/Nasdaq-Stock-Pipeline/2. Kafka Consumer (Spark Structured Streaming)]]*

---

## 프로젝트 활용

### Nasdaq Stock Pipeline

**Kafka Consumer로서 역할**:

| 역할 | 설명 |
|------|------|
| **실시간 소비** | Kafka 토픽(`stock.kis`, `stock.yfinance`)에서 주식 데이터 수신 |
| **기술적 지표 계산** | RSI, 볼린저밴드, MACD 실시간 계산 |
| **하이브리드 처리** | PostgreSQL 히스토리컬 데이터 + Kafka 실시간 데이터 결합 |
| **자동 신호 감지** | 과매수/과매도, 밴드 터치, 이상 거래량 감지 |

**Redis 저장 구조**:
```
signal:{symbol}     ← 기술적 신호 (RSI, MACD 크로스오버)
price:{symbol}      ← 실시간 가격
indicator:{symbol}  ← 지표값 (RSI, 볼린저밴드, MACD)
```

**처리 흐름**:
1. Kafka에서 실시간 주가 데이터 수신
2. PostgreSQL에서 과거 가격 데이터 조회
3. 기술적 지표 계산 (200일 MA, RSI, 볼린저밴드)
4. 매매 신호 감지 및 Redis 저장
5. Streamlit Dashboard 실시간 반영

> *Source: [[Projects/Nasdaq-Stock-Pipeline/2. Kafka Consumer (Spark Structured Streaming)]]*

---

## 관련 기술

### 데이터 처리 스택

- [[Wiki/entities/Kafka]] - 스트림 데이터 소스 (Spark Structured Streaming의 Input)
- [[Wiki/entities/Airflow]] - Spark Batch 작업 스케줄링
- **PostgreSQL** - 배치 처리 결과 저장소
- **Redis** - 스트리밍 처리 결과 저장소 (Serving Layer)

### 비교 대상

- **Flink** - 진정한 실시간 처리 (micro-batch 없음), 더 복잡한 상태 관리
- **Storm** - 저수준 스트림 처리, 높은 러닝 커브

---

## 학습 자료

### 실습 환경

**Windows에서 PySpark 설치**: [[Studies/Spark]]에 환경 설정 가이드 있음

**Docker에서 PySpark 사용**: [[Studies/Spark]]에 Docker 기반 실습 방법 있음

### 교육 프로그램

**DataTalksClub Week6 - Batch Pipeline**: [[Activities/DataTalksClub-data-engineering/week6(Batch Pipeline - spark)]]
- Spark 기본 개념
- PySpark DataFrame API
- 배치 처리 파이프라인 구축

---

## 참고 자료

- **공식 문서**: https://spark.apache.org/
- **활용 프로젝트**: [[Projects/Nasdaq-Stock-Pipeline/]]
- **학습 노트**: [[Studies/Spark]]
- **교육 자료**: [[Activities/DataTalksClub-data-engineering/week6(Batch Pipeline - spark)]]
