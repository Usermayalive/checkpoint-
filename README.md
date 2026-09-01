# Checkpoint: Real-Time Face Recognition Attendance System

Checkpoint is a full-stack solution designed for automated attendance tracking using real-time face recognition. It combines a high-performance FastAPI backend with a dynamic React frontend.

## 🚀 Key Features
- **Real-Time Recognition**: Instant identification using DeepFace (backend) and face-api.js (frontend).
- **BLE Beacon Proximity**: Secure proximity verification using Bluetooth Low Energy (Web Bluetooth API) to ensure users are physically present in the classroom.
- **Attendance Logging**: Automated presence marking with duplicate prevention.
- **Biometric Database**: Easy management of student face data and metadata.
- **Responsive UI**: Modern dashboard built with Material UI for teachers and students.

## 🛠 Tech Stack

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **AI/Vision**: [DeepFace](https://github.com/serengil/deepface), OpenCV
- **Server**: Uvicorn

### Frontend
- **Framework**: [React](https://reactjs.org/)
- **UI Library**: Material UI (MUI)
- **Browser AI**: face-api.js, MediaPipe
- **Bluetooth**: Web Bluetooth API for BLE Beacon integration

## ⚙️ How to Run the Applications

### 1. Backend Server (Port 8000)
```bash
cd checkpoint-backend
source venv/bin/activate
python main.py
```
> Running on `http://localhost:8000` (Health Check: `/health`, Verification: `/verify`, Attendance: `/attendance`)

---

### 2. Student Application (Port 3000)
```bash
cd checkpoint-student
npm start
```
> Running on `http://localhost:3000` (BLE Proximity Lock + Liveness Face Verification + Instant 1-Click Scan)

---

### 3. Teacher Dashboard (Port 3001)
```bash
cd checkpoint-teacher
npm start
```
> Running on `http://localhost:3001` (4-Digit Code Session Generator + Live Attendance Real-Time Stream + Export)

---

## 📁 Project Structure
```text
checkpoint/
├── checkpoint-backend/    # FastAPI AI Biometric Server & Supabase pgvector engine
├── checkpoint-student/    # Dedicated Student Check-In Web & Mobile App (Port 3000)
├── checkpoint-teacher/    # Dedicated Teacher Admin Console & Session Manager (Port 3001)
└── README.md              # Project Documentation
```

---
*Created with ❤️ for smarter attendance tracking.*
