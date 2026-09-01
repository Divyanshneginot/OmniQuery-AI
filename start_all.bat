@echo off
title OmniQuery AI - Full Stack Launcher
echo ====================================================
echo Launching OmniQuery AI Full Stack Application...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo ====================================================
start cmd /k "%~dp0start_backend.bat"
start cmd /k "%~dp0start_frontend.bat"
echo Both services launched in separate windows!
