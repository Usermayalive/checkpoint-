#!/bin/bash

# Define paths
BASE_DIR="/Users/manasvyas/Desktop/checkpoint"
SRC_DIR="$BASE_DIR/checkpoint-website/src"
TEACHER_DIR="$BASE_DIR/checkpoint-teacher/src"
STUDENT_DIR="$BASE_DIR/checkpoint-student/src"

echo "🚀 Starting Checkpoint App Split Process..."

# 1. Create Directory Structures
echo "📁 Creating directories..."
mkdir -p "$TEACHER_DIR/theme" "$TEACHER_DIR/services" "$TEACHER_DIR/components" "$TEACHER_DIR/pages"
mkdir -p "$STUDENT_DIR/theme" "$STUDENT_DIR/services" "$STUDENT_DIR/components" "$STUDENT_DIR/pages"

# 2. Copy Shared Assets
echo "🎨 Copying shared assets (theme, services, css)..."
cp -r "$SRC_DIR/theme/"* "$TEACHER_DIR/theme/" 2>/dev/null
cp -r "$SRC_DIR/theme/"* "$STUDENT_DIR/theme/" 2>/dev/null

cp -r "$SRC_DIR/services/"* "$TEACHER_DIR/services/" 2>/dev/null
cp -r "$SRC_DIR/services/"* "$STUDENT_DIR/services/" 2>/dev/null

cp "$SRC_DIR/index.css" "$TEACHER_DIR/"
cp "$SRC_DIR/index.css" "$STUDENT_DIR/"

# 3. Copy Teacher-Specific Components
echo "🧑‍🏫 Copying Teacher components..."
cp "$SRC_DIR/components/TeacherDashboard.jsx" "$TEACHER_DIR/components/"
cp "$SRC_DIR/components/SessionCard.jsx" "$TEACHER_DIR/components/"
cp "$SRC_DIR/components/StatisticsCard.jsx" "$TEACHER_DIR/components/"
cp "$SRC_DIR/components/StudentList.jsx" "$TEACHER_DIR/components/"

# 4. Copy Student-Specific Components
echo "🎓 Copying Student components..."
cp "$SRC_DIR/components/StudentCheckIn.jsx" "$STUDENT_DIR/components/"
cp "$SRC_DIR/components/FaceRecognition.jsx" "$STUDENT_DIR/components/"
cp "$SRC_DIR/components/BLEManager.jsx" "$STUDENT_DIR/components/"

echo "✅ File migration complete!"
echo "Next steps:"
echo "1. Run 'npm install' in checkpoint-teacher"
echo "2. Run 'npm install' in checkpoint-student"
