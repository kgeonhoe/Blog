---
title: Dagster의 자산 중심 워크플로우
tags:
  - dagster
  - dbt
  - data-modeling
draft: true
created: 2026-08-15
---

Dagster를 붙이면서 제일 오래 걸린 건 문법이 아니라 사고방식이었다. Airflow를 쓰다 넘어오면 "이 작업을 언제 돌릴까"로 생각하는데, Dagster는 "이 데이터를 무엇으로 만들까"로 묻는다. 이 차이를 이해하기 전까지는 asset을 그냥 이름만 다른 task로 쓰게 된다.

## 쿠키로 보는 Task와 Asset

쿠키 만들기를 예로 들면 차이가 분명해진다.

작업 중심(task-centric)으로 쓰면 이렇게 나열된다.

1. 습식 재료 섞기
2. 건식 재료 섞기
3. 반죽 만들기
4. 초콜릿 칩 추가하기
5. 쿠키 굽기

관리 대상은 각 단계의 성공 여부와 실행 순서다. Airflow, Luigi, Azure Data Factory가 이 계열이다. DAG로 의존성을 걸고, 앞 태스크가 끝나야 다음 태스크가 돈다.

자산 중심(asset-centric)으로 쓰면 대상이 바뀐다.

1. 습식 재료, 건식 재료
2. 쿠키 반죽 (습식 + 건식)
3. 초콜릿 칩 쿠키 반죽 (반죽 + 초콜릿 칩)
4. 구운 초콜릿 칩 쿠키

관리 대상은 결과물 자체다. Dagster, dbt, MLflow가 이 계열이다.

차이가 드러나는 건 문제가 생겼을 때다. 구운 쿠키가 이상하면 반죽을 보고, 반죽이 이상하면 재료를 본다. 각 중간 산출물이 이름을 갖고 있으니 역추적이 된다. Task 기반에서는 "3번 단계가 실패했다"까지는 알아도, 그래서 지금 어떤 데이터가 오염됐는지는 별도로 추적해야 한다.

확장도 다르다. "프로스팅"이라는 자산을 하나 추가하면 되지, 전체 워크플로우 순서를 다시 짤 필요가 없다. 반죽 자산은 견과류 쿠키에도 그대로 재사용된다.

## 코드에서는 이렇게 보인다

```python
import dagster as dg

@dg.asset
def raw_orders():
    return extract()

@dg.asset(deps=[raw_orders])
def staging_orders():
    return transform()

@dg.asset(deps=[staging_orders])
def mart_orders():
    return aggregate()
```

개발자가 바라보는 대상은 실행 순서가 아니라 이 계보다.

```
raw_orders (asset)
    ↓
staging_orders (asset)
    ↓
mart_orders (asset)
```

Dagster에서 `@asset` 함수는 단순 Task가 아니라 해당 데이터 자산의 정의다. 공식 문서도 `@asset`을 Asset Graph의 구성요소로 취급한다.

Airflow 3에도 `@asset` 데코레이터가 들어와서 코드만 보면 비슷해 보이는데, 실행 모델은 다르다. 그 비교는 [[Airflow 3와 Dagster 비교]]에 따로 정리했다.

## dbt를 붙이면 모델이 그대로 asset이 된다

dbt를 연동하면 dbt 모델 하나가 Dagster asset 하나로 그대로 올라온다. 모델 간 의존성도 dbt의 `ref()` 관계 그대로 들어온다. 별도로 DAG를 다시 그릴 필요가 없다.

정의한 asset이 어떤 프로그램을 base로 도는지도 직관적으로 확인된다.

![[Pasted image 20260814235621.png]]

dbt docs를 열지 않아도 Dagster UI 안에서 쿼리문과 test 통과 내용을 전부 볼 수 있다.

![[Pasted image 20260814235749.png]]

dbt에서 `group`으로 지정한 모델은 Dagster에서도 그룹으로 묶여서 보인다.

```sql
{{ config(
    materialized='table',
    tags=['증권단위', 'campmonth', '모수테이블']
) }}
```

여기까지 오면 dbt 모델이 업데이트됐을 때 변경된 자산만 골라 재실행하는 게 자연스러워진다. 데이터 품질 이슈가 터졌을 때도 어느 asset에서 깨졌는지 UI에서 바로 짚힌다. dbt 쪽 설정은 [[dbt 실전 기능 5종 정리]]에 정리했다.

## 이어지는 글

- [[Airflow 3와 Dagster 비교]] — 두 도구의 실행 모델 차이
- [[Dagster 파티션키와 스케줄 실전 구성]] — 실제 코드
