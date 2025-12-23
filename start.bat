@echo off
echo ========================================
echo AI Interview Hackathon - Setup and Run
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 18 or higher
    pause
    exit /b 1
)

echo [1/6] Checking Python virtual environment...
if not exist ".venv" (
    echo Creating Python virtual environment...
    python -m venv .venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment
        pause
        exit /b 1
    )
    echo Virtual environment created successfully!
) else (
    echo Virtual environment already exists.
)

echo.
echo [2/6] Installing backend dependencies...
call .venv\Scripts\activate.bat
pip install -r backend\requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)
echo Backend dependencies installed successfully!

echo.
echo [3/6] Installing frontend dependencies...
cd frontend
if not exist "node_modules" (
    echo Installing npm packages...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install frontend dependencies
        cd ..
        pause
        exit /b 1
    )
    echo Frontend dependencies installed successfully!
) else (
    echo Frontend dependencies already installed.
)
cd ..

echo.
echo [4/6] Checking environment variables...
if not exist ".env" (
    echo WARNING: .env file not found!
    echo Please create a .env file with required configuration.
    pause
)

echo.
echo [5/6] Starting backend server...
start "AI Interview Backend" cmd /k "cd /d "%~dp0" && call .venv\Scripts\activate.bat && cd backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo.
echo [6/6] Starting frontend server...
start "AI Interview Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Backend running at: http://localhost:8000
echo Frontend running at: http://localhost:3000
echo.
echo NOTE: Use localhost for camera/mic permissions.
echo       Mixed content issues are avoided by using HTTP.
echo   Check the frontend terminal for your actual IP addresses!
echo   You can click on the displayed URLs directly.
echo.
echo NOTE: Browser will show certificate warning!
echo   Click "Advanced" then "Proceed to localhost"
echo   Camera/mic permissions will now work on network!
echo.
echo Close the server windows to stop.
echo.
pause
