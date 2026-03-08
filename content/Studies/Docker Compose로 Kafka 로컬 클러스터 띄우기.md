---
categories:
  - "[[TIL]]"
created: 2026-03-06
topics:
  - "[[Docker]]"
  - "[[Kafka]]"
tags:
  - til
  - docker
  - kafka
draft: false
---

## 배운 것

[[Docker]] Compose로 [[Kafka]] 클러스터를 로컬에 띄우는 방법을 정리한다.

## 핵심 정리

### Docker Compose 설정

```yaml
version: '3.8'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
```

### 실행 및 확인

```bash
# 클러스터 시작
docker compose up -d

# 토픽 생성
docker exec -it kafka kafka-topics --create \
  --topic test-topic \
  --bootstrap-server localhost:9092 \
  --partitions 3

# 토픽 목록 확인
docker exec -it kafka kafka-topics --list \
  --bootstrap-server localhost:9092
```

> [!tip] 팁
> `docker compose logs -f kafka`로 실시간 로그를 확인하면 디버깅이 편하다.

### 주의사항

- [ ] `KAFKA_ADVERTISED_LISTENERS`를 호스트 환경에 맞게 설정
- [ ] Zookeeper 없는 KRaft 모드도 검토 ([[Kafka]] 3.3+)

## 참고 링크

- [Confluent Docker 문서](https://docs.confluent.io/platform/current/installation/docker/config-reference.html)
- [[Kafka]]
- [[Docker]]
