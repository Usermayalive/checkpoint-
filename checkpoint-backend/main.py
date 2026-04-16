from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import cv2
import numpy as np
import json
from dotenv import load_dotenv
from datetime import datetime
from pydantic import BaseModel

# Load environment variables
load_dotenv()

app = FastAPI()

# Global variables for lazy loading
supabase = None
mp_face_mesh = None
face_mesh = None

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
# For landmark distance, smaller is better. Using a default threshold.
# This might need tuning based on the user's registration data.
LANDMARK_THRESHOLD = float(os.getenv("LANDMARK_THRESHOLD", 0.35))

def init_services():
    global supabase, mp_face_mesh, face_mesh
    if supabase is None:
        from supabase import create_client
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        print("✓ Supabase Initialized")
    if mp_face_mesh is None:
        import mediapipe as mp
        mp_face_mesh = mp.solutions.face_mesh
        face_mesh = mp_face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5
        )
        print("✓ MediaPipe FaceMesh Initialized")

@app.on_event("startup")
async def startup_event():
    print("Application starting up...")

@app.get("/health")
def health_check():
    return {"status": "ok", "supabase_url": SUPABASE_URL}

def extract_landmarks(img):
    if img is None:
        return None
    
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(img_rgb)
    
    if not results.multi_face_landmarks:
        return None
    
    landmarks = []
    # Using the first face detected
    for lm in results.multi_face_landmarks[0].landmark:
        landmarks.extend([lm.x, lm.y, lm.z])
    
    return np.array(landmarks)

def normalize_landmarks(landmarks):
    # Ensure landmarks array is not empty and has a length divisible by 3
    if landmarks is None or len(landmarks) == 0 or len(landmarks) % 3 != 0:
        return np.array([]) # Return an empty array or handle error as appropriate

    # Reshape to (N, 3) where N is the number of landmarks
    coords = landmarks.reshape(-1, 3)
    
    # Center landmarks
    center = coords.mean(axis=0)
    coords = coords - center
    
    # Scale landmarks (using mean distance from center as a scale factor)
    # Avoid division by zero if all coordinates are the same (unlikely for face landmarks)
    scale = np.linalg.norm(coords, axis=1).mean()
    if scale == 0:
        return coords.flatten() # Return centered but unscaled if scale is zero
    
    coords = coords / scale
    return coords.flatten()

@app.post("/verify")
def verify_face(file: UploadFile = File(...)):
    init_services()
    try:
        # Process image entirely in memory
        contents = file.file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # 1. Extract and normalize landmarks from the photo
        try:
            query_landmarks = extract_landmarks(img)
            if query_landmarks is None:
                raise ValueError("No face detected in the image")
            
            # Consistently use the first 1404 landmark values (468 landmarks * 3 coordinates)
            query_normalized = normalize_landmarks(query_landmarks[:1404])
            if len(query_normalized) == 0:
                raise ValueError("Could not normalize query landmarks.")

        except Exception as e:
            return {"verified": False, "message": f"MediaPipe error: {str(e)}"}

        # 2. Call the Supabase Match Face RPC function
        # This offloads the distance calculation to the database pgvector extension for massive scalability
        # The query_normalized numpy array must be converted to a normal python float list
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
            best_match = matches[0] # LIMIT 1 ensures there's only 1 best match
            min_distance = best_match.get("dist")
            
            # Convert distance to a similarity percentage for the UI
            similarity = max(0, 100 * (1 - min_distance / LANDMARK_THRESHOLD))
            
            return {
                "verified": True,
                "name": best_match.get("name"),
                "mis": best_match.get("mis"),
                "distance": min_distance,
                "confidence": similarity
            }
            
        return {
            "verified": False, 
            "message": "Face not recognized", 
            "best_distance": None
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AttendanceRecord(BaseModel):
    name: str
    mis: str

@app.post("/attendance")
def record_attendance(record: AttendanceRecord):
    init_services()
    try:
        supabase.table("attendance_logs").insert({
            "student_mis": record.mis, 
            "student_name": record.name
        }).execute()
        return {"status": "recorded"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/attendance")
def get_attendance():
    init_services()
    try:
        # Fetch the most recent attendance logs (could be optimized with a timestamp filter if needed)
        response = supabase.table("attendance_logs").select("student_name, student_mis, timestamp").execute()
        
        # Format the data for the frontend Teacher Dashboard
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
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/attendance")
def clear_attendance():
    init_services()
    try:
        # Fetch the final list before wiping
        response = supabase.table("attendance_logs").select("student_name, student_mis, timestamp").execute()
        
        final_list = []
        for log in response.data:
            final_list.append({
                "name": log.get("student_name"),
                "mis": log.get("student_mis"),
                "time": log.get("timestamp")
            })
            
        # Delete all records to clear the log for the next session
        # Supabase requires a filter to delete, so we use not-null on ID
        supabase.table("attendance_logs").delete().neq("id", 0).execute()
        
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
