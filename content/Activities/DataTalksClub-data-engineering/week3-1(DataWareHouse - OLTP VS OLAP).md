---
categories:
  - "[[Courses]]"
platform: DataTalksClub
instructor: alexeygrigorev
url:
created: 2026-03-10
start:
end:
rating:
topics:
tags:
  - course
draft: false
---
# OLTP vs OLAP

## 1\. OLTP (Online Transaction Processing)

**정의**

> 실시간 업무 처리를 위한 운영 시스템  
> (주문, 결제, 재고 차감, 송금 등)

### 데이터 모델 관점

-   **정규화 중심 (3NF)**
-   데이터 **중복 최소화**
-   **INSERT / UPDATE / DELETE** 빈번
-   트랜잭션 무결성(ACID) 최우선

### 특징

-   짧고 단순한 쿼리 위주
-   ms 단위 응답속도 요구
-   장애 발생 시 서비스에 즉각적 영향

## 2\. OLAP (Online Analytical Processing)

**정의**

> 의사결정과 분석을 위한 분석 시스템  
> (성과 분석, 트렌드 파악, KPI, 리포트)

### 데이터 모델 관점

-   **조회 성능 최우선**
-   분석 편의성 강조
-   **비정규화 모델** (Star / Snowflake Schema)
-   **UPDATE 거의 없음**
-   Append-only 성격의 데이터 적재

### 특징

-   대용량 데이터 스캔
-   집계, 조인, 그룹핑 중심 쿼리
-   응답속도는 초~분 단위 허용

---

## 3\. OLTP와 OLAP의 역할 구분

-   **OLTP**
    -   실제 서비스에서 사용되는 **운영 DB**
    -   비즈니스 트랜잭션의 _사실(fact)_ 이 생성되는 지점
-   **OLAP**
    -   OLTP를 통해 생성된 결과 데이터를
    -   **분석 목적에 맞게 가공·적재한 분석 DB**
    -   일반적으로 **Data Warehouse(DWH)** 형태로 구현됨

**두가지를 나누는 이유**  
두가지를 동시에 만족하는 DB구성을 가지는것이 좋겟짐나 현실적으로 두DB가 바라보는방향성이 다르다.  
위에서 기술한 바와 같이 OLTP의 경우 실시간 업무 처리를 위해 존재하며(주문,결제,송금)등.. OLAP 의 성격을 적용할경우

-   실시간 쓰기 성능 저하
-   트랜잭션 관리 비효율
-   분석 시스템 구조와 불일치  
    등의 문제가 발생할 수 있다.

## 4\. 일반적인 데이터 아키텍처 흐름

`[ OLTP ] 서비스 DB`

`↓`

  `(CDC / Batch) [ Data Lake / Staging ]`

`↓`

`[ OLAP / Data Warehouse ]`

`↓`

`[ BI / KPI / ML ]`