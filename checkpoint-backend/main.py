from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from deepface import DeepFace
import shutil
import os
import cv2
import numpy as np

app = FastAPI()

# Allow CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

IMG_DB_PATH = "img_db"
os.makedirs(IMG_DB_PATH, exist_ok=True)

import json

# Load student database
STUDENTS_DB_FILE = "students.json"
students_data = []

def load_students():
    global students_data
    if os.path.exists(STUDENTS_DB_FILE):
        with open(STUDENTS_DB_FILE, "r") as f:
            students_data = json.load(f)

load_students()

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Face Recognition Backend", "students_loaded": len(students_data)}

@app.post("/verify")
async def verify_face(file: UploadFile = File(...)):
    try:
        # Save uploaded file temporarily
        temp_filename = f"temp_{file.filename}"
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        print(f"DEBUG: Processing verification request for {file.filename}")
        
        # Perform recognition
        try:
            # Using Google's FaceNet512 model for better accuracy
            dfs = DeepFace.find(
                img_path=temp_filename,
                db_path=IMG_DB_PATH,
                model_name="Facenet512",
                distance_metric="cosine",
                enforce_detection=False,
                silent=True
            )
        except Exception as deepface_err:
            print(f"ERROR: DeepFace.find failed: {str(deepface_err)}")
            raise deepface_err

        # Clean up temp file
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

        if len(dfs) > 0:
            print(f"DEBUG: DeepFace returned {len(dfs)} dataframes")
            if not dfs[0].empty:
                print(f"DEBUG: Best match found: {dfs[0].iloc[0].to_dict()}")
            else:
                print("DEBUG: DataFrame 0 is empty (No match found)")
        else:
            print("DEBUG: DeepFace returned empty list")

        if len(dfs) > 0 and not dfs[0].empty:
            # Match found
            best_match = dfs[0].iloc[0]
            identity_path = best_match['identity']
            filename = os.path.basename(identity_path)
            
            print(f"DEBUG: Extracting filename: {filename}")
            
            # Find student details
            student = next((s for s in students_data if s["image"] == filename), None)
            
            if student:
                print(f"DEBUG: Found student metadata: {student['name']}")
                return {
                    "verified": True,
                    "name": student["name"],
                    "mis": student["mis"],
                    "distance": float(best_match['distance'])
                }
            else:
                print(f"DEBUG: No metadata found for {filename}. Loaded data: {len(students_data)} entries.")
                return {
                    "verified": True,
                    "name": "Unknown",
                    "mis": "N/A",
                    "message": f"Face matched with {filename} but no metadata found."
                }
        else:
            print("DEBUG: Match failed (empty dataframe)")
            return {
                "verified": False,
                "message": "No match found in database"
            }

    except Exception as e:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
        raise HTTPException(status_code=500, detail=str(e))

# ── Real-Time Attendance Tracking ──
from datetime import datetime
from pydantic import BaseModel

attendance_log = []

class AttendanceRecord(BaseModel):
    name: str
    mis: str

@app.post("/attendance")
async def record_attendance(record: AttendanceRecord):
    # Prevent duplicates (same MIS)
    if any(entry["mis"] == record.mis for entry in attendance_log):
        return {"status": "already_recorded", "message": f"{record.name} is already marked present."}
    
    entry = {
        "name": record.name,
        "mis": record.mis,
        "time": datetime.now().strftime("%I:%M:%S %p")
    }
    attendance_log.append(entry)
    print(f"✓ ATTENDANCE: {record.name} (MIS: {record.mis}) marked present")
    return {"status": "recorded", "entry": entry, "total": len(attendance_log)}

@app.get("/attendance")
async def get_attendance():
    return {"students": attendance_log, "total": len(attendance_log)}

@app.delete("/attendance")
async def end_session_attendance():
    """End session: returns final list and clears the log."""
    final_list = list(attendance_log)
    total = len(final_list)
    attendance_log.clear()
    print(f"SESSION ENDED: {total} students were marked present.")
    return {"status": "session_ended", "final_list": final_list, "total": total}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
