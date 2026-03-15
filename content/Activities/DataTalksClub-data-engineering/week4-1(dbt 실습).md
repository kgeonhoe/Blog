---
categories:
  - "[[Courses]]"
platform:
instructor:
url:
created: "2026-03-10"
start:
end:
rating:
topics: []
tags:
  - course
draft: false
---
## 로컬환경에서 dbt 시작하기

```bash
pip install uv

%% 프로젝트 시작 %%
uv init  
uv add duckdb  
uv run duckdb --version

%% dbt-duckdb 설치 %%

uv add dbt-duckdb

%% 설치한 버젼 확인 %%

uv run dbt--version
```

## dbt 프로젝트 시작하기

```bash  
uv run dbt init taxi_rides_ny  
13:07:24 Running with dbt=1.11.4  
13:07:24  
Your new dbt project "taxi_rides_ny" was created!

For more information on how to configure the profiles.yml file,  
please consult the dbt documentation here:

[https://docs.getdbt.com/docs/configure-your-profile](https://docs.getdbt.com/docs/configure-your-profile)

One more thing:

Need help? Don't hesitate to reach out to us via GitHub issues or on Slack:

[https://community.getdbt.com/](https://community.getdbt.com/)

Happy modeling!

13:07:24 Setting up your profile.  
Which database would you like to use?  
[1] duckdb

(Don't see the one you want? [https://docs.getdbt.com/docs/available-adapters)](https://docs.getdbt.com/docs/available-adapters))

%% 프로젝트 시작시 아래와 같이 설치된 db를 고르라고 한다 (프로파일지정) %%  
Enter a number: 1  
```