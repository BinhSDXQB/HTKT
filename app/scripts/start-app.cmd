@echo off
REM Wrapper script to run Next.js production server safely
REM Bypasses npm.cmd syntax issues with PM2

setlocal enabledelayedexpansion

cd /d "%~dp0\.."

REM Set environment
set NODE_ENV=production
set PORT=3001

REM Run Next.js directly
call node_modules\.bin\next start -p 3001

endlocal
