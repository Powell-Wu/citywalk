@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
if errorlevel 1 goto failed
node scripts/publish.mjs
if errorlevel 1 goto failed
echo.
pause
exit /b 0
:failed
echo.
echo Publish did not complete. See the error above.
pause
exit /b 1
