---
categories:
  - "[[Troubleshooting]]"
created: 2025-08-10
topics:
  - "[[Data Engineering]]"
tags:
  - troubleshooting
  - streamlit
draft: false
---

# Streamlit 페이지 로딩 실패

## 증상
Streamlit 대시보드 페이지가 렌더링되지 않거나 ImportError, ModuleNotFoundError가 발생하는 경우.

## 해결 방법

```python
# 패키지 재설치
pip install -r requirements-streamlit.txt

# 캐시 삭제
streamlit cache clear
```
