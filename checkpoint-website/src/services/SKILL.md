---
name: Services & API
description: Core logic and data services for Checkpoint
---

# Services

This directory contains the business logic and API communication layers.

## Files

### `attendanceService.js` (implied)
- **Purpose**: Handles session management and attendance tracking.
- **Key Methods**:
  - `createSession(teacherId, courseName, classroomId)`: Starts a new attendance session.
  - `endSession(sessionId)`: Closes an active session.
  - `verifySession(code)`: Checks if a session code is valid.
  - `markAttendance(sessionId, studentData)`: Records a student's presence.
  - `subscribeToAttendance(sessionId, callback)`: Real-time listener for student check-ins.

### `firebase.js`
- **Purpose**: Firebase configuration and initialization (likely Auth, Firestore).

## Data Flow
- The frontend components (`TeacherDashboard`, `StudentCheckIn`) call these service methods to interact with the backend (or mock backend).
- `attendanceService` abstracts the direct database calls.
