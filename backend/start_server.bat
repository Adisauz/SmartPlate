@echo off
echo Starting Meal Planner Backend Server...
echo.

cd /d "%~dp0"

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Installing/updating dependencies...
pip install -r requirements.txt

echo.
echo Starting server on local network...
python run_server.py

pause


