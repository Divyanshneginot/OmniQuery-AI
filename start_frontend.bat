@echo off
title OmniQuery AI - Frontend Dashboard
echo ====================================================
echo Starting OmniQuery AI Dashboard (React + Vite)
echo URL: http://localhost:5173
echo ====================================================
cd /d "%~dp0\frontend"
npm run dev -- --host
pause
