@echo off

REM BACKEND SERVISI
start cmd /k "cd /d backend\src\post-service && node server.js"
start cmd /k "cd /d backend\src\notification-service && node server.js"
start cmd /k "cd /d backend\src\comment-service && node server.js"
start cmd /k "cd /d backend && node server.js"

REM FRONTEND
start cmd /k "cd /d frontend && npm run dev"

exit