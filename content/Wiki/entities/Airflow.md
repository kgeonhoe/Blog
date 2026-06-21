---
title: "Airflow"
categories: ["Data Engineering", "Tools"]
tags: ["airflow", "orchestration", "workflow", "data-pipelines"]
draft: false
created: 2026-05-14
updated: 2026-05-14
sources: ["[[Studies/Airflow]]", "[[Projects/Nasdaq-Stock-Pipeline/3. Airflow (배치처리)]]"]
---

# Airflow

> 워크플로를 프로그래밍 방식으로 작성, 스케줄링, 모니터링하기 위한 플랫폼.

## 개요

Apache Airflow는 데이터 파이프라인을 DAG(Directed Acyclic Graph)로 정의하고 실행하는 워크플로 오케스트레이션 도구입니다.

**공식 사이트**: https://airflow.apache.org/  
**문서**: https://airflow.apache.org/docs/

## 핵심 개념

### DAG (Directed Acyclic Graph)
작업(Task)들 간의 의존성을 방향성 비순환 그래프로 표현한 워크플로.
(원본: [[Studies/Airflow]])

### Task
DAG 내에서 실행되는 개별 작업 단위. Operator로 정의.
(원본: [[Studies/Airflow]])

### Scheduler
DAG를 모니터링하고 Task를 실행할 시점을 결정.
(원본: [[Studies/Airflow]])

### Executor
Task를 실제로 실행하는 컴포넌트. 
- LocalExecutor, CeleryExecutor 등 (원본: [[Studies/Airflow]])

## 프로젝트 활용

### Nasdaq 배치 처리
Airflow로 주기적 배치 작업 스케줄링:
- [[Projects/Nasdaq-Stock-Pipeline/3. Airflow (배치처리)]]
- [[Projects/Nasdaq-Stock-Pipeline/index]] - 프로젝트 개요

### 환경 구성
Docker에서 Airflow 실행:
- [[Studies/Airflow]] - Docker 환경 설정
- [[Studies/Docker]] 활용

## 관련 기술

- [[Wiki/entities/Docker]] - Airflow 컨테이너 실행
- [[Studies/Dagster]] - 대안 오케스트레이션 도구
- [[Wiki/topics/Batch-Processing]] - 배치 처리 패턴
- [[Studies/Celery]] - CeleryExecutor 설정

## 학습 자료

### 환경 설정
- Docker에서 Airflow 컨테이너 실행 (원본: [[Studies/Airflow]])
- Celery Executor 설정 (원본: [[Studies/Airflow]])
- 폐쇄망에서 Airflow 구축 (원본: [[Studies/Airflow]])

## 트러블슈팅

### 메모리 문제
- [[Projects/Nasdaq-Stock-Pipeline/Trouble Shooting/Airflow 메모리 문제]]

## 비교

### Airflow vs Dagster
- Airflow: 성숙한 생태계, Python DAG 기반
- Dagster: 소프트웨어 정의 자산(SDA), dbt 네이티브 통합
- 참고: [[Studies/Dagster]]

## 참고 자료

**학습 노트:**
- [[Studies/Airflow]] - Airflow 기본 개념 및 환경 설정

**프로젝트:**
- [[Projects/Nasdaq-Stock-Pipeline/3. Airflow (배치처리)]] - 실전 활용
- [[Projects/Nasdaq-Stock-Pipeline/Trouble Shooting/Airflow 메모리 문제]] - 트러블슈팅

**강의:**
- [[Activities/DataTalksClub-data-engineering/week5(Data Platform - bruin)]] - Data Platform 강의
