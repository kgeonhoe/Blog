---
title: "LLM Wiki Stack — 살아있는 AI 지식 기반 구축"
categories:
  - "[[Wiki]]"
  - "[[Topics]]"
  - "[[AI Tools]]"
tags:
  - llm
  - obsidian
  - claude-code
  - knowledge-management
  - git
draft: false
created: "2026-06-21"
updated: "2026-06-21"
sources:
  - "[[Sources/articles/Obsidian-Claude-Code-Markdown-Git-LLM-Wiki-Stack]]"
related_entities: 2
---

## 개요

**LLM Wiki Stack**은 AI의 근본적 한계인 **세션 무상태(stateless)** 문제를 해결하기 위한 도구 조합이다. Obsidian + Claude Code + Markdown + Git을 결합해 단순한 노트 앱을 넘어 **사용할수록 스마트해지는 AI 지식 기반**을 구축한다.

> *"모든 채팅 세션은 0으로 초기화된다. 모든 Wiki 세션은 이전 위에 쌓인다."*
> — *Source: [[Sources/articles/Obsidian-Claude-Code-Markdown-Git-LLM-Wiki-Stack]]*

---

## 왜 LLM Wiki인가

### 문제: LLM의 구조적 망각

모든 언어 모델은 설계상 무상태다. 세션이 끝나면 컨텍스트 윈도우가 닫히고, 프로젝트에 대한 어떤 기억도 남지 않는다. Andrej Karpathy가 지적한 AI의 핵심 병목 — **장기 기억의 부재**.

### 해법: 파일 시스템이 기억이 된다

```
원본 자료 → Markdown → AI 컴파일 → 영속 Wiki
```

AI가 읽고 쓸 수 있는 평문 Markdown 파일이 곧 메모리가 된다. 세션이 바뀌어도 파일은 남는다.

> *Source: [[Sources/articles/Obsidian-Claude-Code-Markdown-Git-LLM-Wiki-Stack]]*

---

## 스택 구성요소

### Obsidian — 지식의 컨테이너

- **로컬 퍼스트**: 모든 것이 `.md` 파일 — 독점 DB 없음, 클라우드 종속 없음
- **`[[링크]]` 그래프**: 연결이 쌓일수록 실제 사고 방식을 반영하는 토폴로지 형성
- **AI 직접 접근**: Claude가 export/API 없이 파일을 직접 읽고 수정

### Claude Code — AI 컴파일러

챗봇이 아닌 **에이전트** — 파일 시스템에서 직접 작동한다.

| 가능한 작업 | 설명 |
|------------|------|
| 전체 vault 읽기 | 컨텍스트 윈도우 한계 내 전체 지식 로드 |
| 기존 노트 업데이트 | 중복 생성 대신 관련 페이지에 내용 통합 |
| `[[링크]]` 자동 추가 | 인식한 개념 간 자동 교차 참조 |
| 교차 참조 생성 | 새 인사이트를 기존 3개 문서와 연결 |

```
사용자: "Studies/Kafka.md ingest"

Claude Code:
  → Wiki/entities/Kafka.md 읽기 (기존)
  → 새 내용 식별 및 통합
  → [[관련-개념]] 링크 추가
  → wiki-log.md에 커밋 기록
```

> *Source: [[Sources/articles/Obsidian-Claude-Code-Markdown-Git-LLM-Wiki-Stack]]*

### Markdown — 범용 포맷

`.md` 파일은 어떤 소프트웨어 없이도:
- 사람이 읽을 수 있고
- LLM이 완벽 파싱하며
- git으로 버전 관리되고
- 어떤 포맷으로도 변환 가능

**의미 손실이 없다** — PDF 파싱 오류도, API 속도 제한도 없다.

### Git — 기억의 뼈대

| Git 기능 | Wiki에서의 역할 |
|---------|--------------|
| 커밋 이력 | AI 작업 타임라인 — 무엇이 언제 왜 변경됐는지 추적 |
| 브랜칭 | 비파괴적 vault 재구성 실험 |
| 원격 저장소 | 기기 간 동기화 (Obsidian Sync 불필요) |
| 커밋 메시지 | AI가 무엇을 건드렸는지 감사 추적 |

