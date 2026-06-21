---
draft: true
---
# HUB UPP Hourly 프로젝트 (HUB UPP Hourly Alert Bot)

## 1) 개요

- **프로젝트명**: HUB UPP Hourly Alert Bot
- **목적**: API로 주문/출고 데이터를 수집 → **UPP(Units Per Parcel)** 등 운영 지표를 시간 단위로 계산 → **Hive 적재 + 차트 생성** → **Microsoft Teams로 실시간 알림 발송**
- **가치**: 공정(운영) 담당자들이 **공정 간 실시간 지표를 정기적으로 추적**할 수 있도록 하고, 변동/이슈를 빠르게 인지해 운영 Support를 수행

---

## 2) 프로젝트 목적 (Why)

**UPP(Units Per Parcel) 시간별 모니터링 및 알림 자동화**를 통해 물류 운영 효율을 실시간으로 추적하고, 관련 팀에 자동으로 인사이트를 제공하는 것을 목표로 합니다.

---

## 3) 데이터 Flow (End-to-End)

### STEP 1. Python 기반 API 데이터 수집 (API Forge)

**4가지 조합으로 API 호출**

- `ordered_unit` : 주문 유닛
- `ordered_parcel` : 주문 파셀
- `shipped_unit` : 출고 유닛
- `shipped_parcel` : 출고 파셀

**시간대별 날짜 처리 로직**

- **00:00 ~ 04:59**: 전날 데이터로 조회 (`target_date = today - 1 day`)
- **05:00 이후**: 당일 데이터 조회 (`target_date = today`)

각 API 응답에서 필요한 **수량 합계(SUM)** 를 추출합니다.

---

### STEP 2. 메트릭 계산

`calculate_metrics()` 함수에서 운영 지표를 계산합니다.

- **ORDER UPP**: 주문 기준 UPP(Units Per Parcel)
- **Backlog**: 주문 - 출고의 차이
- 기타 운영 메트릭(필요 시 확장)

---

### STEP 3. Hive DB 적재 및 차트 생성

- **적재 테이블**: `inc11_operation.UPP_Hourly`
- **적재 컬럼(예시)**
    - `Date` (날짜)
    - `Time` (시:분)
    - `Hour` (시간: 특수 변환 적용)
    - `UPP` (계산 결과)

**Hour 변환 로직 (자정 이후 연장 처리)**

- 0시 → 24
- 1시 → 25
- 2시 → 26
- 3시 → 27
- 4시 이후 → 원래 hour 그대로 사용

적재 후 **5초 대기**한 뒤 `generate_upp_chart()`로 시각화 차트를 생성합니다.

---

### STEP 4. Microsoft Teams 알림 발송

- **발송 제외 시간**: **04, 05, 06, 07시**는 알림 스킵 (야간 알림 방지)
- **발송 방식**: Power Automate Webhook 사용 (Adaptive Card payload)
- **발송 내용**
    - 계산된 메트릭 요약 (UPP, backlog 등)
    - UPP 차트 URL
    - 처리 날짜/시간

**관련 코드(요약)**

Python

```
adaptive_card = {
    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
    "type": "AdaptiveCard",
    "version": "1.4",
    "msteams": {"width": "full"},
    "body": [
        {"type": "TextBlock", "text": "📊 출고현황 및 UPP", "weight": "Bolder", "size": "Large", "color": "Accent"},
        {"type": "TextBlock", "text": f"날짜: {target_date} | 시간: {current_time}", "size": "Medium"},
        {"type": "TextBlock", "text": "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"}
    ]
}

response = requests.post(webhook_url, json=payload, timeout=30, verify=False)
response.raise_for_status()
```

---

## 4) 기술 스택

| 구분            | 기술                                                      |
| ------------- | ------------------------------------------------------- |
| Orchestration | Dagster (Asset 기반 파이프라인)                                |
| 데이터 소스        | MOS API (ACCESS_KEY 인증)                                 |
| 저장소           | Hive (`HiveJob` 클래스)                                    |
| 알림            | Microsoft Teams (Power Automate Webhook, Adaptive Card) |

---

## 5) 주요 특징

### (1) 자정 전후 데이터 처리

- **0~4시 데이터는 전날 기준으로 처리**
- 자정 이후 데이터를 전날의 연장 운영으로 보는 운영 관점을 반영

### (2) 야간 알림 스킵

- **4~7시 Teams 발송 제외**
- 불필요한 야간 알림 최소화

### (3) 메타데이터 트래킹 (Dagster)

실행 결과를 Dagster 메타데이터로 기록합니다.

- `status`: success / failed
- `date`: 처리 날짜
- `hour`: 처리 시간
- `upp`: 계산된 UPP 값
- `duration_seconds`: 실행 소요 시간

---

## 6) Dagster Asset 설정

Python

```
@asset(
  compute_kind="python",
  group_name="hub_upp_hourly",
  name="hub_upp_hourly",
  tags={
      "ops_type": "alertbot",
      "collector": "hub_upp_hourly",
  },
)
```

---

## 7) Power Automative 웹후크 수신 설정 

![[Pasted image 20260331233659.png]]

## 결과 
![[Pasted image 20260331233601.png]]