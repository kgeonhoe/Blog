---
title: "Dagster Storage 폴더란?"
categories:
  - "[[Projects]]"
  - "[[stock-platform]]"
tags:
  - stock-platform
  - dagster
  - storage
  - io-manager
draft: false
created: "2026-06-21"
updated: "2026-06-21"
---
# Dagster Storage 폴더란?

## 📂 위치
```
stock-platform/dagster_assets/storage/
├── krx_symbols               # KRX 종목 목록 (List)
├── nasdaq_symbols            # NASDAQ 종목 목록 (List)
├── krx_daily_ohlcv/          # KRX 일별 데이터 (파티션별)
│   ├── 2024-12-30            # 각 날짜별 파일
│   └── 2026-05-30
└── nasdaq_daily_ohlcv/       # NASDAQ 일별 데이터 (파티션별)
    ├── 2024-01-15
    └── 2024-01-16
```

---

## 🎯 목적: Dagster의 로컬 캐시

**이 폴더는 Dagster가 asset의 실행 결과를 로컬에 저장하는 곳입니다.**

### 주요 기능
1. **캐싱**: Asset 실행 결과를 저장해서 재실행 없이 재사용
2. **디버깅**: 어떤 데이터가 생성되었는지 확인 가능
3. **의존성 전달**: 상위 asset의 결과를 하위 asset으로 전달

---

## 💾 저장 형식: Pickle

모든 파일은 **Python pickle 형식**으로 저장됩니다.

```python
import pickle

# 읽기
with open('dagster_assets/storage/krx_symbols', 'rb') as f:
    symbols = pickle.load(f)  # List[str]

# 파티션된 asset 읽기
with open('dagster_assets/storage/krx_daily_ohlcv/2024-12-30', 'rb') as f:
    df = pickle.load(f)  # pd.DataFrame
```

---

## 📊 실제 데이터 예시

### 1. `krx_symbols` (파티션 없음)
```python
타입: list
개수: 2808개
데이터: ['005930', '000660', '402340', ...]  # KRX 종목 코드
```

### 2. `krx_daily_ohlcv/2024-12-30` (파티션 있음)
```python
타입: pd.DataFrame
크기: (50, 2)
컬럼: ['symbol', 'date']
데이터:
   symbol        date
0  005930  2024-12-30  # 삼성전자
1  000660  2024-12-30  # SK하이닉스
2  402340  2024-12-30
...
```

**📝 참고:** 실제 OHLCV 데이터는 MinIO에 저장되고, 이 파일은 "어떤 종목을 처리했는지" 메타데이터만 저장

---

## 🔄 데이터 흐름

### Asset 실행 시:
1. **Input**: 이전 asset의 storage 파일을 pickle로 읽음
2. **Process**: 비즈니스 로직 실행 (데이터 수집/계산)
3. **Output**: 결과를 MinIO/DuckDB + storage 폴더에 저장

### 예시: `krx_daily_ohlcv` asset
```python
@asset
def krx_daily_ohlcv(
    context: AssetExecutionContext,
    krx_symbols: List[str],  # ← storage/krx_symbols에서 읽음
) -> Output[pd.DataFrame]:
    # 1. Input: krx_symbols (2808개 종목)
    # 2. Process: FDR로 OHLCV 수집 → MinIO 저장
    # 3. Output: 성공한 종목 목록 → storage/krx_daily_ohlcv/날짜 저장
    
    collected_data = []
    for symbol in krx_symbols[:50]:  # 테스트로 50개만
        # MinIO에 저장
        save_to_minio(symbol, data)
        collected_data.append({'symbol': symbol, 'date': date})
    
    return Output(
        value=pd.DataFrame(collected_data),  # ← storage에 pickle 저장됨
        metadata={"count": len(collected_data)}
    )
```

---

## ⚠️ 중요: Storage ≠ 실제 데이터

