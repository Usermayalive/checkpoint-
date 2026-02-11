# Checkpoint: Production Setup Guide

To transition from the **Demo Environment** (which uses mock credentials) to a **Live Production Environment**, you will need to provide the following inputs and configurations.

## 1. Firebase Configuration
You need to create a project in the [Firebase Console](https://console.firebase.google.com/) and register a Web App.

### Where to get it:
1. Go to **Project Settings** (the gear icon next to "Project Overview").
2. Scroll down to **Your apps**.
3. Select the **Web app** (looks like `</>`).
4. Copy the `firebaseConfig` object.

### Where to put it:
Update the file [firebase.js](file:///Users/manasvyas/Desktop/checkpoint/checkpoint-website/src/services/firebase.js) with your real values:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

---

## 2. Firestore Database Setup
Checkpoint uses **Cloud Firestore** to store session data and attendance records.

1. In the Firebase Console, go to **Build** -> **Firestore Database**.
2. Click **Create Database**.
3. Start in **Test Mode** (for the hackathon) or set up the following rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /sessions/{sessionId} {
      allow read, write: if true; // Restrict this for production
      match /attendance/{studentId} {
        allow read, write: if true;
      }
    }
  }
}
```

---

## 3. Face API Model Weights
The "AI Biometric Lock" requires neural network weights to run in the browser.

### Where to get them:
You can download the weights from the official [face-api.js repo](https://github.com/vladmandic/face-api/tree/master/model).

### Where to put them:
Download the following files and place them in `public/models/`:
- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model-shard1`
- `face_landmark_68_model-weights_manifest.json`
- `face_landmark_68_model-shard1`
- `face_recognition_model-weights_manifest.json`
- `face_recognition_model-shard1`

---

## 4. Bluetooth & Security Requirements
To use the **BLE Radar** (Proximity Check), the following conditions must be met:
- **Browser**: Use the latest version of **Chrome** or **Edge**.
- **Secure Context**: The app must be running on `localhost` or served over `HTTPS`.
- **Hardware**: Your device must have Bluetooth enabled.
