import psycopg2
import urllib.parse
import os

# Password contains special characters, needs to be url-encoded
password = urllib.parse.quote_plus("Mukeshvyas@5959")
DB_URL = f"postgresql://postgres:{password}@db.nuinqqvffatkgwilnbwu.supabase.co:5432/postgres"

def setup_database():
    try:
        print("Connecting to Supabase...")
        conn = psycopg2.connect(DB_URL)
        conn.autocommit = True
        cursor = conn.cursor()

        print("Enabling pgvector extension...")
        cursor.execute("CREATE EXTENSION IF NOT EXISTS vector;")

        print("Creating students table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS students (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                mis VARCHAR(50) UNIQUE NOT NULL,
                face_encoding vector(1404),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)

        print("Creating attendance_logs table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS attendance_logs (
                id SERIAL PRIMARY KEY,
                student_mis VARCHAR(50) REFERENCES students(mis),
                student_name VARCHAR(255) NOT NULL,
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(50) DEFAULT 'present'
            );
        """)

        print("Database setup complete!")
        cursor.close()
        conn.close()

    except Exception as e:
        print(f"Error setting up database: {e}")

if __name__ == "__main__":
    setup_database()
