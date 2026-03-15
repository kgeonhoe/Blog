---
categories:
  - "[[Troubleshooting]]"
created: 2025-07-28
topics:
  - "[[Airflow]]"
  - "[[Docker]]"
tags:
  - troubleshooting
  - airflow
  - docker
draft: false
---

# Airflow 메모리 부족 문제 (OOM)

## 문제 상황

Airflow Worker 컨테이너가 5년치 데이터 수집 작업 도중 OOM(Out-of-Memory)으로 강제 종료되었습니다.

## 로그

```
[2025-07-28, 18:49:01 KST] WARNING - State of this instance has been externally set to restarting.
[2025-07-28, 18:50:01 KST] WARNING - process did not respond to SIGTERM. Trying SIGKILL
[2025-07-28, 18:50:01 KST] ERROR - Job 53 was killed before it finished
                                   (likely due to running out of memory)
```

---

## 해결 방법

### 1. Docker Compose 메모리 제한 추가

```yaml
airflow-worker:
  environment:
    <<: *airflow-common-env
  command: celery worker
  mem_limit: 6g        # 메모리 제한
  memswap_limit: 8g    # 스왑 포함 메모리 제한
  restart: unless-stopped
```

### 2. Python 코드 메모리 최적화 — 배치 처리

대량 데이터를 한번에 처리하지 않고 배치 단위로 나누어 처리하도록 수정했습니다.

```python
# 배치별로 처리
for batch_start in range(0, total_symbols, batch_size):
    batch_end = min(batch_start + batch_size, total_symbols)
    batch_symbols = symbols[batch_start:batch_end]
    batch_num = (batch_start // batch_size) + 1

    print(f"\n📦 배치 {batch_num}/{total_batches}: {len(batch_symbols)}개 종목 처리 중...")
    # 배치 처리 후 메모리 해제
```

**핵심 파라미터**:
- `batch_size = 200` — 배치당 처리 종목 수
- `max_workers = 4` — 병렬 처리 워커 수

---

## 결과

- OOM 강제 종료 없이 나스닥 전체 종목 5년치 데이터 수집 완료
- 메모리 사용량을 배치 단위로 제어하여 안정적인 장시간 실행 가능
