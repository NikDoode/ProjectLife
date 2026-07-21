@echo off
setlocal

REM Корень проекта: папка на уровень выше scripts
set "PROJECT_ROOT=%~dp0.."
set "BACKEND=%PROJECT_ROOT%\backend"

cd /d "%BACKEND%"

echo Starting FastAPI backend...
python -m uvicorn app.main:app --reload

endlocal