### Storage에 저장되는 것:
- ✅ 메타데이터 (종목 목록, 처리 결과 요약)
- ✅ 작은 데이터 (종목 코드 리스트 등)

### Storage에 저장되지 않는 것:
- ❌ 실제 OHLCV 데이터 → **MinIO** (Parquet)
- ❌ 계산된 지표 데이터 → **MinIO** (Parquet)
- ❌ 거래 신호 데이터 → **DuckDB** (SQL)

---

## 🗑️ 삭제해도 되나요?

### 안전하게 삭제 가능:
```bash
# storage 폴더 전체 삭제
rm -rf dagster_assets/storage/

# Dagster는 다음 실행 시 asset을 재실행하여 재생성
```

### 언제 삭제하나요?
1. **디버깅 후**: 테스트로 생성된 오래된 데이터 정리
2. **코드 변경 후**: asset 로직이 바뀌었을 때
3. **디스크 공간 부족**: storage 폴더가 너무 커졌을 때

**📌 주의:** storage 삭제 후 asset 재실행하면 MinIO/DuckDB의 실제 데이터는 유지됨

---

## 🔍 비교: Storage vs MinIO vs DuckDB

| 저장소 | 용도 | 형식 | 크기 | 예시 |
|--------|------|------|------|------|
| **Storage** | Dagster 캐시 | Pickle | 작음 | 종목 목록, 메타데이터 |
| **MinIO** | 시계열 데이터 | Parquet | 큼 | OHLCV, 기술적 지표 |
| **DuckDB** | 분석용 테이블 | SQL | 중간 | 거래 신호, 집계 데이터 |

---

## 🛠️ 실제 사용 예시

### 1. Storage 파일 직접 읽기 (디버깅)
```python
import pickle
import pandas as pd

# 종목 목록 확인
with open('dagster_assets/storage/krx_symbols', 'rb') as f:
    symbols = pickle.load(f)
    print(f"KRX 종목 수: {len(symbols)}")

# 특정 날짜 실행 결과 확인
with open('dagster_assets/storage/krx_daily_ohlcv/2024-12-30', 'rb') as f:
    df = pickle.load(f)
    print(df.head())
```

### 2. Storage 크기 확인
```bash
# Windows
Get-ChildItem -Path dagster_assets\storage -Recurse | Measure-Object -Property Length -Sum

# Linux/Mac
du -sh dagster_assets/storage/
```

### 3. 오래된 파티션 삭제
```bash
# 2024년 데이터만 삭제
rm -rf dagster_assets/storage/*/2024-*

# 특정 asset만 삭제
rm -rf dagster_assets/storage/krx_daily_ohlcv/
```

---

## 📚 요약

| 질문 | 답변 |
|------|------|
| **Storage는 뭐하는 곳?** | Dagster가 asset 실행 결과를 캐싱하는 로컬 폴더 |
| **왜 필요한가?** | Asset 간 데이터 전달, 재실행 방지, 디버깅 |
| **무엇이 저장되나?** | Asset의 `return` 값 (pickle 형식) |
| **실제 데이터는?** | MinIO (Parquet) + DuckDB (SQL)에 저장 |
| **삭제해도 되나?** | ✅ 안전함, 재실행하면 재생성됨 |
| **언제 삭제하나?** | 디스크 공간 부족, 오래된 테스트 데이터 정리 |

---

## 🎓 핵심 개념

Dagster의 **Storage 폴더**는:
- 🎯 **Asset 실행 결과의 로컬 캐시**
- 🔗 **Asset 간 의존성을 연결하는 중간 매개체**
- 🐛 **디버깅용 스냅샷**

**실제 프로덕션 데이터는:**
- 💾 **MinIO** (대용량 Parquet 파일)
- 🗄️ **DuckDB** (SQL 쿼리용 테이블)

Storage는 Dagster가 내부적으로 관리하므로, 일반적으로 신경 쓸 필요 없습니다!
