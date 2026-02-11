# Checkpoint: Real-Time Face Recognition Attendance System

Checkpoint is a full-stack solution designed for automated attendance tracking using real-time face recognition. It combines a high-performance FastAPI backend with a dynamic React frontend.

## 🚀 Key Features
- **Real-Time Recognition**: Instant identification using DeepFace (backend) and face-api.js (frontend).
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

## ⚙️ Setup Instructions

### 1. Backend Setup
```bash
cd checkpoint-backend
# Install dependencies
pip install -r requirements.txt
# Run the server
python main.py
```
The backend will run on `http://localhost:8000`.

### 2. Frontend Setup
```bash
cd checkpoint-website
# Install dependencies
npm install
# Start the development server
npm start
```
The frontend will run on `http://localhost:3000`.

## 🔒 Security
- **API Keys**: Uses environment-based configuration (refer to `.env` setup guide).
- **Privacy**: Face data is processed locally/privately depending on deployment strategy.

## 📁 Project Structure
```text
checkpoint/
├── checkpoint-backend/    # FastAPI server & face recognition logic
├── checkpoint-website/    # React frontend & UI components
└── README.md              # Project documentation
```

---
*Created with ❤️ for smarter attendance tracking.*
