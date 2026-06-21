---
title: "시놀로지 MinIO 구성 완료 문서"
categories:
  - "[[Projects]]"
  - "[[stock-platform]]"
tags:
  - stock-platform
  - minio
  - setup
  - infrastructure
  - synology
draft: false
created: "2026-06-21"
updated: "2026-06-21"
---
# 시놀로지 MinIO 구성 완료 문서

> **하네스엔지니어링 - stock-platform 프로젝트**  
> **작성일**: 2026-05-26  
> **MinIO 버전**: quay.io/minio/minio:latest

---

## 📋 목차

1. [구성 요약](#구성-요약)
2. [시놀로지 SSH 접근](#시놀로지-ssh-접근)
3. [Docker 권한 설정](#docker-권한-설정)
4. [MinIO 이미지 선택](#minio-이미지-선택)
5. [MinIO 컨테이너 구성](#minio-컨테이너-구성)
6. [접속 정보](#접속-정보)
7. [볼륨 관리](#볼륨-관리)
8. [문제 해결](#문제-해결)

---

## 🎯 구성 요약

### 최종 구성 정보

| 항목 | 값 |
|------|-----|
| **컨테이너 이름** | `minio-new` |
| **Docker 이미지** | `quay.io/minio/minio:latest` |
| **API 포트** | 9010 (호스트) → 9000 (컨테이너) |
| **Console 포트** | 9011 (호스트) → 9001 (컨테이너) |
| **볼륨** | Docker 자동 관리 볼륨 (`minio-new-data`) |
| **Root 사용자** | `minio` |
| **Root 비밀번호** | `miniominio` |
| **재시작 정책** | `always` |

### 네트워크 접속

- **API 엔드포인트**: `http://192.168.219.111:9010`
- **Web Console**: `http://192.168.219.111:9011`

---

## 🔐 시놀로지 SSH 접근

### SSH 활성화 (최초 1회)

1. **DSM 웹 UI 접속**
   ```
   http://192.168.219.111:5000
   ```

2. **제어판 → 터미널 및 SNMP**
   - "SSH 서비스 활성화" 체크
   - 포트: `2323` (커스텀 포트)
   - 적용

### SSH 접속 명령어

**Windows (PowerShell/CMD):**
```powershell
ssh -p 2323 admin@192.168.219.111
```

**Mac/Linux:**
```bash
ssh -p 2323 admin@192.168.219.111
```

**접속 정보:**
- **호스트**: 192.168.219.111
- **포트**: 2323
- **사용자**: admin
- **비밀번호**: (시놀로지 admin 계정 비밀번호)

---

## 🐳 Docker 권한 설정

### 권한 문제 이해

시놀로지에서 Docker 명령어는 기본적으로 root 권한 필요:

```bash
# 권한 없이 실행 시 오류
$ docker ps
Got permission denied while trying to connect to the Docker daemon socket
```

### 해결 방법 1: sudo 사용 (사용한 방법)

모든 docker 명령어 앞에 `sudo` 추가:

```bash
sudo docker ps
sudo docker images
sudo docker run ...
```

### 해결 방법 2: docker 그룹 추가 (영구적)

```bash
# admin 사용자를 docker 그룹에 추가
sudo synogroup --add docker admin

# 로그아웃 후 재로그인 필요
exit
ssh -p 2323 admin@192.168.219.111

# 이후 sudo 없이 사용 가능
docker ps
```

### 현재 사용자 그룹 확인

```bash
groups
# 출력에 'docker'가 있으면 권한 있음
```

---

## 📦 MinIO 이미지 선택

### Docker Hub 지원 중단 문제

**이슈:**
- `minio/minio:latest` (Docker Hub) → 2023년 이후 업데이트 중단
- 보안 패치 누락, CVE 취약점 존재 가능

### 선택한 해결책

**quay.io/minio/minio:latest** (MinIO 공식 레지스트리)

**이유:**
1. ✅ MinIO Inc. 공식 지원
2. ✅ 최신 보안 패치 적용
3. ✅ 지속적인 업데이트
4. ✅ AGPLv3 라이선스 (개인/내부 사용 문제 없음)

### 대안 이미지

| 이미지 | 설명 | 사용 권장 |
|--------|------|----------|
| `quay.io/minio/minio:latest` | 공식 (선택) | ⭐⭐⭐⭐⭐ |
| `pgsty/minio:latest` | 커뮤니티 포크 | ⭐⭐⭐ |
| `minio/minio:latest` | 구 Docker Hub (비권장) | ❌ |

---

## 🚀 MinIO 컨테이너 구성

### 1단계: 이미지 다운로드

```bash
sudo docker pull quay.io/minio/minio:latest
```

**다운로드 확인:**
```bash
sudo docker images | grep minio
```

**예상 출력:**
```
REPOSITORY                TAG       IMAGE ID       CREATED        SIZE
quay.io/minio/minio      latest    abc123def456   2 days ago     278MB
```

### 2단계: 기존 컨테이너 처리 (선택)

기존 `minio-1` 컨테이너를 중지 (삭제 안함, 백업용):

```bash
# 현재 실행 중인 MinIO 확인
sudo docker ps | grep minio

# 중지 (데이터는 유지됨)
sudo docker stop minio-1
```

### 3단계: 새 MinIO 컨테이너 실행

**최종 명령어:**

```bash
sudo docker run -d \
  --name minio-new \
  --restart=always \
  -p 9010:9000 \
  -p 9011:9001 \
  -e MINIO_ROOT_USER=minio \
  -e MINIO_ROOT_PASSWORD=miniominio \
  -v minio-new-data:/data \
  quay.io/minio/minio:latest \
  server /data --console-address ":9001"
```

**명령어 상세 설명:**

| 옵션 | 값 | 설명 |
|------|-----|------|
| `-d` | - | 백그라운드 실행 (detached) |
| `--name` | `minio-new` | 컨테이너 이름 |
| `--restart` | `always` | 시놀로지 재부팅 시 자동 시작 |
| `-p` | `9010:9000` | API 포트 매핑 (호스트:컨테이너) |
| `-p` | `9011:9001` | Console 포트 매핑 |
| `-e MINIO_ROOT_USER` | `minio` | 관리자 계정 이름 |
| `-e MINIO_ROOT_PASSWORD` | `miniominio` | 관리자 비밀번호 |
| `-v` | `minio-new-data:/data` | Docker 자동 볼륨 사용 |
| 이미지 | `quay.io/minio/minio:latest` | 사용할 이미지 |
| 명령 | `server /data --console-address ":9001"` | MinIO 서버 시작 |

### 4단계: 컨테이너 실행 확인

```bash
# 실행 중인 컨테이너 확인
sudo docker ps | grep minio-new
```

**예상 출력:**
```
minio-new   quay.io/minio/minio:latest   Up 30 seconds   0.0.0.0:9010->9000/tcp, 0.0.0.0:9011->9001/tcp
```

### 5단계: 로그 확인

```bash
sudo docker logs minio-new
```

**정상 실행 시 출력:**
```
MinIO Object Storage Server
Copyright: 2015-2024 MinIO, Inc.
License: GNU AGPLv3 - https://www.gnu.org/licenses/agpl-3.0.html
Version: RELEASE.2024-XX-XX

API: http://0.0.0.0:9000
Console: http://0.0.0.0:9001

Documentation: https://min.io/docs
```

---

## 🌐 접속 정보

### Web Console 접속

**URL:**
```
http://192.168.219.111:9011
```

**로그인:**
- **Username**: `minio`
- **Password**: `miniominio`

### API 엔드포인트 (stock-platform 연결용)

**stock-platform .env 파일 설정:**

```env
# MinIO (Synology NAS)
MINIO_ENDPOINT=192.168.219.111:9010
MINIO_ACCESS_KEY=minio
MINIO_SECRET_KEY=miniominio
MINIO_BUCKET=stock-data
MINIO_SECURE=false
```

---

## 💾 볼륨 관리

### Docker 자동 볼륨 사용

**선택 이유:**
- ✅ 경로 문제 없음 (Docker가 자동 관리)
- ✅ 권한 문제 없음
- ✅ 간단한 설정

**볼륨 이름:** `minio-new-data`

### 볼륨 정보 확인

```bash
# 모든 볼륨 목록
sudo docker volume ls

# 특정 볼륨 상세 정보
sudo docker volume inspect minio-new-data
```

**예상 출력:**
```json
[
    {
        "CreatedAt": "2026-05-26T23:10:00+09:00",
        "Driver": "local",
        "Mountpoint": "/volume1/@docker/volumes/minio-new-data/_data",
        "Name": "minio-new-data"
    }
]
```

### 실제 데이터 위치

```bash
# 볼륨 실제 경로 (시놀로지)
ls -la /volume1/@docker/volumes/minio-new-data/_data
```

### 볼륨 백업

```bash
# 볼륨 데이터를 tar로 백업
sudo docker run --rm \
  -v minio-new-data:/data \
  -v /volume1/backup:/backup \
  alpine tar czf /backup/minio-backup-$(date +%Y%m%d).tar.gz -C /data .
```

---

## 🛠️ 관리 명령어

### 컨테이너 관리

```bash
# 컨테이너 시작
sudo docker start minio-new

# 컨테이너 중지
sudo docker stop minio-new

# 컨테이너 재시작
sudo docker restart minio-new

# 컨테이너 삭제 (볼륨은 유지됨)
sudo docker rm minio-new

# 컨테이너 상태 확인
sudo docker ps -a | grep minio-new
```

### 로그 확인

```bash
# 전체 로그
sudo docker logs minio-new

# 최근 20줄
sudo docker logs minio-new --tail 20

# 실시간 로그 (Ctrl+C로 종료)
sudo docker logs -f minio-new
```

### 컨테이너 내부 접속

```bash
# bash 쉘 접속
sudo docker exec -it minio-new /bin/bash

# 또는 sh
sudo docker exec -it minio-new /bin/sh
```

---

## 🔧 문제 해결

### 컨테이너가 시작되지 않음

**증상:**
```bash
sudo docker ps -a | grep minio-new
# Status: Exited (1) 2 seconds ago
```

**해결:**
```bash
# 로그 확인
sudo docker logs minio-new

# 컨테이너 제거 후 재생성
sudo docker rm minio-new
# (docker run 명령어 다시 실행)
```

### 포트 충돌

**증상:**
```
Error: port is already allocated
```

**해결:**
```bash
# 포트 사용 확인
sudo netstat -tlnp | grep 9010
sudo netstat -tlnp | grep 9011

# 다른 포트 사용 또는 충돌 프로세스 종료
```

### Console 접속 안됨

**체크리스트:**
1. 컨테이너 실행 확인: `sudo docker ps | grep minio-new`
2. 로그 확인: `sudo docker logs minio-new`
3. 시놀로지 방화벽 확인: DSM → 제어판 → 보안
4. 브라우저 캐시 삭제 후 재시도

### 권한 오류

**증상:**
```
permission denied while trying to connect to the Docker daemon
```

**해결:**
```bash
# 모든 명령어에 sudo 추가
sudo docker ...

# 또는 docker 그룹 추가
sudo synogroup --add docker admin
exit
# 재로그인
```

---

## 📊 DSM Container Manager 확인

### GUI에서 확인 방법

1. **DSM 접속**: http://192.168.219.111:5000
2. **Container Manager** 앱 실행
3. **컨테이너 탭**:
   - `minio-new` 컨테이너 표시
   - 상태: "실행 중" (Running)
   - 이미지: `quay.io/minio/minio:latest`
4. **네트워크 탭**: 포트 9010, 9011 확인
5. **볼륨 탭**: `minio-new-data` 볼륨 확인

---

## ✅ 구성 완료 체크리스트

- [x] SSH 접속 가능 (포트 2323)
- [x] Docker 권한 설정 (sudo 사용)
- [x] MinIO 공식 이미지 다운로드 (quay.io)
- [x] 기존 MinIO 중지 (백업용 보존)
- [x] 새 MinIO 컨테이너 실행
- [x] 컨테이너 상태 확인 (Up)
- [x] Web Console 접속 가능 (9011)
- [x] 로그인 성공 (minio / miniominio)
- [x] DSM Container Manager에서 확인

---

## 📝 다음 단계

MinIO 구성 완료 후 진행할 작업:

1. **stock-platform .env 파일 생성**
   - MinIO 접속 정보 입력
   
2. **MinIO 버킷 생성**
   - `stock-data` 버킷 생성
   - Python 스크립트: `setup_minio_buckets.py`

3. **DuckDB 초기화**
   - 스키마 생성
   - Python 스크립트: `init_duckdb.py`

4. **Kafka Consumer 구현**
   - DuckDB Consumer
   - Redis Consumer

5. **Docker 스택 빌드 및 실행**
   - stock-platform 전체 스택 기동

---

## 🔗 관련 문서

- **전체 계획**: `plan.md`
- **시스템 아키텍처**: `ARCHITECTURE.md`
- **아키텍처 결정 기록**: `architecture-decisions.md`
- **Docker 권한 문제**: `synology-docker-permission-fix.md`

---

## 📌 중요 정보 요약

```yaml
# 시놀로지 MinIO 구성 정보

시놀로지:
  IP: 192.168.219.111
  SSH_PORT: 2323
  DSM_PORT: 5000

MinIO_컨테이너:
  이름: minio-new
  이미지: quay.io/minio/minio:latest
  API_포트: 9010
  Console_포트: 9011
  볼륨: minio-new-data (Docker 자동 관리)
  
MinIO_계정:
  사용자: minio
  비밀번호: miniominio
  
접속:
  Web_Console: http://192.168.219.111:9011
  API_Endpoint: http://192.168.219.111:9010
  
stock-platform_연동:
  MINIO_ENDPOINT: 192.168.219.111:9010
  MINIO_ACCESS_KEY: minio
  MINIO_SECRET_KEY: miniominio
```

---

*하네스엔지니어링 - 모든 발걸음을 기록합니다*  
*최종 업데이트: 2026-05-26 23:21*
