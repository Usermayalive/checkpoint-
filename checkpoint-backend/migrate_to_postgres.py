import json
import os
import pickle
import urllib.parse
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Database configuration — password URL-encoded to handle special characters
password = urllib.parse.quote_plus("Mukeshvyas@5959")
# Supabase connection pooler (Transaction mode, port 6543)
# Username format for pooler must be: postgres.PROJECT_REF
DB_URL = f"postgresql://postgres.nuinqqvffatkgwilnbwu:{password}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"

engine = create_engine(DB_URL, connect_args={"sslmode": "require"})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

STUDENTS_JSON = "students.json"
PKL_FILE = "img_db/ds_model_facenet512_detector_opencv_aligned_normalization_base_expand_0.pkl"

def load_cached_embeddings():
    """Load the pre-computed Facenet512 embeddings from DeepFace's pkl cache."""
    if not os.path.exists(PKL_FILE):
        print(f"Error: Cache file not found at {PKL_FILE}")
        return {}
    with open(PKL_FILE, "rb") as f:
        cache_data = pickle.load(f)
    # Build a lookup dict: filename -> embedding
    embedding_map = {}
    for entry in cache_data:
        identity = entry.get("identity", "")
        filename = os.path.basename(identity)
        embedding_map[filename] = entry.get("embedding", [])
    print(f"Loaded {len(embedding_map)} embeddings from cache: {list(embedding_map.keys())}")
    return embedding_map

def migrate_data():
    if not os.path.exists(STUDENTS_JSON):
        print(f"Error: {STUDENTS_JSON} not found. Run from the backend directory.")
        return

    with open(STUDENTS_JSON, "r") as f:
        students = json.load(f)

    embedding_map = load_cached_embeddings()
    if not embedding_map:
        return

    db = SessionLocal()
    migrated = 0
    skipped = 0
    try:
        for student in students:
            name = student.get("name")
            mis = student.get("mis")
            image_filename = student.get("image")

            if not name or not mis or not image_filename:
                print(f"Skipping invalid entry: {student}")
                continue

            # Check if student already in DB
            existing = db.execute(
                text("SELECT id FROM students WHERE mis = :mis"), {"mis": mis}
            ).fetchone()
            if existing:
                print(f"Skipping {name} ({mis}): already in database.")
                skipped += 1
                continue

            # Get the embedding from cache
            embedding = embedding_map.get(image_filename)
            if not embedding:
                print(f"Skipping {name}: no cached embedding found for '{image_filename}'")
                skipped += 1
                continue

            # pgvector expects a string like '[1.1, 2.2, ...]'
            embedding_str = str(embedding)

            db.execute(text("""
                INSERT INTO students (name, mis, face_encoding)
                VALUES (:name, :mis, :face_encoding)
            """), {"name": name, "mis": mis, "face_encoding": embedding_str})
            db.commit()
            print(f"✓ Migrated: {name} ({mis})")
            migrated += 1

        print(f"\nMigration done! Migrated: {migrated}, Skipped: {skipped}")

    except Exception as e:
        print(f"Database error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_data()
