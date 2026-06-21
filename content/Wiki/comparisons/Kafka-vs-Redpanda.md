---
title: "Kafka vs Redpanda"
categories:
  - "[[Wiki]]"
  - "[[Comparisons]]"
tags:
  - kafka
  - redpanda
  - messaging
  - streaming
draft: false
created: 2026-05-14
updated: 2026-05-14
sources:
  - "[[Studies/Kafka]]"
  - "[[Studies/RedPanda]]"
  - "[[Wiki/entities/Kafka]]"
  - "[[Activities/DataTalksClub-data-engineering/week7(Stream)]]"
query: "Kafka와 Redpanda의 차이는?"
---

## 질문

**"Kafka vs RedPanda 차이는?"**

이 페이지는 사용자 질문에 대한 답변을 저장한 Query 페이지입니다.

---

## 답변 요약

**Redpanda는 Kafka API 호환 스트리밍 플랫폼**으로, Kafka의 복잡성을 제거하고 성능을 개선한 대안입니다.

**핵심 차이**:
- **구현 언어**: Kafka(Java/JVM) vs Redpanda(C++)
- **외부 의존성**: Kafka(ZooKeeper 필수) vs Redpanda(단일 바이너리, 의존성 없음)
- **운영 복잡도**: Kafka(높음) vs Redpanda(매우 낮음)
- **API 호환성**: Redpanda는 100% Kafka API 호환 (코드 변경 없이 마이그레이션 가능)

> *Source: [[Activities/DataTalksClub-data-engineering/week7(Stream)]]*

---

## 상세 비교

### 아키텍처 비교

| 항목 | Apache Kafka | Redpanda |
|------|-------------|----------|
| **구현 언어** | Java (JVM) | C++ |
| **외부 의존성** | ZooKeeper 필수 (3.x 이후 KRaft로 대체 가능) | 없음 (단일 바이너리) |
| **메모리 사용** | JVM Heap + OS Page Cache | 직접 메모리 관리 (더 효율적) |
| **설정 복잡도** | 높음 (ZooKeeper, Broker, Topic, Replication 등) | 낮음 (단일 프로세스) |
| **기동 시간** | 느림 (JVM 초기화 + ZooKeeper 연결) | 매우 빠름 (초 단위) |

> *Source: [[Activities/DataTalksClub-data-engineering/week7(Stream)]]*

### API 호환성

**Redpanda의 핵심 강점**: Kafka API를 100% 호환하므로 기존 Kafka 클라이언트를 **코드 변경 없이 사용 가능**합니다.

```python
# kafka-python을 Redpanda에 그대로 사용
from kafka import KafkaProducer, KafkaConsumer

producer = KafkaProducer(bootstrap_servers='localhost:9092')  # Kafka든 Redpanda든 동일
producer.send('topic', b'message')
```

- `kafka-python`, `confluent-kafka-python` 같은 Kafka 클라이언트 그대로 동작
- Kafka Streams, ksqlDB 같은 생태계는 지원 제한적
- Kafka Connect는 실험적 지원

> *Source: [[Activities/DataTalksClub-data-engineering/week7(Stream)]]*

### 성능 비교

**Redpanda의 성능 우위**:
- **레이턴시**: Redpanda가 더 낮음 (C++ 직접 메모리 관리)
- **처리량**: 고성능 네트워크에서 Redpanda가 유리
- **리소스 효율**: JVM 오버헤드 없음

그러나 Kafka의 최적화 수준도 매우 높으며, 프로덕션 워크로드에서 체감 차이는 사용 패턴에 따라 다릅니다.

> *Source: [[Studies/Kafka]], [[Activities/DataTalksClub-data-engineering/week7(Stream)]]*

---

## 사용 사례별 선택 기준

### Kafka가 적합한 경우

✅ **대규모 프로덕션 환경**
- 성숙한 생태계와 검증된 운영 경험 필요
- Kafka Connect, ksqlDB, Kafka Streams 같은 생태계 도구 활용
- 엔터프라이즈 지원 필요 (Confluent, AWS MSK 등)

✅ **복잡한 스트림 처리**
- Kafka Streams로 복잡한 스트림 처리 로직 구현
- ksqlDB로 SQL 기반 스트림 처리

> *Source: [[Wiki/entities/Kafka]]*

### Redpanda가 적합한 경우

✅ **학습 및 실습**
- Docker Compose로 로컬 클러스터 빠르게 구성
- 운영 복잡도 제거로 **스트리밍 개념**에 집중
- DataTalksClub Week7 실습이 이 케이스

✅ **소규모 프로덕션 / 스타트업**
- 운영 인력 부족 (DevOps 리소스 제약)
- 빠른 기동 및 간단한 설정 필요
- 높은 성능과 낮은 레이턴시 요구

✅ **Kafka 마이그레이션 고려 중**
- API 호환성으로 무중단 전환 가능
- 운영 비용 절감 목적

> *Source: [[Activities/DataTalksClub-data-engineering/week7(Stream)]]*

---

## 실제 프로젝트 사용 패턴

### Nasdaq Stock Pipeline (Kafka 사용)

[[Projects/Nasdaq-Stock-Pipeline/]]에서는 **Kafka**를 선택했습니다.

**이유**:
- 프로덕션 레벨 아키텍처 학습 목적
- Kafka Streams, Schema Registry 같은 생태계 도구 활용
- AWS MSK 같은 관리형 서비스로 확장 가능성

> *Source: [[Projects/Nasdaq-Stock-Pipeline/]]*

### DataTalksClub Week7 (Redpanda 사용)

[[Activities/DataTalksClub-data-engineering/week7(Stream)]]에서는 **Redpanda**를 사용했습니다.

**이유**:
- 실습의 핵심은 **"스트리밍 처리 개념과 Flink"**이지 Kafka 운영이 아님
- Docker Compose 기반 빠른 환경 구성
- 운영 복잡도를 줄여 **본질(스트리밍 처리)**에 집중

> *Source: [[Activities/DataTalksClub-data-engineering/week7(Stream)]]*

---

## 관련 페이지

- [[Wiki/entities/Kafka]] - Apache Kafka 상세 페이지
- [[Studies/RedPanda]] - Redpanda 학습 노트 (현재 비어있음, 향후 작성 필요)
- [[Activities/DataTalksClub-data-engineering/week7(Stream)]] - Redpanda 실습 경험
- [[Projects/Nasdaq-Stock-Pipeline/]] - Kafka 프로덕션 사용 사례

---

## 참고 자료

- **Kafka 공식 문서**: https://kafka.apache.org/
- **Redpanda 공식 문서**: https://redpanda.com/
- **DataTalksClub Week7 실습**: [[Activities/DataTalksClub-data-engineering/week7(Stream)]]
