@echo off
echo Starting LMS...

start "Backend" cmd /k "cd /d E:\LMS\lms\backend && npm start"
timeout /t 3
start "Frontend" cmd /k "cd /d E:\LMS\lms\frontend && npm run dev"

echo Both servers started!