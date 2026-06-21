---
title: Wiki Activity Log
draft: false
updated: 2026-05-14
---

# Wiki Activity Log

LLM이 수행한 모든 작업을 시간순으로 기록합니다.

---

## [2026-06-21 16:22] docs | stock-platform ASCII 다이어그램 Mermaid 변환

**Target:** `Projects/stock-platform/`

**Actions:**
- Updated: `Projects/stock-platform/architecture.md` (ASCII 4개 → Mermaid)
- Updated: `Projects/stock-platform/dagster_automation.md` (ASCII 3개 → Mermaid)
- Updated: `Projects/stock-platform/duckdb-architecture.md` (ASCII 3개 → Mermaid)
- Updated: `Projects/stock-platform/indicator-plugin-architecture.md` (ASCII 1개 → Mermaid)
- Updated: `Projects/stock-platform/silver-symbol-query-performance.md` (ASCII 2개 → Mermaid)
- Updated: `Projects/stock-platform/technical-indicators-migration.md` (ASCII 1개 → Mermaid)
- Updated: `Projects/stock-platform/trading-signals-explained.md` (ASCII 1개 → Mermaid)
- Updated: `Projects/stock-platform/troubleshooting.md` (ASCII 1개 → Mermaid)
- Reviewed only: directory tree / code example / 단순 화살표 텍스트는 규칙에 따라 유지

**Summary:** stock-platform 프로젝트 문서의 ASCII 아키텍처/플로우 다이어그램 16개를 Mermaid 코드블록으로 변환. frontmatter는 변경하지 않았고, 파일/폴더 트리와 코드 예시는 그대로 유지.

---

## [2026-06-21 15:30] ingest | Sources/articles/Obsidian-Claude-Code-Markdown-Git-LLM-Wiki-Stack

