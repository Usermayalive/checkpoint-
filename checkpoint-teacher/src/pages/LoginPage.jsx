import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Button,
    Paper,
    Stack,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    Google as GoogleIcon,
    Shield as ShieldIcon,
    VerifiedUser as VerifiedIcon
} from '@mui/icons-material';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';

const LoginPage = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError('');
        try {
            await signInWithPopup(auth, googleProvider);
            navigate('/');
        } catch (err) {
            console.error("Login error:", err);
            setError(err.message || 'Failed to sign in. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #F8FAFF 0%, #EDE9FE 40%, #E0F2FE 100%)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Decorations */}
            <Box className="sphere sphere-primary" sx={{ top: '-10%', left: '-10%', opacity: 0.15, position: 'absolute', width: 400, height: 400, borderRadius: '50%', bgcolor: '#7C3AED', filter: 'blur(60px)', zIndex: 0 }} />
            <Box className="sphere sphere-secondary" sx={{ bottom: '-10%', right: '-10%', opacity: 0.1, position: 'absolute', width: 350, height: 350, borderRadius: '50%', bgcolor: '#0EA5E9', filter: 'blur(60px)', zIndex: 0 }} />

            <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
                <Paper className="glass-card border-light animate-fade-in" sx={{
                    p: 6,
                    borderRadius: 8,
                    textAlign: 'center',
                    bgcolor: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                }}>
                    <Stack spacing={4} alignItems="center">
                        {/* Logo / Icon */}
                        <Box sx={{
                            width: 80,
                            height: 80,
                            borderRadius: 4,
                            background: 'linear-gradient(135deg, #7C3AED, #0EA5E9)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 8px 16px rgba(124, 58, 237, 0.3)',
                            mb: 1
                        }}>
                            <ShieldIcon sx={{ fontSize: 40, color: '#fff' }} />
                        </Box>

                        <Box>
                            <Typography variant="h4" className="outfit" sx={{ fontWeight: 900, letterSpacing: -1, color: '#1E293B', mb: 1 }}>
                                CHECKPOINT
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
                                Admin Console Access
                            </Typography>
                        </Box>

                        <Typography variant="body1" sx={{ color: '#475569', mb: 2 }}>
                            Securely manage attendance and class sessions with biometric verification.
                        </Typography>

                        {error && (
                            <Alert severity="error" sx={{ width: '100%', borderRadius: 3, fontWeight: 600 }}>
                                {error}
                            </Alert>
                        )}

                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            disabled={loading}
                            onClick={handleGoogleSignIn}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <GoogleIcon />}
                            sx={{
                                py: 2,
                                borderRadius: 4,
                                textTransform: 'none',
                                fontSize: '1.1rem',
                                fontWeight: 800,
                                background: '#fff',
                                color: '#444',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                '&:hover': {
                                    background: '#f8f8f8',
                                    boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
                                    transform: 'translateY(-1px)'
                                },
                            }}
                        >
                            {loading ? 'Authenticating...' : 'Sign in with Google'}
                        </Button>

                        <Button
                            variant="outlined"
                            fullWidth
                            size="large"
                            onClick={() => {
                                localStorage.setItem('teacher_demo_user', 'true');
                                window.location.href = '/';
                            }}
                            sx={{
                                py: 1.5,
                                borderRadius: 4,
                                textTransform: 'none',
                                fontWeight: 800,
                                borderColor: 'rgba(124, 58, 237, 0.4)',
                                color: '#7C3AED',
                                '&:hover': {
                                    borderColor: '#7C3AED',
                                    bgcolor: 'rgba(124, 58, 237, 0.05)'
                                }
                            }}
                        >
                            ⚡ Quick Teacher Access (Direct Login)
                        </Button>

                        <Stack direction="row" spacing={1} alignItems="center" sx={{ opacity: 0.6 }}>
                            <VerifiedIcon sx={{ fontSize: 16, color: '#10B981' }} />
                            <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
                                ENTERPRISE GRADE SECURITY
                            </Typography>
                        </Stack>
                    </Stack>
                </Paper>
            </Container>

            <style>
                {`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards;
                }
                `}
            </style>
        </Box>
    );
};

export default LoginPage;
