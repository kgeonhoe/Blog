---
title: "Kafka"
categories: ["Data Engineering", "Tools"]
tags: ["kafka", "streaming", "messaging", "data-pipelines"]
draft: false
created: 2026-05-14
updated: 2026-05-14
sources: ["[[Studies/Kafka]]", "[[Studies/Docker Compose로 Kafka 로컬 클러스터 띄우기]]", "[[Projects/Nasdaq-Stock-Pipeline/1. Kafka Producer]]"]
---

# Kafka

> 분산 이벤트 스트리밍 플랫폼. 실시간 데이터 파이프라인 구축의 핵심 기술.

## 개요

Apache Kafka는 고성능 분산 스트리밍 플랫폼으로, 실시간 데이터 파이프라인 및 스트리밍 애플리케이션 구축에 사용됩니다.

**공식 사이트**: https://kafka.apache.org/

## 핵심 개념

### 토픽 (Topic)
메시지를 저장하는 논리적 단위. 파티션으로 분산 저장됩니다.
(원본: [[Studies/Kafka]])

### Producer
Kafka 토픽에 메시지를 발행하는 클라이언트. 
실제 구현: [[Projects/Nasdaq-Stock-Pipeline/1. Kafka Producer]]

### Consumer
Kafka 토픽에서 메시지를 구독하는 클라이언트.
실제 구현: [[Projects/Nasdaq-Stock-Pipeline/2. Kafka Consumer (Spark Structured Streaming)]]

### Consumer Group
여러 Consumer가 협력하여 메시지를 처리하는 단위.
(원본: [[Studies/Kafka]])

## 프로젝트 활용

### Nasdaq 실시간 파이프라인
Kafka를 활용한 실시간 주식 데이터 파이프라인:
- [[Projects/Nasdaq-Stock-Pipeline/index]] - 프로젝트 개요
- [[Projects/Nasdaq-Stock-Pipeline/1. Kafka Producer]] - Python Producer 구현
- [[Projects/Nasdaq-Stock-Pipeline/2. Kafka Consumer (Spark Structured Streaming)]] - Spark로 소비

### 로컬 개발 환경
Docker Compose를 활용한 로컬 Kafka 클러스터 구성:
- [[Studies/Docker Compose로 Kafka 로컬 클러스터 띄우기]]

## 관련 기술

- [[Wiki/entities/Docker]] - 로컬 클러스터 구성에 활용
- [[Wiki/entities/Spark]] - Consumer로 활용 (Structured Streaming)
- [[Studies/RedPanda]] - Kafka 호환 대안
- [[Wiki/comparisons/Kafka-vs-Redpanda]] - Redpanda와 비교 분석

## 주요 패턴

### DLQ (Dead Letter Queue)
처리 실패 메시지를 별도 토픽으로 라우팅:
- [[Studies/Kafka 토픽 분리와 DLQ 패턴]]
- [[Studies/Kafka 토픽 분리와 DLQ 아키텍처]]

## 트러블슈팅

### 연결 오류
- [[Projects/Nasdaq-Stock-Pipeline/Trouble Shooting/Kafka 연결 오류]]

## 참고 자료

**학습 노트:**
- [[Studies/Kafka]] - Kafka 기본 개념
- [[Studies/Docker Compose로 Kafka 로컬 클러스터 띄우기]] - 로컬 환경 구성

**프로젝트:**
- [[Projects/Nasdaq-Stock-Pipeline/index]] - 실전 활용 사례

**강의:**
- [[Activities/DataTalksClub-data-engineering/week7(Stream)]] - 스트리밍 강의
