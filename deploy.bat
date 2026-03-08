@echo off
setlocal
chcp 65001 >nul

REM Run from this script's directory so it works on any machine/path.
pushd "%~dp0"

if not exist ".git" (
    echo [ERROR] quartz Git repository not found in this folder.
    echo deploy.bat must be inside the quartz repository root.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Gray's DataHub - Blog Deploy
echo ========================================
echo.

set /p MSG="커밋 메시지: "

if "%MSG%"=="" (
    echo 커밋 메시지를 입력해주세요.
    pause
    exit /b 1
)

echo.
echo [1/3] 변경사항 스테이징...
git add -A

echo [2/3] 커밋 중...
git commit -m "%MSG%"
if errorlevel 1 (
    echo.
    echo 커밋할 변경사항이 없거나 커밋에 실패했습니다.
    pause
    exit /b 1
)

echo [3/3] GitHub에 푸시 중...
git push origin v4
if errorlevel 1 (
    echo.
    echo 푸시에 실패했습니다. 네트워크/권한을 확인해주세요.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   배포 요청 완료! GitHub Actions가 자동 빌드합니다.
echo   https://kgeonhoe.github.io/Blog
echo ========================================
echo.
pause
