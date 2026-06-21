---
categories:
  - "[[Sources]]"
  - "[[Articles]]"
author: "Allen"
url: "https://wikidocs.net/blog/@Allen/14001/"
source_type: "article"
created: "2026-06-21"
published: "2026-05-22"
ingested_date: "2026-06-21"
ingested_to:
  - "[[Wiki/topics/LLM-Wiki-Stack]]"
topics:
  - "[[Knowledge Management]]"
  - "[[AI Tools]]"
tags:
  - obsidian
  - claude-code
  - llm
  - knowledge-management
  - git
draft: false
---

## 메타데이터

- **원본 URL**: https://wikidocs.net/blog/@Allen/14001/
- **저자**: Allen
- **발행일**: 2026-05-22
- **소스 유형**: article
- **읽은 날짜**: 2026-06-21
- **Ingest 날짜**: 2026-06-21
- **연결된 Wiki 페이지**: [[Wiki/topics/LLM-Wiki-Stack]]

---

## 요약

LLM의 근본적 문제인 **세션 무상태(stateless)** 를 해결하기 위한 4가지 도구 조합 제안. Obsidian의 로컬 Markdown vault + Claude Code의 에이전틱 파일 편집 + Git의 버전 관리를 결합해 "사용할수록 스마트해지는" 영속적 AI 지식 기반을 구축하는 방법론.

---

## 주요 내용

### 핵심 문제 정의

모든 LLM은 **설계상 무상태(stateless)** — 세션 종료 시 컨텍스트 윈도우 소멸. Andrej Karpathy가 지적한 AI의 핵심 병목: 장기 기억 부재.

해법으로 제시된 개념: **LLM Wiki** — AI가 세션을 넘어 읽고, 업데이트하고, 추론할 수 있는 영속적·구조화된 지식 기반.

### 처리 흐름

```
원본 자료 → Markdown → AI 컴파일 → 영속 Wiki
```

### 각 도구의 역할

| 도구 | 역할 |
|------|------|
| **Obsidian** | 로컬 퍼스트 Markdown vault — `[[링크]]` 그래프로 지식 연결 |
| **Claude Code** | AI 컴파일러 — vault 전체 읽기/쓰기 가능한 에이전트 |
| **Markdown** | 범용 포맷 — LLM이 완벽 파싱, 의미 손실 없음 |
| **Git** | 기억의 뼈대 — 커밋이 AI 작업 이력, 브랜치로 비파괴 실험 |

### RAG vs LLM Wiki

| 항목 | RAG | LLM Wiki |
|------|-----|----------|
| 지식 진화 | 정적 | 동적 (AI가 능동 업데이트) |
| 구조 | 플랫 임베딩 | `[[링크]]` 그래프 |
| 장기 가치 | 문서 수에 비례 | **연결 밀도에 비례** |
| AI 역할 | 수동 검색자 | 능동 컴파일러·큐레이터 |

### 권장 폴더 구조

```
vault/
├── inbox/      ← 미처리 원본 투입구
├── concepts/   ← 정제된 개념 노트
├── projects/   ← 프로젝트 문서
└── sources/    ← 외부 자료
```

### CLAUDE.md 핵심 규칙 (예시)

```markdown
- 새 파일 전에 기존 파일 먼저 확인
- 관련 개념에 [[링크]] 추가
- 파일당 하나의 개념 (원자적 노트)
- 각 업데이트 후 설명적 커밋 메시지
- 횡단 주제에 #태그 사용
```

---

## 핵심 인사이트

1. **모든 채팅 세션은 0으로 초기화, 모든 Wiki 세션은 이전 위에 쌓임**
   - 이 격차가 복리로 증가 — 장기적으로 완전히 다른 도구가 됨

2. **Claude Code는 챗봇이 아닌 에이전트**
   - 파일 시스템에서 직접 작동 — 전체 vault 읽기, 기존 노트 업데이트, 링크 추가, 교차 참조 생성

3. **컨텍스트 윈도우 확장 + 에이전틱 AI 성숙 = 이 스택의 가치 증가**
   - 기본에 베팅 (평문 텍스트, 오픈 포맷, 버전 컨트롤, 로컬 퍼스트) → 시대에 뒤떨어지지 않음

---

## 인용 및 메모

> "정적 노트 → 내가 검색합니다 / LLM Wiki → Claude가 읽고, 링크하고, 업데이트하고, 추론합니다"

현재 vault는 이 개념을 이미 구현하고 있음. 다만 아티클의 단순한 구조보다 훨씬 정교화된 형태 (entities/topics/comparisons + ingest/query/lint 워크플로우).

> "wiki는 단순히 성장하는 게 아니라 밀도가 높아집니다"

교차 참조 링크 수가 곧 지식의 질 — `lint wiki`로 정기 점검하는 이유.

---

## 관련 노트

- [[Wiki/topics/LLM-Wiki-Stack]] - 이 아티클 기반 Wiki 정리
- [[CLAUDE.md]] - 현재 vault의 Claude Code 가이드 (이 아티클 벤치마킹 결과)

---

## 액션 아이템

- [x] `CLAUDE.md` vault 루트에 생성 (Claude Code 자동 감지)
- [x] `vault-commit.bat` 생성 (Quartz 배포와 분리된 vault git 이력)
- [ ] 주 1회 `lint wiki` 실행 습관화
- [ ] Sources/ 폴더 아티클 추가 정례화

---

#obsidian #claude-code #llm #knowledge-management #git
