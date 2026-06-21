# Wiki Index

> LLM이 효율적으로 탐색하고, 사용자가 전체 Wiki를 한눈에 파악할 수 있도록 모든 Wiki 페이지를 카탈로그화합니다.

## 통계
- **Wiki pages**: 6 (entities: 4, topics: 1, comparisons: 1, queries: 0)
- **User notes**: ~88 (Studies: 10, Projects: 16, Activities: 8, Daily: 4, Notes: 50)
- **Sources**: 1 (articles: 1)
- **Last updated**: 2026-06-21 15:30

---

## 🤖 Wiki (LLM이 관리하는 구조화된 지식)

> 사용자 노트(Studies/, Projects/, Activities/)와 외부 자료(Sources/)를 기반으로 LLM이 자동 생성/업데이트하는 지식 베이스

### Wiki Entities (기술, 도구, 개념)

#### Data Engineering
- [[Wiki/entities/Kafka]] | 분산 스트리밍 플랫폼 | Updated: 2026-05-14 | Sources: [[Studies/Kafka]], [[Projects/Nasdaq-Stock-Pipeline/]]
- [[Wiki/entities/Spark]] | 대규모 데이터 처리 엔진 | Updated: 2026-05-14 | Sources: [[Studies/Spark]], [[Projects/Nasdaq-Stock-Pipeline/2. Kafka Consumer]], [[Activities/DataTalksClub/week6]]
- [[Wiki/entities/Airflow]] | 워크플로 오케스트레이션 | Updated: 2026-05-14 | Sources: [[Studies/Airflow]], [[Projects/Nasdaq-Stock-Pipeline/]]

#### DevOps
- [[Wiki/entities/Docker]] | 컨테이너 플랫폼 | Updated: 2026-05-14 | Sources: [[Studies/Docker]]

**예정:**
- dbt - 데이터 변환 도구
- Dagster - 데이터 오케스트레이션
- RedPanda - Kafka 호환 스트리밍

### Wiki Topics (주제별 요약)

- [[Wiki/topics/LLM-Wiki-Stack]] | LLM Wiki Stack — 살아있는 AI 지식 기반 구축 | Updated: 2026-06-21 | Sources: [[Sources/articles/Obsidian-Claude-Code-Markdown-Git-LLM-Wiki-Stack]]

**예정:**
- Stream Processing - 스트림 처리 개요
- Batch Processing - 배치 처리 패턴
- Analytics Engineering - 분석 엔지니어링
- Data Warehousing - 데이터 웨어하우스

### Wiki Comparisons (비교 분석)

- [[Wiki/comparisons/Kafka-vs-Redpanda]] | Kafka vs Redpanda 아키텍처/성능 비교 | Updated: 2026-05-14 | Sources: [[Wiki/entities/Kafka]], [[Studies/RedPanda]], [[Activities/DataTalksClub/week7]]

**예정:**
- Airflow vs Dagster
- dbt vs 기타 변환 도구

### Wiki Queries (저장된 질의 응답)

*아직 저장된 쿼리가 없습니다. LLM에게 질문하고 좋은 답변을 저장하세요.*

---

## 📚 User Notes 참조

> 자유롭게 작성된 학습 노트, 프로젝트 문서, 활동 기록 (LLM 소스로 활용)

### Projects

#### Nasdaq Data Pipeline
- `Projects/Nasdaq-Stock-Pipeline/index.md`
- `Projects/Nasdaq-Stock-Pipeline/1. Kafka Producer.md`
- `Projects/Nasdaq-Stock-Pipeline/2. Kafka Consumer (Spark Structured Streaming).md`
- `Projects/Nasdaq-Stock-Pipeline/3. Airflow (배치처리).md`
- 기타 15개 파일

#### dbt-mini-mart
- `Projects/dbt-mini-mart/index.md`
- `Projects/dbt-mini-mart/dagster_dbt_운영_가이드.md`

### Activities

#### DataTalksClub - Data Engineering Zoomcamp
- `Activities/DataTalksClub-data-engineering/week3-1(DataWareHouse - OLTP VS OLAP).md`
- `Activities/DataTalksClub-data-engineering/week4(Analytics Engineering).md`
- `Activities/DataTalksClub-data-engineering/week6(Batch Pipeline - spark).md`
- `Activities/DataTalksClub-data-engineering/week7(Stream).md`
- 기타 4개 파일

### Studies

- `Studies/Kafka.md`
- `Studies/Docker.md`
- `Studies/Spark.md`
- `Studies/Airflow.md`
- `Studies/dbt.md`
- `Studies/Dagster.md`
- `Studies/RedPanda.md`
- `Studies/Docker Compose로 Kafka 로컬 클러스터 띄우기.md`
- 기타 2개 파일

---

## 📦 Sources (외부 자료)

> 논문, 아티클, 블로그, 책 등 외부 소스 (보조 자료)

### Papers

*아직 추가된 논문이 없습니다.*

### Articles

- [[Sources/articles/Obsidian-Claude-Code-Markdown-Git-LLM-Wiki-Stack]] | Allen (wikidocs.net) — Obsidian+Claude Code+Markdown+Git LLM Wiki 스택 | 2026-06-21

**TODO**: Clippings/ 폴더 내용을 Sources/articles/로 마이그레이션

### Books

*아직 추가된 책이 없습니다.*

### Podcasts

*아직 추가된 팟캐스트가 없습니다.*

---

## 🚀 시작하기

### LLM에게 요청하기

**Ingest (지식 통합):**
```
"Studies/Kafka.md ingest"
"Projects/Nasdaq-Stock-Pipeline/index.md ingest"
```

**Query (질문):**
```
"Kafka와 Redpanda 차이는?"
"Airflow 사용한 프로젝트는?"
```

**Lint (점검):**
```
"lint wiki"
```

### 워크플로

1. **자유롭게 학습**: Studies/에 노트 작성
2. **정리 요청**: LLM에게 ingest 요청
3. **자동 정리**: LLM이 Wiki/ 생성/업데이트, 교차 참조 자동 연결
4. **지식 활용**: 필요할 때 LLM에게 질문

---

## 📖 참고

- `.copilot/instructions.md` - LLM 에이전트 스키마 (상세 워크플로, 규칙)
- `.copilot/wiki-log.md` - 작업 로그 (ingest, query, lint 기록)
- `README.md` - Vault 사용 가이드
