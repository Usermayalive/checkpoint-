import os
import cv2
import numpy as np
import mediapipe as mp
from supabase import create_client
from dotenv import load_dotenv

load_dotenv("/Users/manasvyas/Desktop/checkpoint/checkpoint-backend/.env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

IMAGE_PATH = "/Users/manasvyas/.gemini/antigravity-ide/brain/b69cdcdb-8208-4a30-96f5-08cf3a744d06/.user_uploaded/media_1788276969269.jpg"
NAME = "Manas Vyas"
MIS = "112415100"  # Dedicated MIS for Manas

def extract_landmarks(img):
    mp_face_mesh = mp.solutions.face_mesh
    face_mesh = mp_face_mesh.FaceMesh(
        static_image_mode=True,
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5
    )
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(img_rgb)
    if not results.multi_face_landmarks:
        return None
    landmarks = []
    for lm in results.multi_face_landmarks[0].landmark:
        landmarks.extend([lm.x, lm.y, lm.z])
    return np.array(landmarks)

def normalize_landmarks(landmarks):
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

def main():
    print(f"Reading image: {IMAGE_PATH}")
    img = cv2.imread(IMAGE_PATH)
    if img is None:
        print("Failed to read image")
        return

    print("Extracting face mesh landmarks for Manas...")
    raw_landmarks = extract_landmarks(img)
    if raw_landmarks is None:
        print("No face detected in image!")
        return

    normalized = normalize_landmarks(raw_landmarks[:1404])
    print(f"Extracted {len(normalized)} normalized landmark coordinates.")

    embedding_list = normalized.tolist()

    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    existing = supabase.table("students").select("id, name, mis").eq("name", "Manas Vyas").execute()
    if existing.data and len(existing.data) > 0:
        res = supabase.table("students").update({
            "name": NAME,
            "mis": MIS,
            "face_encoding": str(embedding_list)
        }).eq("name", "Manas Vyas").execute()
        print(f"Updated Manas: {res.data}")
    else:
        # Also check by MIS
        existing_mis = supabase.table("students").select("id, name, mis").eq("mis", MIS).execute()
        if existing_mis.data:
            res = supabase.table("students").update({
                "name": NAME,
                "face_encoding": str(embedding_list)
            }).eq("mis", MIS).execute()
            print(f"Updated by MIS: {res.data}")
        else:
            res = supabase.table("students").insert({
                "name": NAME,
                "mis": MIS,
                "face_encoding": str(embedding_list)
            }).execute()
            print(f"Inserted Manas: {res.data}")

    # List all students
    all_students = supabase.table("students").select("id, name, mis").execute()
    print("\n--- All Students in Supabase ---")
    for s in all_students.data:
        print(f"• {s.get('name')} (MIS: {s.get('mis')})")

if __name__ == "__main__":
    main()
