@echo off
setlocal

set "SCRIPTS_DIR=%~dp0"

echo Starting Project Life development environment...

start "Project Life Backend" cmd /k call "%SCRIPTS_DIR%backend.bat"
start "Project Life Frontend" cmd /k call "%SCRIPTS_DIR%frontend.bat"

endlocal