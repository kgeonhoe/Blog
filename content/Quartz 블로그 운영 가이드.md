---
categories:
  - "[[Evergreen]]"
tags:
  - evergreen
  - quartz
draft: true
created: 2026-03-08
---

## Quartz가 콘텐츠를 보여주는 2가지 방식

### 1. 폴더 → 사이드바 트리 + URL 경로

Quartz는 `content/` 폴더 구조를 **그대로 사이드바와 URL에 반영**한다.

```
content/
├── Studies/
│   └── Kafka 로컬 클러스터 띄우기.md
├── Projects/
│   └── Nasdaq Data Pipeline.md
└── Activities/
    └── DE Zoomcamp 1주차.md
```

결과:
- 사이드바: Studies > Kafka 로컬 클러스터 띄우기
- URL: `/Studies/Kafka-로컬-클러스터-띄우기`

**폴더 = 블로그 메뉴 구조 = URL 경로**

### 2. 태그 → 자동 생성되는 태그 페이지

front matter에 `tags`를 넣으면, Quartz가 `/tags/태그명` 페이지를 **자동 생성**한다.

```yaml
tags:
  - kafka
  - de-zoomcamp
```

결과:
- `/tags/kafka` → kafka 태그가 붙은 모든 글 목록
- `/tags/de-zoomcamp` → de-zoomcamp 태그가 붙은 모든 글 목록

**태그 = 폴더와 무관한 횡단 그룹핑**

### 핵심: 폴더와 태그는 독립적

| | 폴더 | 태그 |
|---|---|---|
| **역할** | 사이드바 메뉴, URL 경로 | 글 묶어서 보기 (그룹핑) |
| **위치** | 파일 시스템 | front matter의 `tags:` |
| **Quartz 결과물** | 사이드바 트리, 폴더 인덱스 페이지 | `/tags/태그명` 페이지 |
| **교차 가능?** | 한 파일은 하나의 폴더에만 | 한 파일에 여러 태그 가능 |

예: `Activities/DE Zoomcamp 1주차.md`에 `tags: [de-zoomcamp, kafka]`를 넣으면
- 사이드바: Activities 폴더 안에 보임
- `/tags/de-zoomcamp`에서도 보임
- `/tags/kafka`에서도 보임

---

## Quartz 빌드 필터 (공개/비공개)

3겹 필터로 동작한다:

### 필터 1: ignorePatterns (폴더째 빌드 제외)

```typescript
// quartz.config.ts
ignorePatterns: ["private", "templates", "Templates", ".obsidian"]
```

이 폴더들은 **빌드 자체에서 완전히 무시**된다. HTML이 생성되지 않음.

### 필터 2: draft 속성 (개별 파일 비공개)

```yaml
draft: true   → 빌드에서 제외 (비공개)
draft: false  → 빌드에 포함 (공개)
(draft 없음)  → 공개 (기본값이 false)
```

`Plugin.RemoveDrafts()`가 처리.

### 필터 3: Explorer filterFn (사이드바에서 숨김)

```typescript
// quartz.layout.ts
filterFn: (node) => {
  const exclude = new Set(["tags", "daily", "clippings", ...])
  return !exclude.has(node.slugSegment.toLowerCase())
}
```

빌드는 되지만 **사이드바 트리에서만 안 보임**. URL 직접 접근은 가능.

---

## 블로그 폴더 구조

```
MyVault/
│
│  ── 블로그에 보이는 폴더 (사이드바) ──
├── Studies/         ← 기술 공부 (강의, TIL, 도구 정리)
├── Projects/        ← 프로젝트 정리
├── Activities/      ← 대외활동 회고
│
│  ── 블로그에 안 보이는 폴더 ──
├── Categories/      ← Obsidian 카테고리 인덱스 (사이드바 숨김)
├── Notes/           ← 미분류/임시 (사이드바 숨김)
├── Daily/           ← 일일 노트 (사이드바 숨김)
├── Clippings/       ← 스크랩 (사이드바 숨김)
├── References/      ← 폐기 (Studies로 이관)
├── Attachments/     ← 이미지 (사이드바 숨김)
├── Templates/       ← 빌드 제외 (ignorePatterns)
│
├── index.md         ← 홈페이지
└── README.md        ← draft: true (비공개)
```

---

## Obsidian 작성 규칙 (유지)

