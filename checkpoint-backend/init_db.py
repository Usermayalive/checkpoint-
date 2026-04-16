import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("SUPABASE_DB_URL")
if "[YOUR-PASSWORD]" in DB_URL:
    print("ERROR: Please replace [YOUR-PASSWORD] in the .env file with your actual Supabase database password.")
    exit(1)

# SQLAlchemy requires the dialect to be postgresql, not just postgres
if DB_URL.startswith("postgres://"):
    DB_URL = DB_URL.replace("postgres://", "postgresql://", 1)

try:
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        print("Connected to Supabase successfully!")
        
        # Enable pgvector extension
        print("Enabling pgvector extension...")
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        
        # Create students table
        print("Creating students table...")
        conn.execute(text('''
            CREATE TABLE IF NOT EXISTS students (
                id SERIAL PRIMARY KEY,
                student_id VARCHAR(50) UNIQUE NOT NULL, -- To store the 'id' from JSON
                name VARCHAR(255) NOT NULL,
                mis VARCHAR(50) UNIQUE NOT NULL,
                image_filename VARCHAR(255),
                face_encoding vector(1404),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        '''))
        
        # Create attendance logs table
        print("Creating attendance_logs table...")
        conn.execute(text('''
            CREATE TABLE IF NOT EXISTS attendance_logs (
                id SERIAL PRIMARY KEY,
                mis VARCHAR(50) REFERENCES students(mis),
                name VARCHAR(255) NOT NULL,
                time VARCHAR(50) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        '''))
        
        # Create an index for faster similarity search
        print("Creating vector index...")
        conn.execute(text('''
            CREATE INDEX ON students USING hnsw (face_encoding vector_cosine_ops)
        '''))
        
        conn.commit()
        print("Database schema initialized successfully!")
        
except Exception as e:
    print(f"Error initializing database: {e}")
