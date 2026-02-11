import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import TeacherPage from './pages/TeacherPage';
import LandingPage from './pages/LandingPage';
import StudentPage from './pages/StudentPage';

import { tokens } from './theme/designTokens';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: tokens.colors.primary.main,
      light: tokens.colors.primary.light,
      dark: tokens.colors.primary.dark,
    },
    secondary: {
      main: tokens.colors.secondary.main,
      light: tokens.colors.secondary.light,
    },
    background: {
      default: 'transparent',
      paper: tokens.colors.background.glass,
    },
    text: {
      primary: tokens.colors.text.primary,
      secondary: tokens.colors.text.secondary,
    },
    error: {
      main: tokens.colors.error.main,
    },
    success: {
      main: tokens.colors.accent.emerald,
    }
  },
  typography: {
    fontFamily: tokens.typography.fontPrimary,
    h1: { fontFamily: tokens.typography.fontDisplay, fontWeight: 900 },
    h2: { fontFamily: tokens.typography.fontDisplay, fontWeight: 800 },
    h3: { fontFamily: tokens.typography.fontDisplay, fontWeight: 700 },
    h4: { fontFamily: tokens.typography.fontDisplay, fontWeight: 700 },
    h5: { fontFamily: tokens.typography.fontDisplay, fontWeight: 700 },
    h6: { fontFamily: tokens.typography.fontDisplay, fontWeight: 700 },
    button: { fontWeight: 700, textTransform: 'none', letterSpacing: '0.02em' },
  },
  shape: {
    borderRadius: tokens.shapes.borderRadius,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'transparent',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          padding: '12px 28px',
          fontWeight: 800,
          letterSpacing: '0.03em',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        },
        contained: {
          background: tokens.colors.gradient.primary,
          color: '#FFFFFF',
          boxShadow: tokens.shadows.button,
          '&:hover': {
            background: tokens.colors.gradient.primary,
            boxShadow: tokens.shadows.buttonHover,
            transform: 'translateY(-2px)',
          },
        },
        outlined: {
          borderColor: 'rgba(0,0,0,0.12)',
          color: tokens.colors.text.primary,
          '&:hover': {
            borderColor: tokens.colors.primary.main,
            backgroundColor: tokens.colors.primary.subtle,
          }
        }
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: tokens.colors.background.glass,
          backdropFilter: 'blur(20px) saturate(180%)',
          border: tokens.shapes.glassBorder,
          boxShadow: tokens.shadows.card,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 1px 12px rgba(0,0,0,0.04)',
          color: tokens.colors.text.primary,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 800,
          letterSpacing: '0.03em',
        }
      }
    }
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/teacher" element={<TeacherPage />} />
          <Route path="/student" element={<StudentPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;