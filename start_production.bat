@echo off
echo =====================================================================
echo  The Sampling Lab -- Unified Production Server
echo =====================================================================
echo Serving both React Frontend and FastAPI Backend on:
echo   - Local browser : http://localhost:8000
echo   - REST API Docs : http://localhost:8000/docs
echo   - Network IP    : http://0.0.0.0:8000
echo =====================================================================
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
