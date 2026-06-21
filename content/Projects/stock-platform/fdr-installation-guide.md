---
title: "FinanceDataReader (FDR) 설치 및 사용 가이드"
categories:
  - "[[Projects]]"
  - "[[stock-platform]]"
tags:
  - stock-platform
  - fdr
  - installation
  - guide
draft: false
created: "2026-06-21"
updated: "2026-06-21"
---
# FinanceDataReader (FDR) 설치 및 사용 가이드

## 🔧 설치

### 방법 1: pip 직접 설치
```bash
pip install finance-datareader
```

### 방법 2: requirements 파일 사용
```bash
cd stock-platform
pip install -r requirements-base.txt
```

---

## ✅ 설치 확인

```bash
python -c "import FinanceDataReader as fdr; print('✅ FDR 설치 완료!')"
```

---

## 📊 FDR이 필요한 Asset

### `krx_symbols` Asset
한국 증시(KOSPI, KOSDAQ, KONEX) 전체 종목 목록 수집에 사용됩니다.

```python
# dagster_assets/assets.py에서
df_krx = fdr.StockListing('KRX')  # 전체 한국 상장 종목
df_kospi = fdr.StockListing('KOSPI')  # KOSPI만
```

### `krx_daily_ohlcv` Asset  
한국 증시의 일별 OHLCV 데이터 수집에 사용됩니다.

```python
# 삼성전자(005930) 데이터 수집
df = fdr.DataReader('005930', start='2024-01-01', end='2024-12-01')
```

---

## 🚫 FDR이 없으면?

FDR이 설치되지 않으면:
1. `krx_symbols` → 하드코딩된 주요 종목만 반환 (삼성전자, SK하이닉스 등 20개)
2. `krx_daily_ohlcv` → 데이터 수집 불가, `FDR_NOT_AVAILABLE` 반환

---

## 📝 FDR vs yfinance

| 기능 | FDR | yfinance |
|------|-----|----------|
| 미국 주식 | ❌ | ✅ |
| 한국 주식 | ✅ | ❌ |
| 종목 목록 | ✅ | ❌ |
| 데이터 품질 | 높음 | 높음 |

**현재 시스템:**
- NASDAQ → yfinance 사용
- KRX(한국) → FDR 사용

---

## 🔍 FDR 주요 기능

### 1. 종목 목록
```python
import FinanceDataReader as fdr

# KRX 전체 (KOSPI + KOSDAQ + KONEX)
df_krx = fdr.StockListing('KRX')

# KOSPI만
df_kospi = fdr.StockListing('KOSPI')

# KOSDAQ만
df_kosdaq = fdr.StockListing('KOSDAQ')

# NASDAQ (미국)
df_nasdaq = fdr.StockListing('NASDAQ')
```

### 2. 주가 데이터
```python
# 삼성전자 일별 데이터
df = fdr.DataReader('005930', '2024-01-01', '2024-12-01')
print(df.columns)
# ['Open', 'High', 'Low', 'Close', 'Volume', 'Change']

# 애플 (미국 종목도 가능)
df = fdr.DataReader('AAPL', '2024-01-01', '2024-12-01')
```

### 3. 주요 종목 코드
```python
# 삼성전자: 005930
# SK하이닉스: 000660
# NAVER: 035420
# 카카오: 035720
# 현대차: 005380
```

---

## 🐛 트러블슈팅

### 1. ImportError: No module named 'FinanceDataReader'
**원인:** FDR이 설치되지 않음

**해결:**
```bash
pip install finance-datareader
```

### 2. Dagster에서 FDR_NOT_AVAILABLE
**원인:** Dagster 환경의 Python에 FDR이 설치되지 않음

**해결:**
```bash
# Dagster가 사용하는 Python 확인
which python  # Linux/Mac
where python  # Windows

# 해당 Python에 설치
/path/to/python -m pip install finance-datareader
```

### 3. Docker 환경에서 에러
**원인:** Docker 이미지에 FDR이 포함되지 않음

**해결:** `Dockerfile` 또는 `requirements.txt`에 추가
```dockerfile
# Dockerfile
RUN pip install finance-datareader
```

---

## ✨ 설치 완료 후

이제 Dagster에서:
1. `krx_symbols` asset 실행 가능 → 한국 전체 종목 수집
2. `krx_daily_ohlcv` asset 실행 가능 → 한국 주식 데이터 수집

```bash
# Dagster 실행
cd stock-platform/dagster_assets
dagster dev

# 브라우저에서 http://localhost:3000
# → krx_symbols 또는 krx_daily_ohlcv asset 실행
```

---

## 📚 참고 자료

- **공식 문서:** https://github.com/FinanceData/FinanceDataReader
- **예제:** https://financedata.github.io/posts/finance-data-reader-users-guide.html
