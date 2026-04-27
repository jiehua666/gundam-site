@echo off
title GUNDAM SITE - Prisma Studio
cd /d "%~dp0.."
echo Starting Prisma Studio on port 5556...
npx prisma studio --browser none --port 5556
