@echo off
echo =====================================================================
echo  The Sampling Lab -- Text Generation Parameter Explorer
echo =====================================================================
echo Starting FastAPI backend on http://127.0.0.1:8000 ...
start "Sampling Lab Backend" cmd /k "python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

echo Starting Vite React frontend on http://localhost:5173 ...
cd frontend
start "Sampling Lab Frontend" cmd /k "npm.cmd run dev"

echo.
echo Both servers are launching!
echo App UI: http://localhost:5173
echo API Docs: http://127.0.0.1:8000/docs
echo =====================================================================
