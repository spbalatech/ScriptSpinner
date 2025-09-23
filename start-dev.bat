@echo off
echo Starting The 60-Second Script Spinner...
echo.

echo [1/2] Starting FastAPI Backend...
start "Backend Server" cmd /k "cd backend && python main.py"

timeout /t 3 /nobreak > nul

echo [2/2] Starting Next.js Frontend...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ✅ Both servers are starting!
echo.
echo 🔗 Frontend: http://localhost:3000
echo 🔗 Backend API: http://localhost:8000
echo.
echo Press any key to close this window...
pause > nul
