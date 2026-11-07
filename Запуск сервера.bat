```bat
@echo off
title English Platform - Local Server
cd /d "%~dp0"

echo =====================================
echo       ENGLISH PLATFORM
echo =====================================
echo.
echo Starting local server...
echo.

start "" http://localhost:3000

call npm run dev

echo.
echo Server stopped.
pause
```