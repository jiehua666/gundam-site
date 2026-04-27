@echo off
title GUNDAM SITE - Service Starter
cd /d "%~dp0.."

echo ================================================
echo   GUNDAM SITE - Service Starter
echo ================================================
echo.
echo   Starting all services:
echo   - Next.js (http://localhost:3000)
echo   - Prisma Studio (http://localhost:5556)
echo.
echo ================================================

:: Countdown 5 seconds
echo.
echo 5 seconds until all services start...
timeout /t 5 /nobreak > NUL

echo.
echo [1/2] Starting Next.js service...
start "GUNDAM SITE - Next.js" cmd /k "cd /d "%~dp0.." && npm run dev"

timeout /t 2 /nobreak > NUL

echo [2/2] Starting Prisma Studio...
start "GUNDAM SITE - Prisma" cmd /k "cd /d "%~dp0.." && npx prisma studio --browser none --port 5556"

echo.
echo ================================================
echo   All services started!
echo ================================================
echo   - Next.js: http://localhost:3000
echo   - Prisma Studio: http://localhost:5556
echo ================================================

timeout /t 2 /nobreak > NUL
exit