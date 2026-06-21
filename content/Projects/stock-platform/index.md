---
title: "stock-platform — 주식 데이터 수집·분석 플랫폼"
categories:
  - "[[Projects]]"
tags:
  - stock-platform
  - data-engineering
  - dagster
  - duckdb
  - minio
draft: false
created: "2026-06-21"
updated: "2026-06-21"
---

Dagster 기반으로 KRX·NASDAQ 주식 데이터를 수집하고, MinIO에 저장한 뒤 DuckDB로 분석하는 데이터 엔지니어링 플랫폼입니다. 자동화 스케줄, 저장소 구성, 기술 지표, 트러블슈팅 문서를 함께 정리했습니다.

## 문서 목록

- [[architecture|시스템 아키텍처]]
- [[dagster_automation|Dagster Automation 가이드]]
- [[minio_setup|MinIO 구성 문서]]
- [[symbol_collection_strategy|심볼 수집 전략]]
- [[backfill-vs-daily-partition|Backfill vs Daily Partition 설계 결정]]
- [[dagster-storage-explained|Dagster Storage 설명]]
- [[data-collection-schedule|데이터 수집 스케줄 설계]]
- [[duckdb-architecture|DuckDB 아키텍처 결정 기록]]
- [[fdr-installation-guide|FinanceDataReader 설치 가이드]]
- [[indicator-plugin-architecture|지표/패턴 Plugin Registry 아키텍처]]
- [[silver-symbol-query-performance|Silver Layer 조회 성능 개선]]
- [[technical-indicators-migration|기술적 지표 마이그레이션]]
- [[trading-signals-explained|Trading Signals 상세 설명]]
- [[troubleshooting|Troubleshooting]]

## 내부 문서

- [[agents|stock-platform 문서 가이드]] _(draft)_
- [[todo|stock-platform TODO]] _(draft)_