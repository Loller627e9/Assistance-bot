#!/bin/bash

# Dank Memer Bot Startup Script

echo "🤖 Starting Dank Memer Bot..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if config exists
if [ ! -f "config.json" ]; then
    echo "⚙️ Config file not found. It will be created on first run."
fi

# Start the bot
echo "🚀 Launching bot..."
node index.js