**Source:** `Sources/articles/Obsidian-Claude-Code-Markdown-Git-LLM-Wiki-Stack.md`
(원본: https://wikidocs.net/blog/@Allen/14001/ — Allen, 2026-05-22)

**Actions:**
- Created: `Sources/articles/Obsidian-Claude-Code-Markdown-Git-LLM-Wiki-Stack.md`
- Created: `Wiki/topics/LLM-Wiki-Stack.md`
- Updated: `.copilot/wiki-index.md` (통계: 5 → 6 pages, topics: 0 → 1, sources: 0 → 1)
- Created: `CLAUDE.md` (vault 루트 — Claude Code 자동 감지용)
- Created: `vault-commit.bat` (Quartz 배포와 분리된 vault git 이력 도구)

**Links added:** 8개 교차 참조
- Sources/articles/Obsidian-Claude-Code-Markdown-Git-LLM-Wiki-Stack ↔ Wiki/topics/LLM-Wiki-Stack
- Wiki/topics/LLM-Wiki-Stack ↔ Wiki/entities/Kafka
- Wiki/topics/LLM-Wiki-Stack ↔ Wiki/entities/Docker
- Wiki/topics/LLM-Wiki-Stack ↔ CLAUDE.md
- Wiki/topics/LLM-Wiki-Stack ↔ .copilot/instructions.md

**Summary:** wikidocs.net Allen 아티클(Obsidian+Claude Code+Markdown+Git LLM Wiki 스택)을 Source로 저장하고 Wiki/topics/LLM-Wiki-Stack.md로 컴파일. 현재 vault 구조와 벤치마킹 비교 내용 포함. 아티클 권장 사항 중 CLAUDE.md 루트 배치와 vault-commit.bat를 동시 적용 완료.

---



**Phase 완료 현황**:
- ✅ Phase 1: 기본 구조 설정 (2026-05-14)
- ✅ Phase 2: 샘플 Wiki 페이지 생성 (2026-05-14)
- ✅ Phase 3: 템플릿 확장 (2026-05-15)
- ✅ Phase 4: 워크플로 테스트 (2026-05-14)
- ⏭️ Phase 5: 도구 및 자동화 (선택사항)
- 🔄 Phase 6: 운영 및 개선 (진행중)

**최종 통계**:
- **Wiki 페이지**: 5개 (entities: 4, comparisons: 1)
- **템플릿**: 4개 신규 생성 (Entity, Topic, Comparison, Source)
- **교차 참조**: 40+ 링크
- **테스트**: Ingest, Query, Lint 워크플로 검증 완료
- **문서 업데이트**: README.md, plan.md

**생성된 파일 요약**:
- `.copilot/instructions.md` (13.5KB) - LLM 에이전트 스키마
- `.copilot/wiki-index.md` (3.1KB) - Wiki 카탈로그
- `.copilot/wiki-log.md` - 작업 로그 (6개 엔트리)
- `Wiki/entities/` (4개): Kafka, Docker, Airflow, Spark
- `Wiki/comparisons/` (1개): Kafka-vs-Redpanda
- `Templates/` (4개): Wiki-Entity, Wiki-Topic, Wiki-Comparison, Source

**핵심 성과**:
1. ✅ 사용자 노트(Studies/, Projects/) → Wiki 자동 구조화 워크플로 검증
2. ✅ 교차 참조 자동 연결 (Studies ↔ Wiki ↔ Projects)
3. ✅ 소스 인용 규칙 확립 (모든 Wiki 내용이 원본 추적 가능)
4. ✅ .copilot/ 패턴으로 LLM 관리 파일과 vault 콘텐츠 완전 분리
5. ✅ Lint 워크플로로 Wiki 품질 자동 검증

**다음 단계 (사용자 운영)**:
- 실제 학습 시 Studies/에 자유롭게 작성 → ingest 요청
- 프로젝트 진행 시 Projects/에 문서 작성 → ingest 요청
- 궁금한 점 발생 시 query 요청
- 주 1회 lint로 Wiki 품질 유지
- 외부 자료(논문, 블로그) 발견 시 Sources/에 추가 (보조)

**Summary:** Kepano + Karpathy LLM-Wiki 통합 완료. 북키핑 비용 거의 0 달성 가능한 구조 확립. 사용자는 자유롭게 학습하고, LLM이 지식 구조화 및 연결 관리.

---

## [2026-05-15 00:07] setup | Wiki 템플릿 생성

**Actions:**
- Created: `Templates/Wiki-Entity-Template.md` (1.2KB)
- Created: `Templates/Wiki-Topic-Template.md` (1.9KB)
- Created: `Templates/Wiki-Comparison-Template.md` (2.9KB)
- Created: `Templates/Source-Template.md` (1.3KB)
- Updated: `Templates/Clipping Template.md` → Source 템플릿으로 변경 (source_type, ingested_date 필드 추가)

**Summary:** **Phase 3 완료**. Wiki 페이지 생성용 템플릿 4개 생성. 각 템플릿은 front matter 규칙, 소스 인용, 교차 참조 패턴 포함. Clipping Template은 Source Template 역할로 확장하여 LLM ingest 워크플로와 통합.

---

## [2026-05-14 23:53] lint | Wiki 전체 검사

**Actions:**
- Scanned: 5 Wiki pages (entities: 4, comparisons: 1)
- Generated: `.copilot/lint-report-2026-05-14.md` (4.3KB)

**Issues found:**
1. **깨진 링크 (1개)**: `Wiki/topics/Stream-Processing` 페이지 없음 (Kafka.md:55에서 참조)
2. **비어있는 소스 (1개)**: `Studies/RedPanda.md` 템플릿 상태 (내용 없음, Wiki에서 인용)
3. **고아 페이지**: 없음 ✅
4. **소스 인용 누락**: 없음 ✅

**Recommendations:**
- Priority 1: `Wiki/topics/Stream-Processing.md` 생성 또는 링크 제거
- Priority 2: 사용자가 `Studies/RedPanda.md` 작성 (사용자 작업)
- Priority 3: Activities/week7 기반 `Wiki/entities/Redpanda.md` 생성 (선택)

**Summary:** **Test-Lint 워크플로 테스트 성공**. Wiki 전체 품질 검사 완료. 교차 참조 일관성 정상, 소스 인용 정상. 2개 개선 항목 발견 (깨진 링크 1개, 비어있는 소스 1개).

---

## [2026-05-14 23:52] query | Kafka vs Redpanda 비교 분석

**Query:** "Kafka와 Redpanda의 차이는?"

**Sources consulted:**
- `Wiki/entities/Kafka.md`
- `Studies/Kafka.md`
- `Studies/RedPanda.md`
- `Activities/DataTalksClub-data-engineering/week7(Stream).md`
- `Projects/Nasdaq-Stock-Pipeline/` (context)

**Actions:**
- Created: `Wiki/comparisons/Kafka-vs-Redpanda.md` (4KB)
- Updated: `.copilot/wiki-index.md` (통계: 4 → 5 pages, comparisons: 0 → 1)
- Cross-references: Wiki/entities/Kafka ↔ Wiki/comparisons/Kafka-vs-Redpanda, Activities/week7 ↔ comparisons

**Summary:** **Test-Query 워크플로 테스트 성공**. 사용자 질문 기반 비교 분석 페이지 생성. Kafka vs Redpanda 아키텍처, API 호환성, 성능, 사용 사례별 선택 기준 정리 완료. Nasdaq 프로젝트(Kafka), DataTalksClub Week7(Redpanda) 실제 사용 패턴 연결.

---

## [2026-05-14 23:51] ingest | Spark 엔티티 생성

**Sources:**
- `Studies/Spark.md`
- `Projects/Nasdaq-Stock-Pipeline/2. Kafka Consumer (Spark Structured Streaming).md`
- `Activities/DataTalksClub-data-engineering/week6(Batch Pipeline - spark).md`

**Actions:**
- Created: `Wiki/entities/Spark.md` (3.3KB)
- Updated: `.copilot/wiki-index.md` (통계: 3 → 4 pages)
- Cross-references: Studies/Spark ↔ Wiki/entities/Spark, Projects/Nasdaq ↔ Wiki/entities/Spark
- Related entities: Kafka, Airflow 간 연결 강화

**Summary:** **Test-Ingest 워크플로 테스트 성공**. Studies/Spark.md를 소스로 Wiki/entities/Spark.md 생성. Lambda Architecture, Kafka Consumer, 기술적 지표 계산 내용 구조화 완료. Nasdaq 프로젝트 활용 사례 및 DataTalksClub 학습 자료 연결.

---

## [2026-05-14 23:30] setup | 샘플 Wiki 페이지 생성

**Sources:**
- `Studies/Kafka.md`
- `Studies/Docker.md`
- `Studies/Airflow.md`
- `Studies/Docker Compose로 Kafka 로컬 클러스터 띄우기.md`
- `Projects/Nasdaq-Stock-Pipeline/` (1, 2, 3)

**Actions:**
- Created: `Wiki/entities/Kafka.md`
- Created: `Wiki/entities/Docker.md`
- Created: `Wiki/entities/Airflow.md`
- Updated: `.copilot/wiki-index.md` (통계: 0 → 3 pages)

**Links added:** 30+ 교차 참조
- Studies/ ↔ Wiki/entities/
- Projects/Nasdaq-Stock-Pipeline/ ↔ Wiki/entities/
- Wiki/entities/ ↔ Wiki/entities/

**Summary:** 기존 Studies/ 노트 기반 샘플 Wiki 페이지 3개 생성. Kafka, Docker, Airflow 구조화 완료. 프로젝트 및 학습 노트 간 교차 참조 자동 연결.

---

## [2026-05-14 23:19] setup | .copilot/ 디렉토리 재구성

**Actions:**
- Created: `.copilot/` 디렉토리
- Moved: `AGENTS.md` → `.copilot/instructions.md`
- Moved: `log.md` → `.copilot/wiki-log.md`
- Created: `.copilot/wiki-index.md`
- Restored: `index.md` (블로그 홈페이지)
- Updated: `README.md` (새 구조 반영)

**Summary:** LLM 관리 파일을 vault 콘텐츠와 완전 분리. GitHub Copilot 표준 패턴 참고.

---

## [2026-05-14 23:03] setup | Wiki 구조 초기화

**Actions:**
- Created: `Wiki/` 폴더 구조 (entities, topics, comparisons, syntheses, queries)
- Created: `Sources/` 폴더 구조 (papers, articles, books, podcasts)
- Created: `AGENTS.md` (LLM 에이전트 스키마)
- Created: `log.md` (이 파일)

**Summary:** Kepano + Karpathy LLM-Wiki 아키텍처 기본 구조 완성. 사용자 노트(Studies/, Projects/)를 소스로 활용하는 워크플로 준비 완료.

---

*앞으로 ingest, query, lint 작업이 여기에 기록됩니다.*
