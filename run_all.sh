#!/bin/bash

# Clean up any leftover processes on ports 8000, 3000, 3001
echo "Stopping any existing processes on ports 8000, 3000, 3001..."
lsof -ti :8000 | xargs kill -9 2>/dev/null || true
lsof -ti :3000 | xargs kill -9 2>/dev/null || true
lsof -ti :3001 | xargs kill -9 2>/dev/null || true

# Trap CTRL+C to terminate all background jobs cleanly
trap 'kill $(jobs -p) 2>/dev/null; exit' SIGINT SIGTERM EXIT

echo "1/3 Starting FastAPI Backend (Port 8000)..."
(cd checkpoint-backend && source venv/bin/activate && python main.py) &

sleep 2

echo "2/3 Starting Student Check-In App (Port 3000)..."
(cd checkpoint-student && npm start) &

sleep 2

echo "3/3 Starting Teacher Admin Console (Port 3001)..."
(cd checkpoint-teacher && npm start) &

echo ""
echo "========================================================"
echo "  🚀 CHECKPOINT ATTENDANCE SYSTEM READY"
echo "========================================================"
echo "  📱 Student Portal:  http://localhost:3000"
echo "  🎓 Teacher Console: http://localhost:3001"
echo "  ⚡ Backend API:     http://localhost:8000"
echo "========================================================"
echo "Press CTRL+C anytime to stop all servers."
echo ""

wait