| 규칙 | 설명 |
|---|---|
| **폴더가 아닌 properties로 분류** | `categories`, `tags`로 분류. 폴더는 블로그 대분류 3개만 |
| **카테고리·태그는 복수형** | Projects, Courses, Activities |
| **날짜는 YYYY-MM-DD** | `created: 2026-03-08` |
| **내부 링크 적극 활용** | `[[Kafka]]`, `[[Docker]]` |
| **draft로 공개 제어** | `draft: true` → 비공개, `draft: false` → 공개 |

---

## 프로퍼티 vs 폴더 역할 분담

| | 폴더 | categories | tags |
|---|---|---|---|
| **결정하는 것** | 블로그 어디 메뉴에 보일지 | Obsidian 내 분류 (그래프) | 블로그 + Obsidian 그룹핑 |
| **예시** | Studies/ | `[[TIL]]`, `[[Courses]]` | kafka, de-zoomcamp |
| **Quartz 결과** | 사이드바 트리 | 백링크, 그래프 뷰 | `/tags/태그명` 페이지 |
| **개수 제한** | 파일당 1개 (물리적 위치) | 여러 개 가능 | 여러 개 가능 |

---

## 글 쓰는 흐름

```
1. Obsidian에서 새 노트 생성 (Ctrl+N)
2. 템플릿 삽입 (Ctrl+T)
3. front matter 채우기 (categories, tags, draft)
4. 파일을 적절한 폴더로 이동 (Studies/Projects/Activities)
5. 본문 작성
6. 완성되면 draft: false 로 변경
7. 터미널에서 git push → 자동 배포
```

---

## 배포 방법

### 방법 1: deploy.bat 더블클릭 (추천)

`E:\MyBlog\deploy.bat` 더블클릭 → 커밋 메시지 입력 → 자동 push → 배포 완료.

### 방법 2: 터미널에서 직접

```powershell
cd e:\MyBlog\quartz
git add -A
git commit -m "feat: 새 글 제목"
git push origin v4
```

GitHub Actions가 자동으로 빌드 → GitHub Pages 배포.

> `npx quartz build`는 **로컬 미리보기 전용**. 배포에는 불필요.
> 로컬 미리보기: `cd e:\MyBlog\quartz; npx quartz build --serve` → http://localhost:8080

---

## Junction 링크 (MyVault ↔ Quartz)

`quartz/content/`는 `MyVault/`를 가리키는 Junction 링크.
Obsidian에서 수정하면 Quartz가 바로 읽을 수 있어 파일 복사 불필요.

```powershell
# 최초 1회 설정 (2026-03-08 완료)
cmd /c mklink /J "E:\MyBlog\quartz\content" "E:\MyBlog\MyVault"
```

---

## Git 저장소 구조

| 저장소 | 경로 | GitHub | 용도 |
|---|---|---|---|
| quartz | `E:\MyBlog\quartz\` | `kgeonhoe/Blog` (v4 브랜치) | 블로그 소스 + 콘텐츠 배포 |
| MyVault | `E:\MyBlog\MyVault\` | `kgeonhoe/MyVault` | Obsidian 볼트 백업 |

- quartz/content/ → MyVault/ Junction 링크로 연결
- quartz에 push하면 MyVault 파일도 함께 올라감 (블로그 배포)
- MyVault에 push하면 볼트 전체 백업 (블로그와 무관)

---

## 변경 이력

| 날짜 | 변경 내용 |
|---|---|
| 2026-03-07 | Quartz 4.5.2 설치, GitHub 저장소 연결 (kgeonhoe/Blog, v4 브랜치) |
| 2026-03-07 | quartz.config.ts 커스터마이징: pageTitle "Gray's DataHub", locale "ko-KR", baseUrl "kgeonhoe.github.io/Blog" |
| 2026-03-07 | GitHub Pages 배포 워크플로우 (deploy.yml) 생성, 첫 배포 성공 |
| 2026-03-08 | content/ 폴더를 MyVault Junction 링크로 전환 (파일 복사 제거) |
| 2026-03-08 | 폴더 구조 재편: Studies/Projects/Activities 3개 폴더로 정리 |
| 2026-03-08 | Explorer 필터를 include 방식으로 변경 (Studies/Projects/Activities만 사이드바에 표시) |
| 2026-03-08 | 기존 Notes/, References/ 파일들을 Studies/, Projects/로 이동 |
| 2026-03-08 | 운영 가이드 문서 작성 |
