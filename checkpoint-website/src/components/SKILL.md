---
name: UI Components
description: Reusable UI components for the Checkpoint attendance system
---

# UI Components

This directory contains the core React components used in the application.

## Key Components

### `BLEManager.jsx`
- **Purpose**: Handles Bluetooth Low Energy scanning and beacon detection.
- **Props**:
  - `onBeaconFound`: Callback function when correct beacon is detected.
  - `requiredClassroom`: (Optional) ID of expected beacon for location verification.
- **Features**: Simulation mode for demo purposes, visual radar UI.

### `FaceRecognition.jsx`
- **Purpose**: Biometric verification using MediaPipe Face Landmarker.
- **Props**:
  - `onVerificationComplete`: Callback function when liveness check passes.
- **Features**: Liveness detection (blink counting), face mesh visualization, webcam feed.

### `StudentCheckIn.jsx`
- **Purpose**: Main student workflow container.
- **Flow**:
  1. **Protocol Access**: Session code entry.
  2. **Proximity Check**: BLE scanning via `BLEManager`.
  3. **Biometric Verify**: Face liveness check via `FaceRecognition`.

### `TeacherDashboard.jsx`
- **Purpose**: Admin interface for teachers.
- **Features**:
  - Session creation/termination.
  - Live QR code generation.
  - Real-time attendance log.
  - Security threat monitoring (mock data).
  - Export to CSV.

## Usage Guidelines
- All components use `MUI` (Material UI) for base styling but rely on `designTokens` via `src/theme` for the consistent design system.
- Components support **light mode** primarily (as of latest update).
- Use `glass-card` CSS class for the signature glassmorphism look.
