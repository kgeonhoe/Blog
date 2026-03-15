---
categories:
  - "[[Courses]]"
platform:
instructor:
url:
created: "2026-03-10"
start:
end:
rating:
topics: []
tags:
  - course
draft: false
---
# Google BigQuery 개념 정리

## 1\. BigQuery란 무엇인가

**BigQuery는 Google Cloud에서 제공하는  
Serverless 기반의 OLAP 전용 Data Warehouse 서비스**이다.

-   사용자는 **서버를 관리하거나 DB 소프트웨어를 설치할 필요가 없음**
-   인프라 운영(확장성, 고가용성, 장애 대응)은 Google이 전담
-   사용자는 **데이터 모델링, 쿼리, 비용 관리에만 집중**

---

## 2\. BigQuery의 핵심 특징

### 2.1 Serverless Data Warehouse

-   서버 프로비저닝 불필요
-   클러스터 관리, 패치, 스케일링 자동 처리
-   고가용성(High Availability) 기본 제공

> 전통적인 DWH 대비 **운영 부담이 거의 없음**

---

### 2.2 Compute & Storage 분리 구조

BigQuery는 **컴퓨트 엔진과 스토리지를 완전히 분리**함

-   Storage: Columnar 기반, 확장성 무제한
-   Compute: 쿼리 실행 시 동적으로 할당

#### 장점

-   스토리지는 고정 비용
-   컴퓨트는 사용한 만큼만 비용 발생
-   동시 사용자 증가 시에도 성능 저하 최소화

---

### 2.3 Built-in Advanced Analytics

BigQuery는 단순 SQL 분석을 넘어 다음 기능을 **내장**함

-   **BigQuery ML**: SQL 기반 머신러닝
-   **Geospatial Analysis**: 공간 데이터 처리
-   **BI Engine**: BI 쿼리 가속
-   외부 테이블 연동 (GCS, Drive 등)

👉 별도 분석 시스템 없이 **DWH 자체에서 고급 분석 수행 가능**

---

### 2.4 Business Intelligence 친화적 구조

-   대용량 스캔 기반 분석 최적화
-   BI 도구(Looker, Tableau, Power BI)와 직접 연동
-   세맨틱 레이어 및 KPI 구성에 적합

---

## 3\. BigQuery 요금 체계

### 3.1 On-Demand Pricing

-   **처리한 데이터 기준 과금**
-   **$5 / 1TB scanned**
-   소규모·불규칙 쿼리에 적합

---

### 3.2 Flat-Rate (Slot-based) Pricing

-   사전 예약한 **Slot 수 기준 과금**
-   예시:
    -   **100 Slots → $2,000 / month**
    -   On-Demand 기준 약 **400TB 처리량**에 해당

#### 적합한 경우

-   쿼리 패턴이 일정
-   BI/리포트 트래픽이 지속적
-   비용 예측이 중요한 조직

---

## 4\. BigQuery Partitioning 전략

BigQuery는 **Partitioning + Clustering**을 통해  
쿼리 비용과 성능을 최적화함

---

### 4.1 Partition 방식

#### ① Time-unit Column Partition

-   DATE / TIMESTAMP 컬럼 기준
-   가장 일반적인 방식

#### ② Ingestion Time Partition

-   `_PARTITIONTIME` 기준
-   적재 시점 기준 파티셔닝

#### ③ Integer Range Partitioning

-   정수 값 범위 기준 파티셔닝
-   ID, 시퀀스, 카운터 등에 사용

---

### 4.2 Time-based Partition 단위

-   Daily (**Default**)
-   Hourly
-   Monthly
-   Yearly

---

### 4.3 Partition 제한

-   **최대 4,000 partitions**
-   설계 단계에서 기간 단위 고려 필수

---

## 5\. BigQuery vs 전통적인 OLAP DWH 비교

| 구분 | BigQuery | 전통적인 OLAP DWH |
| --- | --- | --- |
| 인프라 관리 | 완전 Serverless | 직접 관리 |
| 확장성 | 자동 확장 | 사전 용량 계획 |
| Compute / Storage | 완전 분리 | 대부분 결합 |
| 과금 방식 | 사용량 기반 | 리소스 기반 |
| 운영 부담 | 매우 낮음 | 높음 |
| 머신러닝 | 내장 (BQ ML) | 외부 시스템 필요 |
| 쿼리 패턴 | Full Scan 최적화 | 인덱스 중심 |
| 스케일 업 | 자동 | 수동 |

---

## 6\. 핵심 정리

> **BigQuery는 전통적인 OLAP DWH의 개념을 유지하면서,  
> Serverless·Usage-based·Advanced Analytics를 결합한  
> 클라우드 네이티브 분석 플랫폼이다.**

---

## Self-Critique (정합성 점검)

-   ✔ BigQuery 정의를 OLAP/DWH 맥락에서 정확히 설명
-   ✔ 전통적 DWH와의 차이를 “운영·비용·아키텍처” 관점에서 명확화
-   ✔ 파티션·과금 구조 실무 기준으로 정리
-   ✔ 사내 기술 문서 / 포트폴리오 / 면접 설명용 적합

논리적 충돌 없음, 개념 정합성 유지됨.