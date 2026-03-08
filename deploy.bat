@echo off
setlocal EnableExtensions

REM Always run in this script directory.
pushd "%~dp0" || (
    echo [ERROR] Failed to enter script directory.
    pause
    exit /b 1
)

REM Verify current folder is a git work tree.
set "IS_GIT="
for /f %%G in ('git rev-parse --is-inside-work-tree 2^>nul') do set "IS_GIT=%%G"
if /i not "%IS_GIT%"=="true" (
    echo [ERROR] Quartz git repository not found here.
    echo Place deploy.bat in the Quartz repository root.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Gray's DataHub - Blog Deploy
echo ========================================
echo.

set /p "MSG=Commit message: "

if not defined MSG (
    echo Please enter a commit message.
    pause
    exit /b 1
)

echo.
echo [1/3] Staging changes...
git add -A

echo [2/3] Creating commit...
git commit -m "%MSG%"
if errorlevel 1 (
    echo.
    echo Commit failed or there is nothing to commit.
    pause
    exit /b 1
)

echo [3/3] Pushing to GitHub...
git push origin v4
if errorlevel 1 (
    echo.
    echo Push failed. Check network and repository permissions.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Deploy request completed. GitHub Actions will build automatically.
echo   https://kgeonhoe.github.io/Blog
echo ========================================
echo.
pause
