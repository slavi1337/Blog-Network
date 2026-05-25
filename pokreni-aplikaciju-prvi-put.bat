@echo off

REM BACKEND SERVISI
start cmd /k "cd /d backend\src\post-service && npm install && node server.js"
start cmd /k "cd /d backend\src\notification-service && npm install && node server.js"
start cmd /k "cd /d backend\src\comment-service && npm install && node server.js"
start cmd /k "cd /d backend && npm install && node server.js"

REM FRONTEND
start cmd /k "cd /d frontend && npm install && npm run dev"

exit