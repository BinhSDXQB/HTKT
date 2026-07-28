@echo off
cd /d C:\Troly\HTKT\app
set NODE_ENV=production
set PORT=3001
node node_modules/.bin/next start
