@echo off
setlocal
title Push Local Buddy to GitHub
echo ================================================================
echo       PUSH LOCAL BUDDY TO GITHUB (GitHub Pages / Vercel)
echo ================================================================
echo.
cd /d "%~dp0"

set DEFAULT_REPO=https://github.com/Prince789-student/local-buddy.git
set /p REPO_URL="Enter GitHub Repository URL [Press ENTER for %DEFAULT_REPO%]: "
if "%REPO_URL%"=="" set REPO_URL=%DEFAULT_REPO%

echo [*] Setting remote origin to %REPO_URL%...
git remote remove origin 2>nul
git remote add origin %REPO_URL%

echo [*] Pushing branch 'main' to GitHub...
git branch -M main
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================================
    echo [SUCCESS] Code successfully pushed to GitHub!
    echo ================================================================
    echo 1. GitHub Pages: Go to Repo Settings -^> Pages -^> Branch: main -^> Save
    echo 2. Vercel: Import repo at https://vercel.com/new and click Deploy!
    echo ================================================================
) else (
    echo.
    echo [!] Push failed. Please verify the URL and your GitHub login credentials.
)

pause
