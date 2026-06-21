# My Vault

kepano 방법론 + Andrej Karpathy LLM-Wiki 통합 Obsidian vault + Quartz 기술 블로그.

## 📊 현재 상태 (2026-05-15)

- **Wiki 페이지**: 5개 (entities: 4, comparisons: 1, topics: 0, queries: 0)
- **교차 참조**: 40+ 링크 (Studies ↔ Wiki ↔ Projects)
- **템플릿**: 8개 (기존 4 + Wiki 4)
- **워크플로 테스트**: ✅ Ingest, Query, Lint 검증 완료

## 아키텍처

### Kepano 방법론 (기존)
- 폴더가 아닌 **properties(categories)** 로 분류
- 템플릿 중심 노트 작성
- Quartz 블로그 연동 (`draft` 플래그로 공개/비공개)

### Karpathy LLM-Wiki (추가)
- **사용자**: Studies/, Projects/, Activities/에 자유롭게 작성
- **LLM**: Wiki/에 구조화된 지식 자동 생성/업데이트
- **워크플로**: Ingest (통합), Query (질의), Lint (점검)
- **목표**: 북키핑 비용 거의 0 달성

## 구조

```
📁 Studies/       ← 내가 작성하는 학습 노트 (자유로운 형식) [LLM 소스]
📁 Projects/      ← 내가 작성하는 프로젝트 문서 [LLM 소스]
📁 Activities/    ← 내가 작성하는 활동 기록 [LLM 소스]
📁 Daily/         ← 일일 노트 (YYYY-MM-DD.md) [LLM 소스]

📁 Wiki/          ← LLM이 관리하는 구조화된 지식 베이스
   ├─ entities/   ← 기술, 도구, 개념 페이지 (예: Kafka.md)
   ├─ topics/     ← 주제별 요약 (예: Stream-Processing.md)
   ├─ comparisons/← 비교 분석 (예: Kafka-vs-Redpanda.md)
   ├─ syntheses/  ← 합성 인사이트
   └─ queries/    ← 저장된 질의 응답

📁 Sources/       ← 외부 자료 보관 (논문, 아티클) [LLM 보조 소스]
   ├─ papers/
   ├─ articles/
   ├─ books/
   └─ podcasts/

📁 .copilot/      ← LLM 관리 파일 (vault 콘텐츠와 분리)
   ├─ instructions.md  ← LLM 에이전트 스키마
   ├─ wiki-index.md    ← Wiki 페이지 카탈로그
   └─ wiki-log.md      ← 작업 로그

📁 Attachments/   ← 이미지, PDF 등 첨부파일
📁 Categories/    ← 카테고리 개요
📁 Templates/     ← 템플릿

📄 index.md       ← 블로그 홈페이지 (Quartz)
📄 README.md      ← 이 파일
```

## 규칙

- 폴더가 아닌 **properties(categories)** 로 분류
- 카테고리, 태그는 항상 **복수형**
- 날짜는 `YYYY-MM-DD` 형식
- 내부 링크를 적극 활용 `[[]]`
- `draft: true` → Quartz 빌드에서 제외 (비공개)
- `draft: false` → 블로그에 공개

## 공개/비공개 구분

| 공개 (기술 블로그) | 비공개 |
|---|---|
| Data Engineering, Data Pipelines, Data Analysis | Career |
| Tools, Python, SQL, DevOps, Cloud | Stocks |
| Projects, TIL, Troubleshooting | Trips |
| Courses, Posts, Evergreen | Daily, Meetings |

## Obsidian 설정

| 설정 경로                                          | 값                                 |
| ---------------------------------------------- | --------------------------------- |
| Files & Links → Default location for new notes | **Vault folder (root)**           |
| Files & Links → Attachment folder path         | **Attachments**                   |
| Templates → Template folder location           | **Templates**                     |
| Daily notes → Date format                      | **YYYY-MM-DD**                    |
| Daily notes → New file location                | **Daily**                         |
| Daily notes → Template file location           | **Templates/Daily Note Template** |

## 노트 작성법

### 새 노트 작성

1. `Ctrl+N` → 제목 입력
2. `Ctrl+R` (또는 `Ctrl+P` → "Templates: Insert template") → 템플릿 선택
3. front matter 프로퍼티 채우기
4. 본문 작성, 내부 링크 `[[]]` 적극 활용

### 노트 유형별 사용법

| 상황 | 템플릿 | 위치 | 예시 |
|---|---|---|---|
| 도구/기술 개요 정리 | Tool Template | `References/` | `References/Airflow.md` |
| 오늘 배운 것 기록 | TIL Template | 루트 | `WSL에서 Docker 설치하기.md` |
| 에러 해결 기록 | Troubleshooting Template | 루트 | `Kafka Consumer Lag 해결.md` |
| 프로젝트 문서 | Project Template | `Projects/프로젝트명/` | `Projects/Nasdaq-Stock-Pipeline/index.md` |
| 강의/코스 정리 | Course Template | 루트 | `Udemy Docker 가이드.md` |
| 블로그 글 작성 | Post Template | 루트 | `dbt와 Dagster 연동 가이드.md` |
| 영구 보존 인사이트 | Evergreen Template | 루트 | `데이터 품질이 중요한 이유.md` |
| 외부 아티클 스크랩 | Clipping Template | `Clippings/` | `Clippings/File over app.md` |
| 사람 정보 | Person Template | `References/` | `References/Kevin Kelly.md` |
| 책 정리 | Book Template | `References/` | `References/Designing Data Intensive Apps.md` |
| 이력서/면접 (비공개) | Career Template | 루트 | `데이터 엔지니어 이력서.md` |
| 주식 메모 (비공개) | Stock Template | 루트 | `눌림목 매매 전략.md` |
| 여행 계획 (비공개) | Trip Template | 루트 | `포르투갈 신혼여행.md` |
| 회의록 (비공개) | Meeting Template | 루트 | `2026-03-06 팀 미팅.md` |

