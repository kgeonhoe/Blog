---
categories:
  - "[[Evergreen]]"
created: 2026-03-06
topics:
  - "[[Quartz]]"
tags:
  - evergreen
  - quartz
draft: false
---

## Front Matter (Properties) 필수 규칙

모든 노트의 맨 위에 `---`로 감싼 YAML front matter를 작성한다.

### 필수 프로퍼티

| 프로퍼티 | 역할 | 예시 |
|---|---|---|
| `categories` | 분류 (위키링크 형태) | `- "[[TIL]]"` |
| `created` | 생성일 | `2026-03-06` |
| `tags` | 태그 (복수형, 소문자) | `- til` |
| `draft` | 공개 여부 | `true` / `false` |

### 선택 프로퍼티

| 프로퍼티 | 사용 템플릿 | 설명 |
|---|---|---|
| `topics` | 전체 | 관련 주제 위키링크 `- "[[Docker]]"` |
| `status` | Project | 진행 상태 (`planning`, `in-progress`, `completed`) |
| `stack` | Project | 기술 스택 위키링크 목록 |
| `repo` | Project | GitHub 레포 URL |
| `published` | Post | 발행일 |
| `platform` | Course | 강의 플랫폼 |
| `environment` | Troubleshooting | 에러 발생 환경 |
| `url`, `docs` | Tool | 공식 사이트, 문서 링크 |

### draft 규칙

```yaml
draft: true   # Quartz 빌드에서 제외 (비공개)
draft: false  # 블로그에 공개
```

- 처음 작성 시 **Post만 `draft: true`** 로 시작 (완성 후 false로 변경)
- 나머지 공개 카테고리(TIL, Project 등)는 **`draft: false`** 로 시작해도 됨
- **항상 비공개**인 카테고리: Daily(`draft: true`), Career, Stocks, Trips, Meetings

---

## 작성 시 지켜야 할 것

### 1. 위키링크 적극 사용

```markdown
# 좋은 예
[[Docker]]에서 [[Kafka]] 컨테이너를 실행하고 [[Spark]]로 처리한다.

# 나쁜 예
Docker에서 Kafka 컨테이너를 실행하고 Spark로 처리한다.
```

- 존재하지 않는 노트에도 링크를 걸어둔다 (나중에 만들면 자동 연결)
- Quartz의 **백링크**와 **그래프 뷰**가 이 링크를 기반으로 생성됨

### 2. 파일명 = 고유해야 함

- Quartz는 파일명 기준으로 위키링크를 해석
- 동일 파일명이 다른 폴더에 있으면 충돌 발생

### 3. 이미지 첨부

```markdown
# Obsidian 위키링크 방식 (권장)
![[architecture-diagram.png]]

# 마크다운 방식
![설명](Attachments/architecture-diagram.png)
```

- 이미지는 `Attachments/` 폴더에 저장 (Obsidian 설정 완료됨)

### 4. 템플릿 흐름

```
Ctrl+N (새 노트) → 제목 입력 → Ctrl+T (템플릿 삽입) → 프로퍼티 채우기 → 본문 작성
```

- **새 노트는 반드시 템플릿부터 삽입**
- 템플릿이 front matter를 자동으로 심어줌 → 직접 타이핑할 필요 없음

---

## Quartz 호환 마크다운 문법

### 호환되는 것

| 문법 | 예시 |
|---|---|
| 체크박스 | `- [ ] 할 일` / `- [x] 완료` |
| Callout | `> [!note]`, `> [!warning]`, `> [!tip]` |
| 코드 블록 | ` ```python ` |
| 수식 (LaTeX) | `$E=mc^2$`, `$$\sum_{i=1}^n$$` |
| Mermaid | ` ```mermaid ` |
| 표 (Table) | `\| 헤더 \| 헤더 \|` |
| 각주 | `[^1]` |
| 위키링크 | `[[노트명]]`, `[[노트명\|표시텍스트]]` |
| 임베드 | `![[다른노트]]`, `![[이미지.png]]` |

### 호환 안 되는 것

| 문법/플러그인 | 이유 |
|---|---|
| Dataview 쿼리 | Obsidian 런타임 전용 |
| Tasks 플러그인 쿼리 | Obsidian 런타임 전용 |
| Kanban 보드 뷰 | Obsidian 전용 렌더링 |
| Excalidraw | Obsidian 전용 포맷 |

> [!tip] 핵심 원칙
> **마크다운 파일에 직접 써지는 것은 호환되고, Obsidian이 실시간으로 해석하는 것은 안 된다.**

---

## 공개 전 체크리스트

- [ ] front matter `draft` 값 확인 (`false` = 공개)
- [ ] `categories`에 위키링크 형태로 카테고리 지정됨
- [ ] `tags` 소문자 복수형으로 작성됨
- [ ] 내부 위키링크 `[[]]` 충분히 걸었는지 확인
- [ ] 이미지가 `Attachments/`에 있는지 확인
- [ ] 오탈자, 미완성 섹션 정리
