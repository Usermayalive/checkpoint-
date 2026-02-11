---
name: Mock Data
description: Static data for demo purposes
---

# Mock Data

This directory contains static JavaScript objects used to simulate backend responses and populate UI for demonstration.

## Files

### `demoData.js`
- **Content**:
  - `demoBeacons`: Array of beacon objects (`minor`, `classroom`, `proximityId`). Used by `BLEManager` (simulation) and `TeacherDashboard` (classroom selection).

### `students.js`
- **Content**:
  - `demoStudents`: Array of student objects (`id`, `name`, `mis`, `photo`).
  - Used by `StudentCheckIn` to simulate a verified user.
  - Used by `TeacherDashboard` to map incoming attendance IDs to student profiles.

## Usage
- Import directly into components when `demoMode` is active or as placeholders before backend integration.