> *Source: [[Sources/articles/Obsidian-Claude-Code-Markdown-Git-LLM-Wiki-Stack]]*

---

## RAG vs LLM Wiki

두 접근법은 **다른 버전의 문제**를 해결한다.

| 항목 | RAG | LLM Wiki |
|------|-----|----------|
| 핵심 메커니즘 | 쿼리 시점에 관련 청크 검색 | 큐레이션된 링크 지식 그래프 유지 |
| 지식 진화 | 정적 — 스스로 업데이트 안 됨 | 동적 — AI가 능동적으로 업데이트·링크 |
| 구조 | 플랫 임베딩, 명시적 연결 없음 | `[[링크]]` 의미 토폴로지 그래프 |
| 적합한 용도 | "이 문서에서 답 찾기" | "몇 달에 걸친 이해 구축" |
| 장기 가치 | 문서 수에 비례 | **연결 밀도에 비례** |
| AI 역할 | 수동 검색자 | 능동 컴파일러·큐레이터 |

**RAG는 검색 엔진, LLM Wiki는 지식 기반이다.**

> *Source: [[Sources/articles/Obsidian-Claude-Code-Markdown-Git-LLM-Wiki-Stack]]*

---

## 복리 효과

Wiki를 3개월 사용하면:
- 새로 읽은 자료가 자동으로 기존 노트 여러 개와 연결
- Claude에게 질문하면 인터넷 일반 지식이 아닌 **내 리서치 맥락**으로 답변
- 6개월 전에 공부한 개념이 관련성이 생겼을 때 자동으로 떠오름

Wiki는 단순히 성장하는 게 아니라 **밀도가 높아진다.** `lint wiki`로 정기 점검하는 이유.

---

## 현재 Vault 구현 현황

이 vault는 아티클의 개념을 이미 구현했으며, 오히려 더 정교한 형태로 확장되었다.

### 아티클 대비 확장된 부분

| 항목 | 아티클 권장 | 현재 Vault |
|------|------------|-----------|
| 폴더 구조 | `inbox/concepts/projects/sources` | `Studies/Projects/Wiki/entities/topics/comparisons/syntheses/queries` |
| LLM 가이드 | 단순 `CLAUDE.md` | `.copilot/instructions.md` + ingest/query/lint 3가지 워크플로우 |
| 퍼블리싱 | 언급 없음 | **Quartz 정적 블로그 자동 배포** |
| 작업 추적 | 없음 | `wiki-log.md` + `wiki-index.md` |

### 벤치마킹으로 적용한 부분 (2026-06-21)

- ✅ `CLAUDE.md` vault 루트 생성 — Claude Code 세션 시작 시 자동 감지
- ✅ `vault-commit.bat` 생성 — Quartz 배포와 분리된 vault 전용 git 이력

> *Source: [[Sources/articles/Obsidian-Claude-Code-Markdown-Git-LLM-Wiki-Stack]]*

---

## CLAUDE.md 설정 패턴

Claude Code가 vault를 인식하도록 하는 핵심 파일. **vault 루트에 배치해야 자동 감지된다.**

```markdown
# CLAUDE.md 핵심 포함 내용
- vault 폴더 구조 및 읽기/쓰기 권한 명시
- 세션 시작 시 읽을 파일 순서 (index → log → instructions)
- 3가지 명령어: ingest / query / lint
- 원자적 노트 원칙 (파일당 하나의 개념)
- 소스 인용 규칙 ([[Studies/Kafka.md#섹션]] 형태)
```

---

## 관련 페이지

### Entity 페이지
- [[Wiki/entities/Kafka]] — vault에서 실제 운용 중인 스트리밍 기술
- [[Wiki/entities/Docker]] — 로컬 환경 구성

### 사용자 노트
- [[CLAUDE.md]] — 현재 vault의 Claude Code 진입점
- [[.copilot/instructions.md]] — 전체 LLM 에이전트 스키마

---

## 참고 자료

- [[Sources/articles/Obsidian-Claude-Code-Markdown-Git-LLM-Wiki-Stack]] — 원본 아티클 (Allen, wikidocs.net)
