import { db } from './firebase';
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    onSnapshot,
    query,
    where,
    serverTimestamp,
    getDocs,
    limit
} from 'firebase/firestore';

export const attendanceService = {
    // Create a new session
    async createSession(teacherId, courseName, classroomId) {
        const sessionCode = Math.floor(1000 + Math.random() * 9000).toString();
        const docRef = await addDoc(collection(db, "sessions"), {
            teacherId,
            courseName,
            classroomId, // Added classroom ID (maps to Beacon Minor ID)
            code: sessionCode,
            status: "active",
            createdAt: serverTimestamp()
        });
        return { id: docRef.id, code: sessionCode };
    },

    // End a session
    async endSession(sessionId) {
        const sessionRef = doc(db, "sessions", sessionId);
        await updateDoc(sessionRef, {
            status: "inactive",
            endedAt: serverTimestamp()
        });
    },

    // Subscribe to live attendance for a session
    subscribeToAttendance(sessionId, callback) {
        const q = query(collection(db, "attendance"), where("sessionId", "==", sessionId));
        return onSnapshot(q, (snapshot) => {
            const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(students);
        });
    },

    // Student marks attendance
    async markAttendance(sessionId, studentData) {
        await addDoc(collection(db, "attendance"), {
            sessionId,
            ...studentData,
            timestamp: serverTimestamp()
        });
    },

    // Verify session code and get session ID
    async verifyFace(imageBlob) {
        const formData = new FormData();
        formData.append('file', imageBlob, 'capture.jpg');

        try {
            const response = await fetch('http://localhost:8000/verify', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Face verification error:", error);
            return { verified: false, error: error.message };
        }
    },

    async verifySession(code) {
        const q = query(
            collection(db, "sessions"),
            where("code", "==", code),
            where("status", "==", "active"),
            limit(1)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    },

    // Get past sessions for a teacher
    async getSessions(teacherId) {
        const q = query(
            collection(db, "sessions"),
            where("teacherId", "==", teacherId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // ── Real-Time Attendance (Backend) ──

    // Post a verified student to the attendance log
    async postAttendance(name, mis) {
        try {
            const response = await fetch('http://localhost:8000/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, mis })
            });
            return await response.json();
        } catch (error) {
            console.error("Post attendance error:", error);
            return { status: "error", message: error.message };
        }
    },

    // Get live attendance list from backend
    async getAttendanceList() {
        try {
            const response = await fetch('http://localhost:8000/attendance');
            return await response.json();
        } catch (error) {
            console.error("Get attendance error:", error);
            return { students: [], total: 0 };
        }
    },

    // End session: returns final list and clears the log
    async clearAttendance() {
        try {
            const response = await fetch('http://localhost:8000/attendance', {
                method: 'DELETE'
            });
            return await response.json();
        } catch (error) {
            console.error("Clear attendance error:", error);
            return { status: "error", final_list: [], total: 0 };
        }
    }
};
