@echo off
setlocal

REM Корень проекта: папка на уровень выше scripts
set "PROJECT_ROOT=%~dp0.."
set "FRONTEND=%PROJECT_ROOT%\frontend"

cd /d "%FRONTEND%"

echo Starting React frontend...
npm run dev

endlocal