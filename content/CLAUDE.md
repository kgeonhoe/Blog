---
draft: true
---

# MyVault — LLM Wiki Keeper

> Claude Code가 이 vault를 관리하기 위한 진입점입니다.
> 전체 스키마: [[.copilot/instructions.md]]

---

## 세션 시작 시 필독 순서

1. `wiki-index.md` — 전체 페이지 카탈로그 (현재 상태 파악)
2. `.copilot/wiki-log.md` — 최근 작업 이력 (무엇이 마지막으로 처리됐는지)
3. `.copilot/instructions.md` — 전체 워크플로우 규칙

---

## 폴더 구조 (한눈에)

```
MyVault/
├── Studies/        ← 📖 읽기 전용 (사용자 학습 노트)
├── Projects/       ← 📖 읽기 전용 (프로젝트 문서)
├── Activities/     ← 📖 읽기 전용 (강의, 코스 기록)
├── Daily/          ← 📖 읽기 전용 (일일 노트)
├── Sources/        ← 📖 읽기 전용 (외부 원본 자료)
│   ├── articles/
│   ├── books/
│   ├── papers/
│   └── podcasts/
│
├── Wiki/           ← ✍️  LLM 작업 영역 (구조화된 지식)
│   ├── entities/   ← 도구·기술·개념 페이지
│   ├── topics/     ← 주제별 요약
│   ├── comparisons/← 비교 분석
│   ├── syntheses/  ← 합성 인사이트
│   └── queries/    ← 질의응답 저장소
│
├── wiki-index.md   ← ✍️  전체 페이지 카탈로그 (항상 최신 유지)
└── .copilot/
    ├── instructions.md  ← 전체 스키마 (워크플로우 상세)
    └── wiki-log.md      ← 작업 이력 로그
```

---

## 명령어 요약

| 사용자 입력 | 실행 워크플로우 |
|------------|----------------|
| `"Studies/Kafka.md ingest"` | Ingest — 노트 → Wiki 변환 |
| `"Kafka와 Redpanda 차이는?"` | Query — Wiki 기반 답변 합성 |
| `"lint wiki"` | Lint — 고아 페이지·모순·누락 링크 점검 |

---

## 핵심 규칙

- **Studies/Projects/Activities/Daily/Sources/ 절대 수정 금지**
- Wiki 페이지는 반드시 원본 소스 인용 (`[[Studies/Kafka.md#섹션]]`)
- 모든 작업 후 `wiki-index.md`와 `.copilot/wiki-log.md` 업데이트
- `[[링크]]` 추가 시 양방향 링크 확인


## 금지사항 (NEVER DO)
- 웹 스크래핑, 비공식 API, 헤드리스 브라우저 사용
- API 키를 코드/저장소에 하드코딩
