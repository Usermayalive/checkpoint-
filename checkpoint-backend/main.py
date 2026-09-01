from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from contextlib import asynccontextmanager
import os
import sys
import json
import sqlite3
import cv2
import numpy as np
from dotenv import load_dotenv
from datetime import datetime, timezone
from pydantic import BaseModel

# Ensure base directory is recognized
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

# Global state
supabase = None
is_supabase_active = False
mp_face_mesh = None
face_mesh = None
registered_students = []

DB_PATH = os.path.join(BASE_DIR, "checkpoint.db")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
LANDMARK_THRESHOLD = float(os.getenv("LANDMARK_THRESHOLD", "0.55"))

# API Key for protecting mutating endpoints
API_KEY = os.getenv("API_KEY", "")

# Allowed frontend origins
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "https://trackpoint-production-d41f.up.railway.app",
]
extra_origins = os.getenv("ALLOWED_ORIGINS", "")
if extra_origins:
    ALLOWED_ORIGINS.extend([o.strip() for o in extra_origins.split(",") if o.strip()])


def init_sqlite():
    """Initializes local SQLite database for attendance records."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS attendance_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_mis TEXT NOT NULL,
            student_name TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


def extract_landmarks(img):
    """Extracts MediaPipe face mesh landmarks (468 points * 3 = 1404 coords)."""
    global face_mesh
    if img is None or face_mesh is None:
        return None
    
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(img_rgb)
    
    if not results.multi_face_landmarks:
        return None
    
    landmarks = []
    for lm in results.multi_face_landmarks[0].landmark:
        landmarks.extend([lm.x, lm.y, lm.z])
    
    return np.array(landmarks)


def normalize_landmarks(landmarks):
    """Normalizes landmarks to be center-aligned and scale-invariant."""
    if landmarks is None or len(landmarks) == 0 or len(landmarks) % 3 != 0:
        return np.array([])

    coords = landmarks.reshape(-1, 3)
    center = coords.mean(axis=0)
    coords = coords - center
    
    scale = np.linalg.norm(coords, axis=1).mean()
    if scale == 0:
        return coords.flatten()
    
    coords = coords / scale
    return coords.flatten()


def sync_supabase_students():
    """Checks and syncs student records directly from Supabase database."""
    global registered_students
    if is_supabase_active and supabase:
        try:
            res = supabase.table("students").select("id, name, mis").execute()
            count = len(res.data) if res.data else 0
            print(f"✓ Supabase Biometric Database: {count} registered students ready for direct matching.")
            if res.data:
                for s in res.data:
                    print(f"  • Student: {s.get('name')} (MIS: {s.get('mis')})")
        except Exception as e:
            print(f"⚠ Supabase students query warning: {e}")


def init_services():
    """Initializes ML models and connects directly to Supabase for dynamic face matching."""
    global supabase, is_supabase_active, mp_face_mesh, face_mesh
    
    # 1. Initialize SQLite (for fallback logging)
    init_sqlite()

    # 2. Initialize MediaPipe FaceMesh
    if face_mesh is None:
        try:
            import mediapipe as mp
            if hasattr(mp, "solutions") and hasattr(mp.solutions, "face_mesh"):
                mp_face_mesh = mp.solutions.face_mesh
                face_mesh = mp_face_mesh.FaceMesh(
                    static_image_mode=True,
                    max_num_faces=1,
                    refine_landmarks=True,
                    min_detection_confidence=0.5
                )
                print("✓ MediaPipe FaceMesh Initialized")
            else:
                print("⚠ MediaPipe solutions not directly accessible")
        except Exception as e:
            print(f"❌ MediaPipe initialization error: {e}")

    # 3. Connect to Supabase
    if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY and not is_supabase_active:
        try:
            from supabase import create_client
            client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
            client.table("attendance_logs").select("id").limit(1).execute()
            supabase = client
            is_supabase_active = True
            print("✓ Connected to Supabase (Cloud Mode active)")
            sync_supabase_students()
        except Exception as e:
            supabase = None
            is_supabase_active = False
            print(f"ℹ Supabase unavailable ({e}). Running in Local Mode.")
    else:
        is_supabase_active = False
        print("ℹ Running in Local Mode.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan handler to initialize services cleanly on startup."""
    print("Application starting up...")
    init_services()
    yield
    print("Application shutting down...")


app = FastAPI(lifespan=lifespan, title="Checkpoint Attendance Backend")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for easy local testing across devices
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Key security scheme
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: str = Security(api_key_header)):
    """Dependency that verifies the X-API-Key header on protected endpoints.
    If API_KEY env var is not set, auth is disabled (development mode)."""
    if not API_KEY:
        return True
    if api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid or missing API key")
    return True


@app.get("/")
def root():
    return {
        "message": "Checkpoint Biometric Attendance Backend API",
        "status": "online",
        "mode": "supabase" if is_supabase_active else "local",
        "documentation": "/docs",
        "endpoints": {
            "health": "/health",
            "verify_face": "POST /verify",
            "attendance": "/attendance"
        },
        "frontend_apps": {
            "student_portal": "http://localhost:3000",
            "teacher_console": "http://localhost:3001"
        }
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "mode": "supabase" if is_supabase_active else "local",
        "registered_students": len(registered_students),
        "threshold": LANDMARK_THRESHOLD
    }


