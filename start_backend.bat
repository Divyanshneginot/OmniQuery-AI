@echo off
title OmniQuery AI - Backend Service
echo ====================================================
echo Starting OmniQuery AI Backend (FastAPI + ClickHouse)
echo URL: http://localhost:8000
echo Docs: http://localhost:8000/docs
echo ====================================================
cd /d "%~dp0\backend"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
