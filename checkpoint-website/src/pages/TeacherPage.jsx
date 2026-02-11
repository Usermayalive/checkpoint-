import React from 'react';
import { Container, Typography, Box, AppBar, Toolbar, Stack, Chip, IconButton } from '@mui/material';
import { Shield, Settings } from '@mui/icons-material';
import TeacherDashboard from '../components/TeacherDashboard';

const TeacherPage = () => {
    return (
        <Box sx={{ minHeight: '100vh', position: 'relative' }}>
            {/* Decorative lights */}
            <div className="sphere sphere-primary" style={{ top: '-10%', left: '-10%', opacity: 0.15 }} />
            <div className="sphere sphere-secondary" style={{ top: '30%', right: '-10%', opacity: 0.1 }} />

            <AppBar position="sticky" elevation={0} sx={{
                bgcolor: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                zIndex: 1100,
                color: 'var(--text-primary)',
            }}>
                <Container maxWidth="xl">
                    <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 0 } }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Box sx={{
                                width: 36, height: 36, borderRadius: 1.5,
                                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
                            }}>
                                <Shield sx={{ fontSize: 20, color: '#fff' }} />
                            </Box>
                            <Box>
                                <Typography variant="h6" className="outfit" sx={{ fontWeight: 900, lineHeight: 1, letterSpacing: -1, color: 'var(--text-primary)' }}>
                                    CHECKPOINT
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontSize: '0.6rem', fontWeight: 800, letterSpacing: 2 }}>
                                    ADMIN CONSOLE
                                </Typography>
                            </Box>
                        </Stack>

                        <Stack direction="row" spacing={3} alignItems="center">
                            <Chip
                                label="LIVE SYSTEM"
                                className="pulse-neon"
                                size="small"
                                sx={{
                                    bgcolor: 'rgba(16, 185, 129, 0.1)',
                                    color: '#10B981',
                                    fontWeight: 900,
                                    fontSize: '0.65rem',
                                    border: '1px solid rgba(16, 185, 129, 0.2)'
                                }}
                            />
                            <IconButton sx={{ color: 'var(--text-secondary)', p: 1 }}>
                                <Settings fontSize="small" />
                            </IconButton>
                        </Stack>
                    </Toolbar>
                </Container>
            </AppBar>

            <Container maxWidth="xl" sx={{ mt: 4, mb: 10 }}>
                <TeacherDashboard />
            </Container>
        </Box>
    );
};

export default TeacherPage;