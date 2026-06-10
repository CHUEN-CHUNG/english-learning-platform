@echo off
setlocal
set PORT=3030
if not "%~1"=="" set PORT=%~1

subst S: /d >nul 2>&1

if not exist "C:\pm-slides\node_modules" (
  echo 首次執行，正在 C:\pm-slides 安裝 Slidev...
  if not exist "C:\pm-slides" mkdir "C:\pm-slides"
  cd /d "C:\pm-slides"
  if not exist package.json (
    echo {"name":"pm-slides","private":true,"devDependencies":{"@slidev/cli":"^52.15.2","@slidev/theme-default":"^0.25.0"}}> package.json
  )
  call npm install
)

copy /Y "%~dp0..\docs\PM_Case_Study_Presentation.slidev.md" "C:\pm-slides\presentation.slidev.md" >nul

echo.
echo Slidev 簡報已同步至 C:\pm-slides\presentation.slidev.md
echo 瀏覽器開啟後請看 http://localhost:%PORT%/
echo.

cd /d "C:\pm-slides"
call npx slidev presentation.slidev.md --open --port %PORT%
