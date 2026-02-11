---
name: Design System & Tokens
description: Centralized design system configuration for the Checkpoint UI
---

# Theme & Design Tokens

This directory contains the definitions for the application's visual system.

## Files

### `designTokens.js`
- **Purpose**: Single source of truth for colors, typography, shapes, shadows, and animations.
- **Key Exports**:
  - `tokens`: object containing token categories (`colors`, `typography`, etc.).

## Usage
- Import `tokens` in any component to access style variables:
  ```javascript
  import { tokens } from '../theme/designTokens';
  
  // Example usage
  color: tokens.colors.primary.main
  ```
- **Light Theme**: The token set is configured for a light, vibrant theme with:
  - White/Pastel backgrounds.
  - Purple (`#7C3AED`) as Primary.
  - Cyan (`#0EA5E9`) as Secondary.
  - Extensive use of gradients (`utils.gradient`).

## MUI Integration
The base `MUI` theme configuration in `App.js` consumes these tokens. Direct usage is preferred for custom components.