@app.post("/verify")
def verify_face(file: UploadFile = File(...)):
    try:
        # Process image in memory
        contents = file.file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return {"verified": False, "message": "Failed to decode image"}

        # 1. Extract and normalize landmarks from the submitted photo
        try:
            query_landmarks = extract_landmarks(img)
            if query_landmarks is None:
                return {"verified": False, "message": "No face detected in the image"}

            query_normalized = normalize_landmarks(query_landmarks[:1404])
            if len(query_normalized) == 0:
                return {"verified": False, "message": "Could not normalize query landmarks"}

        except Exception as e:
            return {"verified": False, "message": f"Landmark processing error: {str(e)}"}

        # 2. Match face against registered database
        if is_supabase_active and supabase:
            try:
                query_list = query_normalized.tolist()
                response = supabase.rpc(
                    'match_face',
                    {
                        'query_embedding': query_list,
                        'match_threshold': LANDMARK_THRESHOLD
                    }
                ).execute()

                matches = response.data
                if matches and len(matches) > 0:
                    best_match = matches[0]
                    min_distance = float(best_match.get("dist", 1.0))
                    similarity = max(0.0, round(100.0 * (1.0 - min_distance / LANDMARK_THRESHOLD), 1))

                    return {
                        "verified": True,
                        "name": best_match.get("name"),
                        "mis": best_match.get("mis"),
                        "distance": min_distance,
                        "confidence": similarity
                    }
            except Exception as e:
                print(f"Supabase RPC match failed ({e}), falling back to local matching...")

        # Local Euclidean Matching
        if not registered_students:
            return {"verified": False, "message": "No registered students in database"}

        best_match = None
        min_distance = float("inf")

        for item in registered_students:
            dist = float(np.linalg.norm(query_normalized - item["embedding"]))
            if dist < min_distance:
                min_distance = dist
                best_match = item

        if best_match and min_distance <= LANDMARK_THRESHOLD:
            similarity = max(0.0, round(100.0 * (1.0 - min_distance / LANDMARK_THRESHOLD), 1))
            return {
                "verified": True,
                "name": best_match["name"],
                "mis": best_match["mis"],
                "distance": round(min_distance, 4),
                "confidence": similarity
            }
        else:
            return {
                "verified": False,
                "message": "Face not recognized",
                "best_distance": round(min_distance, 4) if best_match else None
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class AttendanceRecord(BaseModel):
    name: str
    mis: str


@app.post("/attendance")
def record_attendance(record: AttendanceRecord, _auth: bool = Depends(verify_api_key)):
    try:
        today_iso_prefix = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        if is_supabase_active and supabase:
            try:
                today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
                existing = supabase.table("attendance_logs") \
                    .select("id") \
                    .eq("student_mis", record.mis) \
                    .gte("timestamp", today_start) \
                    .execute()

                if existing.data and len(existing.data) > 0:
                    return {"status": "duplicate", "message": f"{record.name} already marked present today"}

                supabase.table("attendance_logs").insert({
                    "student_mis": record.mis,
                    "student_name": record.name
                }).execute()
                return {"status": "recorded"}
            except Exception as e:
                print(f"Supabase insert failed ({e}), logging to local SQLite...")

        # Local SQLite Storage
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id FROM attendance_logs WHERE student_mis = ? AND timestamp LIKE ?",
            (record.mis, f"{today_iso_prefix}%")
        )
        row = cursor.fetchone()
        if row:
            conn.close()
            return {"status": "duplicate", "message": f"{record.name} already marked present today"}

        now_iso = datetime.now(timezone.utc).isoformat()
        cursor.execute(
            "INSERT INTO attendance_logs (student_mis, student_name, timestamp) VALUES (?, ?, ?)",
            (record.mis, record.name, now_iso)
        )
        conn.commit()
        conn.close()
        return {"status": "recorded"}

    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/attendance")
def get_attendance():
    try:
        if is_supabase_active and supabase:
            try:
                response = supabase.table("attendance_logs").select("student_name, student_mis, timestamp").execute()
                formatted_students = []
                for log in response.data:
                    formatted_students.append({
                        "name": log.get("student_name"),
                        "mis": log.get("student_mis"),
                        "time": log.get("timestamp")
                    })
                return {
                    "students": formatted_students,
                    "total": len(formatted_students)
                }
            except Exception as e:
                print(f"Supabase read failed ({e}), reading from local SQLite...")

        # Local SQLite Read
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT student_name, student_mis, timestamp FROM attendance_logs ORDER BY id ASC")
        rows = cursor.fetchall()
        conn.close()

        formatted_students = [
            {"name": r[0], "mis": r[1], "time": r[2]}
            for r in rows
        ]
        return {
            "students": formatted_students,
            "total": len(formatted_students)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/attendance")
def clear_attendance(_auth: bool = Depends(verify_api_key)):
    try:
        if is_supabase_active and supabase:
            try:
                response = supabase.table("attendance_logs").select("student_name, student_mis, timestamp").execute()
                final_list = [
                    {"name": log.get("student_name"), "mis": log.get("student_mis"), "time": log.get("timestamp")}
                    for log in response.data
                ]
                supabase.table("attendance_logs").delete().neq("id", 0).execute()
                return {
                    "status": "success",
                    "final_list": final_list,
                    "total": len(final_list)
                }
            except Exception as e:
                print(f"Supabase delete failed ({e}), clearing local SQLite...")

        # Local SQLite Clear
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT student_name, student_mis, timestamp FROM attendance_logs ORDER BY id ASC")
        rows = cursor.fetchall()
        final_list = [
            {"name": r[0], "mis": r[1], "time": r[2]}
            for r in rows
        ]
        cursor.execute("DELETE FROM attendance_logs")
        conn.commit()
        conn.close()

        return {
            "status": "success",
            "final_list": final_list,
            "total": len(final_list)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
