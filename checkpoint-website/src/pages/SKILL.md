---
name: Application Pages
description: Top-level route pages for the Checkpoint application
---

# Application Pages

This directory contains the main page components corresponding to application routes.

## Pages

### `LandingPage.jsx`
- **Route**: `/`
- **Purpose**: Hero landing page introducing the system.
- **Features**:
  - Animated sphere backgrounds.
  - Navigation cards to Teacher (`/teacher`) and Student (`/student`) portals.
  - Key metrics display.

### `TeacherPage.jsx`
- **Route**: `/teacher`
- **Purpose**: Wrapper layout for the Teacher portal.
- **Components**:
  - `AppBar`: Persistent top navigation with "CheckPoint Admin Console" branding.
  - `TeacherDashboard`: The main functional component.
- **Styling**: Light theme with subtle background spheres.

### `StudentPage.jsx`
- **Route**: `/student`
- **Purpose**: Wrapper layout for the Student portal.
- **Components**:
  - `AppBar`: Student-specific branding ("Encrypt Session").
  - `StudentCheckIn`: The multi-step verification process.

## Usage
- Pages are composed of `AppBar` + `Container` wrapping a main feature component.
- All pages share the global background styles defined in `index.css`.
