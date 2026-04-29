import React from 'react';
import { Container, Typography, Box, AppBar, Toolbar, Stack, Chip } from '@mui/material';
import { Security, Lock } from '@mui/icons-material';
import StudentCheckIn from '../components/StudentCheckIn';

const StudentPage = () => {
    return (
        <Box sx={{ minHeight: '100vh', position: 'relative', bgcolor: 'var(--bg-dark)' }}>
            <div className="sphere sphere-primary animate-float" style={{ top: '-15%', right: '-10%', opacity: 0.25 }} />
            <div className="sphere sphere-secondary animate-float" style={{ bottom: '-10%', left: '-10%', opacity: 0.15, animationDelay: '-2s' }} />

            <AppBar position="sticky" elevation={0} sx={{
                bgcolor: 'rgba(2, 6, 23, 0.7)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                color: 'var(--text-primary)',
                paddingTop: 'env(safe-area-inset-top)',
            }}>
                <Container maxWidth="lg">
                    <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 0 } }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box sx={{
                                width: 36, height: 36, borderRadius: 1.5,
                                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)'
                            }}>
                                <Security sx={{ fontSize: 20, color: '#fff' }} />
                            </Box>
                            <Box>
                                <Typography variant="h6" className="outfit" sx={{ fontWeight: 900, letterSpacing: -1, color: 'var(--text-primary)', lineHeight: 1 }}>
                                    CHECKPOINT
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'var(--primary-light)', fontWeight: 800, fontSize: '0.65rem', letterSpacing: 2 }}>
                                    SECURE PROTOCOL
                                </Typography>
                            </Box>
                        </Stack>

                        <Stack direction="row" spacing={2} alignItems="center">
                            <Chip
                                icon={<Lock sx={{ fontSize: '14px !important', color: 'var(--secondary-light)' }} />}
                                label="ENCRYPTED"
                                size="small"
                                sx={{
                                    bgcolor: 'rgba(6, 182, 212, 0.1)',
                                    color: 'var(--secondary-light)',
                                    fontWeight: 900,
                                    fontSize: '0.65rem',
                                    letterSpacing: 1,
                                    border: '1px solid rgba(6, 182, 212, 0.2)',
                                    display: { xs: 'none', sm: 'flex' }
                                }}
                            />
                        </Stack>
                    </Toolbar>
                </Container>
            </AppBar>

            <Container maxWidth="md" sx={{ mt: { xs: 4, md: 8 }, mb: 8 }}>
                <StudentCheckIn />
            </Container>
        </Box>
    );
};

export default StudentPage;
