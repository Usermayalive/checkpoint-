import React from 'react';
import { Container, Typography, Box, AppBar, Toolbar, Stack, Chip } from '@mui/material';
import { Security, Lock } from '@mui/icons-material';
import StudentCheckIn from '../components/StudentCheckIn';

const StudentPage = () => {
    return (
        <Box sx={{ minHeight: '100vh', position: 'relative' }}>
            {/* Decorative lights */}
            <div className="sphere sphere-primary" style={{ top: '-20%', right: '-10%', opacity: 0.15 }} />
            <div className="sphere sphere-pink" style={{ bottom: '-10%', left: '-10%', opacity: 0.1 }} />

            <AppBar position="sticky" elevation={0} sx={{
                bgcolor: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                color: 'var(--text-primary)',
            }}>
                <Container maxWidth="lg">
                    <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 0 } }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box sx={{
                                width: 32, height: 32, borderRadius: 1,
                                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Security sx={{ fontSize: 18, color: '#fff' }} />
                            </Box>
                            <Typography variant="h6" className="outfit" sx={{ fontWeight: 900, letterSpacing: -1, color: 'var(--text-primary)' }}>
                                CHECKPOINT
                            </Typography>
                        </Stack>

                        <Stack direction="row" spacing={2} alignItems="center">
                            <Chip
                                icon={<Lock sx={{ fontSize: '14px !important', color: 'var(--primary)' }} />}
                                label="ENCRYPTED SESSION"
                                size="small"
                                sx={{
                                    bgcolor: 'rgba(124, 58, 237, 0.08)',
                                    color: 'var(--primary)',
                                    fontWeight: 800,
                                    fontSize: '0.65rem',
                                    letterSpacing: 1,
                                    border: '1px solid rgba(124, 58, 237, 0.15)'
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