### 블로그 글 공개 흐름

```
Post Template 삽입 → draft: true 로 작성 → 완성되면 draft: false 로 변경 → 블로그에 공개
```

### 기존 노트 마이그레이션

기존 vault(`E:\OneDrive\Obsidian`)는 그대로 두고, 참고하면서 새 노트를 작성한다.

1. 기존 vault에서 노트 하나 열기 (참고용)
2. 새 vault에서 `Ctrl+N` → 제목 → `Ctrl+T` → 템플릿 선택
3. 유의미한 내용만 복사/재작성, 내부 링크 연결
4. 매일 15~30분, 2~3개씩 점진적으로 정리

### Base (데이터베이스 뷰) 생성

노트들을 테이블 형태로 관리하는 대시보드. Quartz에는 영향 없음 (Obsidian 전용).

1. 왼쪽 파일 탐색기에서 `Templates/` 폴더 **우클릭** → `New base`
2. 이름 입력 (예: `Projects Dashboard`)
3. Filter → 조건 추가 (예: `categories` contains `Projects`)
4. 컬럼 추가 → front matter 프로퍼티 선택 (`status`, `created`, `draft` 등)

| Base 예시 | 필터 | 용도 |
|---|---|---|
| 공개 글 관리 | `draft = false` | 블로그에 공개된 글 목록 |
| 작성 중 | `draft = true` | 아직 비공개인 글 목록 |
| 프로젝트 현황 | `categories contains Projects` | 프로젝트 상태 관리 |

### 핵심 습관

- **새 노트 = 항상 템플릿부터** (`Ctrl+P` → `Templates: Insert template`)
- **폴더에 넣지 않는다** → 루트에 두고 `categories` 프로퍼티로 분류
- **링크를 많이 건다** → `[[Docker]]`, `[[Airflow]]` 등 존재하지 않는 노트에도 링크 (나중에 만들면 자동 연결)
- **빈 노트도 괜찮다** → 나중에 채울 수 있다. 링크가 있으면 찾을 수 있다.

---

## LLM-Wiki 워크플로

### 1. 자유롭게 학습하기

Studies/에 노트 작성, Projects/에 프로젝트 문서 작성, Activities/에 활동 기록.

**형식에 구애받지 말고 자유롭게 작성하세요!**

### 2. LLM에게 정리 요청

학습 노트 작성 후 LLM에게 ingest 요청:

```
"Studies/Kafka.md ingest"
```

### 3. LLM이 자동 정리

LLM이:
- `Wiki/entities/Kafka.md` 생성 (구조화된 지식)
- 관련 프로젝트 자동 링크 (`[[Projects/Nasdaq-Stock-Pipeline/]]`)
- 교차 참조 자동 연결
- `index.md`, `log.md` 업데이트

### 4. 질문하기

궁금한 점이 있으면 LLM에게 질문:

```
"Kafka와 Redpanda 차이는?"
"Airflow 사용한 프로젝트는?"
```

LLM이 Wiki/ 기반으로 답변하고, 좋은 답변은 `Wiki/queries/`에 저장.

### 5. 주기적 점검

주 1회 LLM에게 lint 요청:

```
"lint wiki"
```

LLM이 고아 페이지, 모순, 누락된 링크 자동 탐지 및 수정.

### 주요 명령어

| 명령 | 예시 | 설명 |
|------|------|------|
| **ingest** | `"Studies/Kafka.md ingest"` | 노트를 Wiki로 통합 |
| **query** | `"Kafka 란?"` | Wiki 기반 질문 |
| **lint** | `"lint wiki"` | 전체 일관성 점검 |

### 워크플로 테스트 결과 (2026-05-14)

✅ **Ingest**: `Studies/Spark.md` → `Wiki/entities/Spark.md` (3.3KB) - Lambda Architecture, Kafka Consumer 구조화  
✅ **Query**: "Kafka vs RedPanda 차이?" → `Wiki/comparisons/Kafka-vs-Redpanda.md` (4KB) - 아키텍처 비교, 사용 사례  
✅ **Lint**: Wiki 전체 스캔 → `.copilot/lint-report-2026-05-14.md` (4.3KB) - 깨진 링크 1개, 고아 페이지 0개

### 참고 파일

- **`.copilot/instructions.md`** - LLM 에이전트 스키마 (상세 워크플로, 규칙)
- **`.copilot/wiki-index.md`** - Wiki 페이지 카탈로그 (LLM 탐색용, 사용자 확인용)
- **`.copilot/wiki-log.md`** - 작업 로그 (ingest, query, lint 기록)
- **`index.md`** - 블로그 홈페이지 (변경 없음)

---

## 배포

```bash
npx quartz build --serve  # 로컬 미리보기
npx quartz sync            # GitHub push → 자동 배포
```
https://quartz.jzhao.xyz/features/backlinks
