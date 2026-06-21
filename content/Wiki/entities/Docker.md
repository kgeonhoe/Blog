---
title: "Docker"
categories: ["DevOps", "Tools"]
tags: ["docker", "container", "devops"]
draft: false
created: 2026-05-14
updated: 2026-05-14
sources: ["[[Studies/Docker]]", "[[Studies/Docker Compose로 Kafka 로컬 클러스터 띄우기]]"]
---

# Docker

> 컨테이너 기반 애플리케이션 배포 및 관리 플랫폼.

## 개요

Docker는 애플리케이션을 컨테이너로 패키징하여 어디서든 동일한 환경에서 실행할 수 있게 해주는 플랫폼입니다.

**공식 사이트**: https://www.docker.com/  
**문서**: https://docs.docker.com/

## 핵심 개념

### 컨테이너
애플리케이션과 의존성을 격리된 환경에서 실행하는 경량 가상화 기술.
(원본: [[Studies/Docker]])

### 이미지
컨테이너를 생성하기 위한 템플릿. Dockerfile로 정의.
(원본: [[Studies/Docker]])

### Docker Compose
여러 컨테이너를 정의하고 실행하는 도구. YAML 파일로 설정.
예시: [[Studies/Docker Compose로 Kafka 로컬 클러스터 띄우기]]

## 프로젝트 활용

### Kafka 로컬 클러스터
Docker Compose로 Kafka 개발 환경 구성:
- [[Studies/Docker Compose로 Kafka 로컬 클러스터 띄우기]]
- Zookeeper, Kafka Broker, Schema Registry 등 포함

### Nasdaq 파이프라인 환경
데이터 파이프라인 구성 요소를 Docker로 실행:
- [[Projects/Nasdaq-Stock-Pipeline/index]] - Docker 기반 인프라

### Airflow 컨테이너화
Airflow를 Docker로 실행:
- [[Studies/Airflow]] - Docker에서 Airflow 실행

## 관련 학습

### WSL 환경
- WSL에서 Docker 설치 및 설정 (원본: [[Studies/Docker]])

### Dockerfile 작성
- Dockerfile 작성법 (원본: [[Studies/Docker]])

### PySpark 연동
- Docker로 PySpark 사용하기 (원본: [[Studies/Docker]])

### 폐쇄망 구성
- 폐쇄망에서 Docker 환경 구성 (원본: [[Studies/Docker]])

## 관련 기술

- [[Wiki/entities/Kafka]] - Docker Compose로 클러스터 구성
- [[Wiki/entities/Airflow]] - Docker 컨테이너로 실행
- [[Studies/Spark]] - Docker로 PySpark 환경 구성

## 참고 자료

**학습 노트:**
- [[Studies/Docker]] - Docker 기본 개념 및 활용
- [[Studies/Docker Compose로 Kafka 로컬 클러스터 띄우기]] - Docker Compose 실습

**프로젝트:**
- [[Projects/Nasdaq-Stock-Pipeline/index]] - Docker 기반 파이프라인
