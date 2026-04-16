import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Stepper, Step, StepLabel, Alert, Stack } from '@mui/material';
import { Security, CheckCircle, KeyboardDoubleArrowRight } from '@mui/icons-material';
import BLEManager from './BLEManager';
import FaceRecognition from './FaceRecognition';
import { attendanceService } from '../services/attendanceService';
import { demoStudents } from '../data/students';

const StudentCheckIn = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [sessionCode, setSessionCode] = useState('');
    const [activeSession, setActiveSession] = useState(null);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const steps = ['Protocol Access', 'Proximity Check', 'Biometric Verify'];

    const handleNext = () => setActiveStep((prev) => prev + 1);

    const verifySessionCode = async () => {
        if (sessionCode.length === 4) {
            setIsSubmitting(true);

            // Hardcoded demo bypass: code "1234" always works
            if (sessionCode === '1234') {
                setActiveSession({
                    id: 'demo-session-1234',
                    code: '1234',
                    courseName: 'Demo Session',
                    classroomId: 'ROOM-101',
                    status: 'active'
                });
                setError('');
                setIsSubmitting(false);
                handleNext();
                return;
            }

            try {
                const session = await attendanceService.verifySession(sessionCode);
                if (session) {
                    setActiveSession(session);
                    setError('');
                    handleNext();
                } else {
                    setError('Invalid or expired session code');
                }
            } catch (err) {
                setError('Connection failed. Please try again.');
            } finally {
                setIsSubmitting(false);
            }
        } else {
            setError('Please enter the 4-digit code provided by your instructor');
        }
    };

    const handleBeaconFound = (found) => {
        if (found) {
            setTimeout(handleNext, 1500);
        }
    };

    const [verifiedStudent, setVerifiedStudent] = useState(null);

    const handleFaceVerified = async (success, studentInfo) => {
        if (success && activeSession) {
            const student = studentInfo || demoStudents[0];
            setVerifiedStudent(student);
            try {
                await attendanceService.markAttendance(activeSession.id, {
                    studentId: student.id || 'face-verified',
                    name: student.name,
                    mis: student.mis
                });
                handleNext();
            } catch (err) {
                console.error("Attendance failed:", err);
                handleNext(); // Still proceed even if Firebase fails
            }
        }
    };

    return (
        <Box className="glass-card border-light" sx={{ p: { xs: 3, md: 6 }, borderRadius: 6 }}>
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 8 }}>
                {steps.map((label, index) => (
                    <Step key={label}>
                        <StepLabel StepIconProps={{
                            sx: {
                                '&.Mui-active': { color: 'var(--primary)', filter: 'drop-shadow(0 0 6px rgba(124, 58, 237, 0.3))' },
                                '&.Mui-completed': { color: 'var(--secondary)' },
                                '&.Mui-disabled': { color: '#E2E8F0' }
                            }
                        }}>
                            <Typography variant="caption" sx={{
                                fontWeight: activeStep === index ? 900 : 700,
                                color: activeStep === index ? 'var(--text-primary)' : 'var(--text-secondary)',
                                letterSpacing: 1
                            }}>
                                {label.toUpperCase()}
                            </Typography>
                        </StepLabel>
                    </Step>
                ))}
            </Stepper>

            {activeStep === 0 && (
                <Box className="animate-fade-in" sx={{ textAlign: 'center', py: 4 }}>
                    <Box sx={{
                        width: 80, height: 80, borderRadius: 3,
                        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.08), rgba(14, 165, 233, 0.08))',
                        border: '1px solid rgba(124, 58, 237, 0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        mx: 'auto', mb: 4,
                        boxShadow: '0 4px 20px rgba(124, 58, 237, 0.08)'
                    }}>
                        <Security sx={{ fontSize: 40, color: 'var(--primary)' }} />
                    </Box>

                    <Typography variant="h4" className="outfit" sx={{ mb: 2, fontWeight: 800, color: 'var(--text-primary)' }}>Protocol Access</Typography>
                    <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 6 }}>
                        Enter the unique session code to begin identity verification.
                    </Typography>

                    <Stack spacing={3} alignItems="center">
                        <TextField
                            variant="standard"
                            placeholder="0000"
                            value={sessionCode}
                            onChange={(e) => setSessionCode(e.target.value)}
                            inputProps={{
                                maxLength: 4,
                                style: {
                                    textAlign: 'center',
                                    fontSize: '3rem',
                                    letterSpacing: '1rem',
                                    fontWeight: 900,
                                    color: 'var(--primary)',
                                    fontFamily: 'Outfit'
                                }
                            }}
                            sx={{
                                width: 280,
                                '& .MuiInput-underline:before': { borderBottom: '2px solid rgba(0,0,0,0.1)' },
                                '& .MuiInput-underline:after': { borderBottom: '2px solid var(--primary)' },
                                '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottom: '2px solid rgba(0,0,0,0.2)' }
                            }}
                        />

                        {error && <Alert severity="error" variant="filled" sx={{
                            width: '100%', maxWidth: 400, borderRadius: 2,
                            bgcolor: 'rgba(239, 68, 68, 0.08)', color: '#EF4444',
                            border: '1px solid rgba(239, 68, 68, 0.15)',
                            fontWeight: 700
                        }}>{error}</Alert>}

                        <Button
                            className="premium-button"
                            onClick={verifySessionCode}
                            disabled={isSubmitting || sessionCode.length !== 4}
                            sx={{ minWidth: 240, py: 2 }}
                        >
                            INITIATE CHECK-IN <KeyboardDoubleArrowRight />
                        </Button>
                    </Stack>
                </Box>
            )}

            {activeStep === 1 && (
                <BLEManager onBeaconFound={handleBeaconFound} requiredClassroom={activeSession?.classroomId} />
            )}

            {activeStep === 2 && (
                <FaceRecognition onVerificationComplete={handleFaceVerified} />
            )}

            {activeStep === 3 && (
                <Box className="animate-fade-in" sx={{ textAlign: 'center', py: 8 }}>
                    <CheckCircle sx={{ fontSize: 100, color: '#10B981', mb: 4, filter: 'drop-shadow(0 4px 20px rgba(16, 185, 129, 0.3))' }} />
                    <Typography variant="h3" className="outfit" sx={{ mb: 2, fontWeight: 900, color: 'var(--text-primary)' }}>IDENTITY CONFIRMED</Typography>
                    <Typography variant="h6" sx={{ color: 'var(--text-secondary)', mb: 1 }}>
                        Attendance logged for <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{verifiedStudent?.name || 'Student'}</span>
                    </Typography>
                    {verifiedStudent?.mis && (
                        <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 6 }}>
                            MIS: <span style={{ fontWeight: 700 }}>{verifiedStudent.mis}</span>
                        </Typography>
                    )}
                    <Button
                        className="premium-button"
                        onClick={() => window.location.href = '/'}
                        sx={{ bgcolor: 'rgba(124, 58, 237, 0.06)', color: 'var(--primary)', boxShadow: 'none', '&:hover': { bgcolor: 'rgba(124, 58, 237, 0.1)' } }}
                    >
                        RETURN HOME
                    </Button>
                </Box>
            )}

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

export default StudentCheckIn;
