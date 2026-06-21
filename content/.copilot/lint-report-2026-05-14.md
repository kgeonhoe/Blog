# Wiki Lint Report
**Generated**: 2026-05-14 23:53  
**Wiki Pages**: 5 (entities: 4, comparisons: 1)

---

## 🔍 검사 항목

### 1. 깨진 링크 (Broken Links)

**발견된 문제: 2개**

#### ❌ Wiki/topics/Stream-Processing 페이지 없음
- **참조 위치**: `Wiki/entities/Kafka.md:55`
- **링크**: `[[Wiki/topics/Stream-Processing]]`
- **상태**: 페이지가 존재하지 않음

**권장 조치**:
- [ ] `Wiki/topics/Stream-Processing.md` 생성
- [ ] 또는 `Wiki/entities/Kafka.md`에서 링크 제거

---

#### ⚠️ Studies/RedPanda.md 비어있음
- **참조 위치**: 
  - `Wiki/entities/Kafka.md:56`
  - `Wiki/comparisons/Kafka-vs-Redpanda.md:16` (sources)
  - `Wiki/comparisons/Kafka-vs-Redpanda.md:153`
- **링크**: `[[Studies/RedPanda]]`
- **상태**: 파일 존재하나 내용 비어있음 (템플릿만)

**권장 조치**:
- [ ] `Studies/RedPanda.md` 내용 작성 (사용자 작업)
- [ ] 또는 Wiki에서 임시로 참조 제거 고려

---

### 2. 소스 인용 검증 (Source Citations)

**✅ 모든 Wiki 페이지가 sources 필드 보유**

| Wiki 페이지 | Sources 개수 | 검증 |
|-------------|--------------|------|
| Wiki/entities/Kafka.md | 2 | ✅ |
| Wiki/entities/Docker.md | 1 | ✅ |
| Wiki/entities/Airflow.md | 2 | ✅ |
| Wiki/entities/Spark.md | 3 | ✅ |
| Wiki/comparisons/Kafka-vs-Redpanda.md | 4 | ✅ |

---

### 3. 교차 참조 일관성 (Cross-reference Consistency)

**✅ 주요 교차 참조 정상**

확인된 양방향 링크:
- Studies/Kafka ↔ Wiki/entities/Kafka ✅
- Studies/Spark ↔ Wiki/entities/Spark ✅
- Studies/Docker ↔ Wiki/entities/Docker ✅
- Studies/Airflow ↔ Wiki/entities/Airflow ✅
- Projects/Nasdaq-Stock-Pipeline ↔ Wiki/entities/Kafka ✅
- Projects/Nasdaq-Stock-Pipeline ↔ Wiki/entities/Spark ✅
- Wiki/entities/Kafka ↔ Wiki/entities/Docker ✅
- Wiki/entities/Kafka ↔ Wiki/entities/Spark ✅

---

### 4. 고아 페이지 (Orphan Pages)

**✅ 고아 페이지 없음**

모든 Wiki 페이지가 다른 페이지나 .copilot/wiki-index.md에서 참조됩니다.

---

### 5. 미흡한 내용 (Incomplete Content)

**⚠️ 1개 발견**

#### Studies/RedPanda.md
- **상태**: 템플릿 상태로 남아있음 (내용 없음)
- **영향**: Wiki/comparisons/Kafka-vs-Redpanda.md가 이를 소스로 인용하나, 실제 내용은 Activities/DataTalksClub에서 가져옴
- **권장**: 사용자가 Studies/RedPanda.md에 학습 내용 작성 또는 "ingest" 요청

---

## 📊 통계

| 항목 | 개수 |
|------|------|
| **전체 Wiki 페이지** | 5 |
| **깨진 링크** | 1 (Stream-Processing) |
| **비어있는 소스** | 1 (Studies/RedPanda.md) |
| **고아 페이지** | 0 |
| **소스 인용 누락** | 0 |

---

## 🚀 권장 조치 우선순위

### 우선순위 1 (즉시)
1. **Wiki/topics/Stream-Processing.md 생성** 또는 Kafka.md에서 링크 제거
   - 현재 Kafka 페이지에서 참조하나 페이지 없음

### 우선순위 2 (사용자 작업 필요)
2. **Studies/RedPanda.md 작성**
   - 사용자가 RedPanda 학습 후 내용 작성
   - 또는 LLM에게 "Studies/RedPanda.md ingest" 요청해 Wiki/entities/Redpanda.md 생성

### 우선순위 3 (선택)
3. **Wiki/entities/Redpanda.md 생성**
   - Activities/DataTalksClub-data-engineering/week7에서 Redpanda 실습 내용 기반으로 생성 가능
   - Kafka-vs-Redpanda 비교 페이지의 참조 완성도 향상

---

## 🔧 자동 수정 가능 항목

Lint 워크플로는 **탐지만 수행**하며, 수정은 사용자 승인 후 진행합니다.

다음 명령어로 자동 수정 가능:
```
"lint fix: remove Stream-Processing link"
"lint fix: create Stream-Processing stub"
```

---

## 참고

- 이 리포트는 `.copilot/wiki-log.md`에 기록됩니다
- Lint는 정기적으로 실행하여 Wiki 품질 유지
- 사용자 노트(Studies/, Projects/)는 검사하지 않음 (LLM 수정 불가 영역)
