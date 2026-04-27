@echo off
title GUNDAM SITE - Stop All Services
cd /d "%~dp0.."

echo ================================================
echo  GUNDAM SITE - Stop All Services
echo ================================================
echo.

echo Stopping all Node.js services...
taskkill /F /IM node.exe /T 2>nul

echo.
echo All services stopped.
pause
