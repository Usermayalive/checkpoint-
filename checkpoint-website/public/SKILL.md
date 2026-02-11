---
name: Public Assets
description: Static assets and HTML entry point
---

# Public Assets

This directory contains static files served directly by the web server.

## Files

### `index.html`
- **Purpose**: The single HTML page for the React app.
- **Includes**:
  - Google Fonts links (`Inter`, `Outfit`).
  - Meta tags for viewport/theme.

### Assets
- `favicon.ico`: Browser tab icon.
- `logo192.png`, `logo512.png`: PWA icons.
- `manifest.json`: Web App Manifest for PWA installation.
- `robots.txt`: Search engine instructions.

### `models/` (Directory)
- **Content**: Likely contains ML models or assets for `FaceRecognition` (optional/legacy, as MediaPipe loads from CDN currently).
