@echo off
setlocal
where pwsh >nul 2>nul
if %errorlevel%==0 (
  pwsh -NoProfile -ExecutionPolicy Bypass -File "%~dp0INSTALL-ZEROTOHERO.ps1" %*
) else (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0INSTALL-ZEROTOHERO.ps1" %*
)
if errorlevel 1 (
  echo.
  echo ZeroToHero operation failed. No unsafe fallback was attempted.
  pause
  exit /b 1
)
echo.
echo ZeroToHero operation complete. You can close this window.
pause
