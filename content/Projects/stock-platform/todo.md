---
title: "stock-platform TODO"
categories:
  - "[[Projects]]"
  - "[[stock-platform]]"
tags:
  - stock-platform
  - todo
  - roadmap
  - internal
draft: true
created: "2026-06-21"
updated: "2026-06-21"
---
# TODO

> 마지막 업데이트: 2026-06-10

---

## 🔴 즉시 처리

### 1. ARCHITECTURE.md MinIO IP 업데이트
- 파일: `docs/ARCHITECTURE.md`
- 현재: `192.168.219.111:9010` (구버전)
- 변경: `192.168.219.107:9010` (API), `192.168.219.107:9011` (콘솔)
- 관련: `docs/MINIO_SETUP.md` 등 IP 하드코딩 문서 일괄 검토 필요

### 2. `signals_assets` Dagster 미등록
- 파일: `dagster_project/assets/__init__.py`
- 문제: `signals_assets` 모듈이 import/export 안 됨 → Dagster UI에서 `trading_signals` asset 안 보임
- 수정:
  ```python
  from . import nasdaq_assets, krx_assets, indicators_assets, krx_indicators_assets, backfill_assets, signals_assets
  ```
- 주의: `trading_signals`는 `technical_indicators`를 upstream으로 가져야 하는데 NASDAQ용(`indicators_assets`)만 존재, KRX용 연결 미정

---

## 🟡 중기 처리

### 3. DuckDB Materialization (쿼리 성능 개선)
- 현재: DuckDB VIEW가 매 쿼리마다 MinIO S3 파일을 실시간 읽음
- 문제: 심볼 수 증가 시 (KRX ~2,500 + NASDAQ ~3,900) 쿼리 느려짐
- 방안:
  ```sql
  -- stock.duckdb 테이블로 materialized 복사
  CREATE TABLE ohlcv_nasdaq AS SELECT * FROM ohlcv_bronze_nasdaq;
  CREATE TABLE ohlcv_krx    AS SELECT * FROM ohlcv_bronze_krx;
  ```
- 고려사항: 매일 갱신 로직 필요 (Dagster asset 완료 후 DuckDB 테이블 refresh)
- 임계: Bronze 파일 수가 체감 느려질 때 도입

### 4. Silver / Gold 레이어 미구현
- 현재: `setup.sql`에서 Silver/Gold VIEW 주석 처리됨
- Silver: 날짜 파티션 정제 레이어 (`stockdata/silver/...`)
- Gold: 기술적 지표, 집계 레이어 (`stockdata/gold/...`)
- 현재 계획: Spark 처리 예정이었으나 미착수
- 대안 검토: Spark 없이 Dagster + DuckDB CTAS로 Silver/Gold 대체 가능

### 5. `trading_signals` KRX 연동 미완
- 현재: `signals_assets.py`의 `trading_signals`는 NASDAQ `technical_indicators`만 upstream
- 필요: KRX 종목 신호 생성 (`krx_indicators_assets` → KRX trading_signals)
- 현재 `krx_indicators_assets`는 별도 asset으로 분리되어 있으나 signals와 연결 없음

### 6. `platform.duckdb` vs `stock.duckdb` 역할 정리
- `stock.duckdb`: DuckDB UI용 — MinIO VIEW만 존재 (분석 인터페이스)
- `platform.duckdb`: backend/kafka 용 — 포트폴리오, 거래신호, 백테스트 결과 저장
- 문제: `signals_assets.py`가 `platform.duckdb`에 신호를 저장하나, 이 DB는 DuckDB UI에서 안 보임
- 정리 필요: DuckDB UI의 `stock.duckdb`에 `platform.duckdb` ATTACH하거나 신호를 MinIO에 저장하는 방식 결정

---

## 🟢 장기 처리

### 7. Kafka 실시간 파이프라인 검증
- `kafka-producer` → `kafka-minio-consumer` → MinIO 저장 흐름이 실제 작동하는지 E2E 테스트 미완
- `kafka-duckdb-consumer`가 `platform.duckdb`에 저장 — DuckDB 파일 잠금(lock) 이슈 가능성
- `kafka-redis-consumer` 실시간 캐시 — frontend 연동 미확인

### 8. Phase 2 서버 이관
- 현재 Desktop Docker → 서버 이관 예정 (`ARCHITECTURE.md` Phase 2 참고)
- 이관 시 `.env`의 `MINIO_ENDPOINT`만 변경하면 MinIO 연결 유지됨
- 체크리스트: `docker compose up -d` → Dagster 스케줄 재활성화 확인

### 9. Backfill 완료 현황 추적
- `backfill_assets.py`로 과거 이력 적재 가능하나 어디까지 완료됐는지 추적 방법 없음
- MinIO audit parquet (`stockdata/audit/...`)에 기록되나 UI 없음
- DuckDB VIEW로 audit 현황 조회 뷰 추가 검토

---

## ✅ 완료

- [x] MinIO 엔드포인트 변경 (`192.168.219.111` → `192.168.219.107`)
  - `.env`, `stock_query_app.py`, `duckdb_ui/setup.sql` 수정 완료 (2026-06-10)
- [x] Bronze layer 수집 파이프라인 (KRX + NASDAQ daily + backfill)
- [x] DuckDB UI VIEW 구성 (`ohlcv_bronze`, `ohlcv_bronze_krx`, `ohlcv_bronze_nasdaq`)
- [x] Dagster 스케줄 (KRX 07:00 UTC / NASDAQ 22:00 UTC)
