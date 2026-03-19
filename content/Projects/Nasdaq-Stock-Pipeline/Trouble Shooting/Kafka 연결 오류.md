---
categories:
  - "[[Troubleshooting]]"
created: 2025-08-10
topics:
  - "[[Data Engineering]]"
tags:
  - troubleshooting
  - kafka
  - docker
draft: false
---

# Kafka 연결 오류

## 증상
Producer 또는 Consumer가 Kafka 브로커에 연결하지 못하거나, 토픽을 찾을 수 없다는 오류가 발생하는 경우.

## 해결 방법

```bash
# Kafka 서비스 상태 확인
docker-compose ps kafka
docker logs kafka

# 토픽 존재 확인
docker exec kafka kafka-topics.sh --list --bootstrap-server localhost:9092
```
