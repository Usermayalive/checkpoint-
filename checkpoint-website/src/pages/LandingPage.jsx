import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Typography, Box, Stack, Grid, Button } from '@mui/material';
import { School, Person, ChevronRight, Security, AutoAwesome, Verified } from '@mui/icons-material';

const LandingPage = () => {
    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            py: 8,
        }}>
            {/* Background elements */}
            <div className="hero-glow" />
            <div className="sphere sphere-primary animate-float" style={{ top: '-10%', left: '-5%', opacity: 0.4 }} />
            <div className="sphere sphere-secondary animate-float" style={{ bottom: '-10%', right: '-5%', opacity: 0.3, animationDelay: '-2s' }} />
            <div className="sphere sphere-pink animate-float" style={{ top: '40%', right: '10%', opacity: 0.2, animationDelay: '-4s' }} />

            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
                {/* Hero Section */}
                <Box sx={{ textAlign: 'center', mb: { xs: 8, md: 12 } }}>
                    <Box sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 1.5,
                        px: 3,
                        py: 1,
                        mb: 4,
                        borderRadius: 10,
                        bgcolor: 'rgba(124, 58, 237, 0.08)',
                        border: '1px solid rgba(124, 58, 237, 0.15)',
                        backdropFilter: 'blur(10px)',
                    }} className="border-light animate-fade-in">
                        <AutoAwesome sx={{ fontSize: 16, color: 'var(--primary)' }} />
                        <Typography variant="caption" sx={{ color: 'var(--primary)', fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                            Biometric Security Protocol
                        </Typography>
                    </Box>

                    <Typography variant="h1" className="gradient-text-vibrant outfit animate-fade-in" sx={{
                        fontSize: { xs: '3.5rem', sm: '5rem', md: '7.5rem' },
                        fontWeight: 900,
                        lineHeight: 0.9,
                        mb: 3,
                    }}>
                        CHECKPOINT
                    </Typography>

                    <Typography variant="h5" sx={{
                        color: 'var(--text-secondary)',
                        fontWeight: 500,
                        maxWidth: 700,
                        mx: 'auto',
                        mb: 6,
                        px: 2,
                        lineHeight: 1.6,
                        fontSize: { xs: '1rem', md: '1.25rem' }
                    }} className="animate-fade-in">
                        A decentralized attendance infrastructure powered by
                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}> BLE Proximity </span>
                        and
                        <span style={{ color: 'var(--secondary)', fontWeight: 700 }}> Biometric Liveness </span> detection.
                    </Typography>
                </Box>

                {/* Main Action Cards */}
                <Grid container spacing={4} justifyContent="center" className="animate-fade-in">
                    <Grid item xs={12} md={5}>
                        <Box
                            component={Link}
                            to="/teacher"
                            className="glass-card border-light"
                            sx={{
                                p: 6,
                                height: '100%',
                                display: 'block',
                                textDecoration: 'none',
                                color: 'inherit',
                                textAlign: 'center',
                                borderRadius: 6,
                            }}
                        >
                            <Box sx={{
                                width: 70, height: 70, borderRadius: 3,
                                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(14, 165, 233, 0.1))',
                                border: '1px solid rgba(124, 58, 237, 0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                mx: 'auto', mb: 4,
                                boxShadow: '0 4px 20px rgba(124, 58, 237, 0.1)'
                            }}>
                                <School sx={{ fontSize: 32, color: 'var(--primary)' }} />
                            </Box>

                            <Typography variant="h4" className="outfit" sx={{ mb: 2, fontWeight: 800, color: 'var(--text-primary)' }}>Command Center</Typography>
                            <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 4, px: 2, fontSize: '0.95rem' }}>
                                For educators and administrators. Deploy sensor networks and monitor live attendance logs.
                            </Typography>

                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, color: 'var(--primary)', fontWeight: 800, fontSize: '0.85rem', letterSpacing: 1 }}>
                                ENTER DASHBOARD <ChevronRight fontSize="small" />
                            </Box>
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={5}>
                        <Box
                            component={Link}
                            to="/student"
                            className="glass-card border-light"
                            sx={{
                                p: 6,
                                height: '100%',
                                display: 'block',
                                textDecoration: 'none',
                                color: 'inherit',
                                textAlign: 'center',
                                borderRadius: 6,
                            }}
                        >
                            <Box sx={{
                                width: 70, height: 70, borderRadius: 3,
                                background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(16, 185, 129, 0.1))',
                                border: '1px solid rgba(14, 165, 233, 0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                mx: 'auto', mb: 4,
                                boxShadow: '0 4px 20px rgba(14, 165, 233, 0.1)'
                            }}>
                                <Person sx={{ fontSize: 32, color: 'var(--secondary)' }} />
                            </Box>

                            <Typography variant="h4" className="outfit" sx={{ mb: 2, fontWeight: 800, color: 'var(--text-primary)' }}>Student Portal</Typography>
                            <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 4, px: 2, fontSize: '0.95rem' }}>
                                Verify your identity via proximity and biometric scan to secure your class attendance.
                            </Typography>

                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, color: 'var(--secondary)', fontWeight: 800, fontSize: '0.85rem', letterSpacing: 1 }}>
                                START CHECK-IN <ChevronRight fontSize="small" />
                            </Box>
                        </Box>
                    </Grid>
                </Grid>

                {/* Footer Stats */}
                <Box sx={{ mt: 16, textAlign: 'center' }} className="animate-fade-in">
                    <Stack direction="row" spacing={4} justifyContent="center" alignItems="center">
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h5" className="outfit gradient-text-vibrant" sx={{ fontWeight: 900 }}>99.9%</Typography>
                            <Typography variant="caption" sx={{ color: 'var(--text-secondary)', letterSpacing: 2, fontWeight: 700 }}>SECURITY</Typography>
                        </Box>
                        <Box sx={{ height: 30, width: 1, bgcolor: 'rgba(0,0,0,0.1)' }} />
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h5" className="outfit gradient-text-vibrant" sx={{ fontWeight: 900 }}>MS</Typography>
                            <Typography variant="caption" sx={{ color: 'var(--text-secondary)', letterSpacing: 2, fontWeight: 700 }}>LATENCY</Typography>
                        </Box>
                        <Box sx={{ height: 30, width: 1, bgcolor: 'rgba(0,0,0,0.1)' }} />
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h5" className="outfit gradient-text-vibrant" sx={{ fontWeight: 900 }}>AES</Typography>
                            <Typography variant="caption" sx={{ color: 'var(--text-secondary)', letterSpacing: 2, fontWeight: 700 }}>ENCRYPTED</Typography>
                        </Box>
                    </Stack>
                </Box>
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

export default LandingPage;
