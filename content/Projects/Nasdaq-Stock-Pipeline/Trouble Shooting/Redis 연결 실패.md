---
categories:
  - "[[Troubleshooting]]"
created: 2025-08-10
topics:
  - "[[Data Engineering]]"
tags:
  - troubleshooting
  - redis
  - docker
draft: false
---

# Redis 연결 실패

## 증상
Streamlit 대시보드에서 Redis 데이터를 불러오지 못하거나, 연결 오류 메시지가 발생하는 경우.

## 해결 방법

```bash
# Redis 컨테이너 재시작
docker-compose restart redis

# 로그 확인
docker logs redis-stock
```
