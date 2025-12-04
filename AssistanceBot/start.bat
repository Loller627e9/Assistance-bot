@echo off
title Dank Memer Bot

echo 🤖 Starting Dank Memer Bot...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16 or higher.
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Check if config exists
if not exist "config.json" (
    echo ⚙️ Config file not found. It will be created on first run.
)

REM Start the bot
echo 🚀 Launching bot...
node index.js

pause