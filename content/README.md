# My Vault

kepano 방법론 기반 개인 Obsidian vault + Quartz 기술 블로그.

## 구조

```
📁 Root/           ← 내가 쓴 글 (프로젝트, TIL, 에버그린...)
📁 Attachments/    ← 이미지, PDF 등 첨부파일
📁 Categories/     ← 카테고리 개요
📁 Clippings/      ← 외부 아티클 스크랩
📁 Daily/          ← 일일 노트 (YYYY-MM-DD.md)
📁 References/     ← 외부 레퍼런스 (도구, 사람, 장소...)
📁 Templates/      ← 템플릿
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
2. `Ctrl+T` (또는 `Ctrl+P` → "Templates: Insert template") → 템플릿 선택
3. front matter 프로퍼티 채우기
4. 본문 작성, 내부 링크 `[[]]` 적극 활용

### 노트 유형별 사용법

| 상황 | 템플릿 | 위치 | 예시 |
|---|---|---|---|
| 도구/기술 개요 정리 | Tool Template | `References/` | `References/Airflow.md` |
| 오늘 배운 것 기록 | TIL Template | 루트 | `WSL에서 Docker 설치하기.md` |
| 에러 해결 기록 | Troubleshooting Template | 루트 | `Kafka Consumer Lag 해결.md` |
| 프로젝트 문서 | Project Template | 루트 | `Nasdaq Data Pipeline.md` |
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

## 배포

```bash
npx quartz build --serve  # 로컬 미리보기
npx quartz sync            # GitHub push → 자동 배포
```
