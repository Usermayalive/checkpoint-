import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { tokens } from './theme/designTokens';
import StudentPage from './pages/StudentPage';

const theme = createTheme({
    palette: {
        mode: 'dark',
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
            default: tokens.colors.background.dark,
            paper: tokens.colors.background.glass,
        },
        text: {
            primary: tokens.colors.text.primary,
            secondary: tokens.colors.text.secondary,
        },
        error: { main: tokens.colors.error.main },
        success: { main: tokens.colors.accent.emerald },
    },
    typography: {
        fontFamily: tokens.typography.fontPrimary,
        h1: { fontFamily: tokens.typography.fontDisplay, fontWeight: 900 },
        h2: { fontFamily: tokens.typography.fontDisplay, fontWeight: 800 },
        h3: { fontFamily: tokens.typography.fontDisplay, fontWeight: 700 },
        h4: { fontFamily: tokens.typography.fontDisplay, fontWeight: 700 },
        h5: { fontFamily: tokens.typography.fontDisplay, fontWeight: 700 },
        h6: { fontFamily: tokens.typography.fontDisplay, fontWeight: 700 },
        button: { fontWeight: 800, textTransform: 'none', letterSpacing: '0.05em' },
    },
    shape: { borderRadius: tokens.shapes.borderRadius },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    background: tokens.colors.background.dark,
                    transition: 'background 0.5s ease-in-out'
                }
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 20,
                    padding: '14px 32px',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
                },
                contained: {
                    background: tokens.colors.gradient.primary,
                    color: '#FFFFFF',
                    boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)',
                    '&:hover': {
                        background: tokens.colors.gradient.primary,
                        boxShadow: '0 12px 48px rgba(139, 92, 246, 0.5)',
                        transform: 'translateY(-4px) scale(1.02)',
                    },
                },
                outlined: {
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                        borderColor: tokens.colors.primary.main,
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        transform: 'translateY(-2px)',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    backgroundColor: tokens.colors.background.glass,
                    backdropFilter: 'blur(30px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    borderRadius: 32,
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    background: 'rgba(2, 6, 23, 0.8)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    boxShadow: 'none',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiInputBase-root': {
                        borderRadius: 16,
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        },
                        '&.Mui-focused': {
                            backgroundColor: 'rgba(255, 255, 255, 0.07)',
                            boxShadow: '0 0 0 2px rgba(139, 92, 246, 0.2)',
                        }
                    }
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
                    <Route path="/" element={<StudentPage />} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App;
