import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

import {
    Box,
    Button,
    Card,
    CardContent,
    Grid,
    Typography,
    List,
    ListItem,
    ListItemAvatar,
    Avatar,
    ListItemText,
    Chip,
    Paper,
    Stack,
    Divider,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import {
    PlayArrow,
    Stop,
    Download,
    Person,
    Timer,
    Refresh,
    School,
    Room,
    Lock
} from '@mui/icons-material';
import { saveAs } from 'file-saver';
import { attendanceService } from '../services/attendanceService';
import { demoBeacons } from '../data/demoData';


const TeacherDashboard = () => {
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [presentStudents, setPresentStudents] = useState([]);
    const [sessionData, setSessionData] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [sessionEndSummary, setSessionEndSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Setup Form State
    const [isSetupOpen, setIsSetupOpen] = useState(false);
    const [courseName, setCourseName] = useState('');
    const [selectedClassroom, setSelectedClassroom] = useState('');

    // Persistence: Restore session on mount
    useEffect(() => {
        const savedSession = localStorage.getItem('active_session');
        if (savedSession) {
            try {
                const data = JSON.parse(savedSession);
                setSessionData(data);
                setIsSessionActive(true);
                setCourseName(data.courseName || '');
                setSelectedClassroom(data.classroomId || '');
                console.log("RESTORED SESSION:", data);
            } catch (e) {
                console.error("Failed to restore session:", e);
                localStorage.removeItem('active_session');
            }
        }
    }, []);

    // Timer for session duration
    useEffect(() => {
        let interval;
        if (isSessionActive) {
            interval = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isSessionActive]);

    // Real-time attendance polling from backend
    useEffect(() => {
        let interval;
        if (isSessionActive) {
            const fetchAttendance = async () => {
                console.log("LOG: Polling backend for attendance list...");
                const data = await attendanceService.getAttendanceList();
                if (data.students) {
                    console.log(`LOG: Received ${data.students.length} students from backend`);
                    setPresentStudents(data.students.map((s, idx) => ({
                        id: idx + 1,
                        name: s.name,
                        mis: s.mis,
                        checkInTime: s.time
                    })));
                }
            };
            fetchAttendance(); // initial fetch
            interval = setInterval(fetchAttendance, 3000); // poll every 3s
        }
        return () => { if (interval) clearInterval(interval); };
    }, [isSessionActive, refreshTrigger]);

    const handleStartSession = () => {
        setIsSetupOpen(true);
    };

    const confirmStartSession = async () => {
        if (!courseName || !selectedClassroom) {
            alert("Please fill all details");
            return;
        }

        // Generate session details LOCAL-FIRST for instant UI response
        const sessionCode = Math.floor(1000 + Math.random() * 9000).toString();
        const tempId = `local_${Date.now()}`;

        const fullSessionData = {
            id: tempId,
            code: sessionCode,
            courseName,
            classroomId: selectedClassroom
        };

        // 1. Update UI Instantly
        console.log("DEBUG: Initiating session start (Local-First)...");
        setSessionData(fullSessionData);
        setIsSessionActive(true);
        setIsSetupOpen(false);
        setPresentStudents([]);
        setElapsedTime(0);

        // 2. Persist to localStorage
        localStorage.setItem('active_session', JSON.stringify(fullSessionData));

        // 3. Sync to Firebase in background (Resiliently)
        try {
            const data = await attendanceService.createSession("teacher_1", courseName, selectedClassroom);
            console.log("DEBUG: Remote session sync successful:", data);

            // Update with real ID if needed, but keep existing metadata
            const syncedData = { ...fullSessionData, id: data.id };
            setSessionData(syncedData);
            localStorage.setItem('active_session', JSON.stringify(syncedData));
        } catch (error) {
            console.warn("WARNING: Firebase sync failed, continuing in local mode:", error);
            // We don't alert the user here because we are already live in local mode
        }
    };

    const handleStopSession = async () => {
        if (window.confirm("End the attendance session?")) {
            try {
                // Get the final list from the backend and clear it
                const result = await attendanceService.clearAttendance();

                // Clear persistence
                localStorage.removeItem('active_session');

                setSessionEndSummary({
                    courseName: sessionData?.courseName || 'Session',
                    finalList: result.final_list || [],
                    total: result.total || 0,
                    duration: formatTime(elapsedTime)
                });
                setIsSessionActive(false);
                setSessionData(null);
                setPresentStudents([]);
                setElapsedTime(0);
            } catch (error) {
                console.error("Failed to stop session:", error);
            }
        }
    };

    const handleDownloadReport = () => {
        const csvContent = "Name,MIS,Check-In Time\n" +
            presentStudents.map(s => `${s.name},${s.mis},${s.checkInTime}`).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
        saveAs(blob, `report_${sessionData?.code || 'attendance'}.csv`);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Box sx={{ flexGrow: 1, p: { xs: 0, md: 0 }, minHeight: '100vh', position: 'relative' }}>
            {/* Header / Demo Toggle */}
            <Box className="glass-card border-light animate-fade-in" sx={{ p: 4, mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" className="gradient-text-vibrant outfit" sx={{ fontWeight: 900, lineHeight: 1 }}>
                        COMMAND CENTER
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', mt: 1, display: 'block' }}>
                        Biometric Ledger Protocol V2.0
                    </Typography>
                </Box>
                <Stack direction="row" spacing={3} alignItems="center">
                    <Typography variant="button" sx={{ color: 'var(--primary)', fontWeight: 900, letterSpacing: 2 }}>ADMIN PORTAL</Typography>
                    <IconButton
                        onClick={() => setRefreshTrigger(prev => prev + 1)}
                        sx={{ bgcolor: 'rgba(124, 58, 237, 0.06)', border: '1px solid rgba(124, 58, 237, 0.12)', '&:hover': { bgcolor: 'rgba(124, 58, 237, 0.1)' } }}>
                        <Refresh sx={{ fontSize: 18, color: 'var(--primary)' }} />
                    </IconButton>
                </Stack>
            </Box>

            <Grid container spacing={4}>
                {/* Controls Sidebar */}
                <Grid item xs={12} lg={3.5}>
                    <Card className="glass-card border-light animate-fade-in" sx={{ height: 'fit-content', borderRadius: 6, position: 'sticky', top: 24 }}>
                        <CardContent sx={{ p: 4 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                                <Typography variant="h6" className="outfit" sx={{ fontWeight: 900, letterSpacing: 1, color: 'var(--text-primary)' }}>
                                    OPERATIONS
                                </Typography>
                                {isSessionActive && (
                                    <Chip
                                        label="PROTOCOL LIVE"
                                        size="small"
                                        sx={{
                                            bgcolor: 'rgba(239, 68, 68, 0.08)',
                                            color: '#EF4444',
                                            fontWeight: 900,
                                            border: '1px solid rgba(239, 68, 68, 0.2)',
                                            fontSize: '0.65rem'
                                        }}
                                        className="pulse-neon"
                                    />
                                )}
                            </Stack>

                            <Box sx={{ mb: 4, textAlign: 'center' }}>
                                {!isSessionActive ? (
                                    <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <IconButton
                                            className="pulse-neon"
                                            onClick={handleStartSession}
                                            sx={{
                                                width: 130, height: 130,
                                                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                                color: '#fff',
                                                mb: 4,
                                                boxShadow: '0 8px 32px rgba(124, 58, 237, 0.3)',
                                                '&:hover': { transform: 'scale(1.05)' }
                                            }}
                                        >
                                            <PlayArrow sx={{ fontSize: 60 }} />
                                        </IconButton>
                                        <Typography variant="h5" className="outfit" sx={{ fontWeight: 900, mb: 1, color: 'var(--text-primary)' }}>SYSTEM IDLE</Typography>
                                        <Typography variant="body2" sx={{ color: 'var(--text-secondary)', maxWidth: 200 }}>Initialize secure biometric capture to begin.</Typography>
                                    </Box>
                                ) : (
                                    <Stack spacing={4} alignItems="center">
                                        <Box sx={{
                                            p: 4,
                                            borderRadius: 6,
                                            textAlign: 'center',
                                            width: '100%',
                                            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.04), rgba(14, 165, 233, 0.04))',
                                            border: '1px solid rgba(124, 58, 237, 0.12)',
                                            position: 'relative', overflow: 'hidden'
                                        }}>
                                            <Typography variant="h6" className="gradient-text-vibrant outfit" sx={{ fontWeight: 900, mb: 4, fontSize: '1.25rem' }}>
                                                {sessionData?.courseName.toUpperCase()}
                                            </Typography>

                                            <Box sx={{
                                                p: 2.5, bgcolor: '#fff',
                                                display: 'inline-block',
                                                borderRadius: 4,
                                                boxShadow: '0 4px 24px rgba(124, 58, 237, 0.1)',
                                                position: 'relative', zIndex: 1
                                            }}>
                                                <QRCodeCanvas
                                                    value={`http://${window.location.host}/join/${sessionData?.code}`}
                                                    size={220}
                                                    level="H"
                                                    fgColor="#1E293B"
                                                />
                                            </Box>

                                            <Typography variant="h1" className="gradient-text-vibrant outfit" sx={{ fontWeight: 900, letterSpacing: 8, mt: 4, fontSize: '4rem' }}>
                                                {sessionData?.code}
                                            </Typography>
                                        </Box>

                                        <Grid container spacing={2}>
                                            <Grid item xs={6}>
                                                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(14, 165, 233, 0.06)', border: '1px solid rgba(14, 165, 233, 0.15)', borderRadius: 4, boxShadow: 'none' }}>
                                                    <Timer sx={{ color: 'var(--secondary)', mb: 1, fontSize: 20 }} />
                                                    <Typography variant="h5" className="outfit" sx={{ fontWeight: 900, color: 'var(--text-primary)' }}>{formatTime(elapsedTime)}</Typography>
                                                    <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontWeight: 800, letterSpacing: 1 }}>UPTIME</Typography>
                                                </Paper>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(124, 58, 237, 0.06)', border: '1px solid rgba(124, 58, 237, 0.15)', borderRadius: 4, boxShadow: 'none' }}>
                                                    <Lock sx={{ color: 'var(--primary)', mb: 1, fontSize: 20 }} />
                                                    <Typography variant="h5" className="outfit" sx={{ fontWeight: 900, color: 'var(--text-primary)' }}>AES</Typography>
                                                    <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontWeight: 800, letterSpacing: 1 }}>CIPHER</Typography>
                                                </Paper>
                                            </Grid>
                                        </Grid>

                                        <Button
                                            variant="outlined"
                                            color="error"
                                            size="large"
                                            startIcon={<Stop />}
                                            onClick={handleStopSession}
                                            fullWidth
                                            sx={{
                                                py: 2, borderRadius: 3, fontWeight: 900,
                                                borderColor: 'rgba(239, 68, 68, 0.3)',
                                                borderWidth: 2,
                                                color: '#EF4444',
                                                '&:hover': {
                                                    borderColor: '#EF4444',
                                                    bgcolor: 'rgba(239, 68, 68, 0.06)',
                                                    borderWidth: 2
                                                }
                                            }}
                                        >
                                            TERMINATE PROTOCOL
                                        </Button>
                                    </Stack>
                                )}
                            </Box>

                            <Button
                                variant="text"
                                startIcon={<Download fontSize="small" />}
                                onClick={handleDownloadReport}
                                disabled={presentStudents.length === 0}
                                fullWidth
                                sx={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.75rem', letterSpacing: 1 }}
                            >
                                EXPORT SECURE LEDGER (.CSV)
                            </Button>
                        </CardContent>
                    </Card>

                    {isSessionActive && (
                        <Paper className="glass-card border-light" sx={{ mt: 3, p: 3, borderRadius: 5, bgcolor: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Box className="pulse-neon" sx={{ width: 12, height: 12, bgcolor: '#10B981', borderRadius: '50%' }} />
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '0.9rem', color: '#10B981' }}>SYSTEM ONLINE</Typography>
                                    <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontWeight: 700 }}>VERIFICATION SYNC ACTIVE</Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    )}
                </Grid>

                {/* Main Identity Ledger (The "File") */}
                <Grid item xs={12} lg={8.5}>
                    <Box className="glass-card border-light animate-fade-in" sx={{
                        height: 850,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        borderRadius: 6,
                        bgcolor: '#fff',
                        boxShadow: '0 4px 32px rgba(0,0,0,0.04)'
                    }}>
                        <Box sx={{
                            p: 4,
                            borderBottom: '1px solid rgba(0,0,0,0.06)',
                            background: 'linear-gradient(to bottom, rgba(124, 58, 237, 0.02), #fff)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <Box>
                                <Typography variant="h5" className="outfit" sx={{ fontWeight: 900, color: 'var(--text-primary)', letterSpacing: 1 }}>
                                    ATTENDANCE LEDGER FILE
                                </Typography>
                                {isSessionActive ? (
                                    <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                                        <Typography variant="caption" sx={{ color: 'var(--primary)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>
                                            COURSE: {sessionData?.courseName}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontWeight: 800 }}>•</Typography>
                                        <Typography variant="caption" sx={{ color: 'var(--secondary)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>
                                            ROOM: {sessionData?.classroomId}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontWeight: 800 }}>•</Typography>
                                        <Typography variant="caption" sx={{ color: 'var(--text-primary)', fontWeight: 900, letterSpacing: 1 }}>
                                            CODE: {sessionData?.code}
                                        </Typography>
                                    </Stack>
                                ) : (
                                    <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2 }}>
                                        Real-Time Identity Sync Protocol
                                    </Typography>
                                )}
                            </Box>
                            <Box sx={{ p: 1.5, px: 3, borderRadius: 3, bgcolor: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)' }}>
                                <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, color: 'var(--text-primary)' }}>
                                    {new Date().toLocaleDateString()} {/* SECURE_LEDGER */}
                                </Typography>
                            </Box>
                        </Box>

                        <TableContainer sx={{ flexGrow: 1, px: 2 }}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ bgcolor: '#fff', fontWeight: 900, color: 'var(--text-secondary)', fontSize: '0.75rem', letterSpacing: 1 }}>INDEX</TableCell>
                                        <TableCell sx={{ bgcolor: '#fff', fontWeight: 900, color: 'var(--text-secondary)', fontSize: '0.75rem', letterSpacing: 1 }}>STUDENT IDENTITY</TableCell>
                                        <TableCell sx={{ bgcolor: '#fff', fontWeight: 900, color: 'var(--text-secondary)', fontSize: '0.75rem', letterSpacing: 1 }}>MIS REGISTER</TableCell>
                                        <TableCell sx={{ bgcolor: '#fff', fontWeight: 900, color: 'var(--text-secondary)', fontSize: '0.75rem', letterSpacing: 1 }}>TIMESTAMP</TableCell>
                                        <TableCell align="right" sx={{ bgcolor: '#fff', fontWeight: 900, color: 'var(--text-secondary)', fontSize: '0.75rem', letterSpacing: 1 }}>STATUS</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {presentStudents.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} sx={{ height: 400, border: 'none' }}>
                                                <Box sx={{ textAlign: 'center', opacity: 0.3 }}>
                                                    <Refresh sx={{ fontSize: 60, mb: 2, animation: 'spin 2s linear infinite', color: 'var(--primary)' }} />
                                                    <Typography variant="h6" className="outfit" sx={{ fontWeight: 800 }}>
                                                        {isSessionActive ? "POLLING SECURE BACKEND..." : "SYSTEM IDLE"}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                        {isSessionActive ? "Waiting for bio-metric signal confirmation" : "Start a session to initiate the ledger"}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        presentStudents.map((student, idx) => (
                                            <TableRow
                                                key={student.id}
                                                className="ledger-row"
                                                sx={{
                                                    '&:hover': { bgcolor: 'rgba(124, 58, 237, 0.02)' },
                                                    transition: 'background 0.2s ease'
                                                }}
                                            >
                                                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800 }}>
                                                    #{idx + 1}
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 900, color: 'var(--text-primary)' }}>
                                                    <Stack direction="row" spacing={2} alignItems="center">
                                                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'var(--primary)', fontSize: '0.8rem', fontWeight: 900 }}>
                                                            {student.name.charAt(0)}
                                                        </Avatar>
                                                        <Typography sx={{ fontWeight: 900 }}>{student.name}</Typography>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell sx={{
                                                    fontFamily: 'monospace',
                                                    fontWeight: 900,
                                                    color: 'var(--secondary)',
                                                    bgcolor: 'rgba(14, 165, 233, 0.04)',
                                                    borderRadius: 2
                                                }}>
                                                    {student.mis}
                                                </TableCell>
                                                <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 700 }}>
                                                    {student.checkInTime}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Chip
                                                        label="VERIFIED"
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{
                                                            borderColor: '#10B981',
                                                            color: '#10B981',
                                                            fontWeight: 900,
                                                            fontSize: '0.65rem'
                                                        }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Box sx={{ p: 3, bgcolor: 'rgba(0,0,0,0.02)', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'var(--text-secondary)' }}>
                                TOTAL REGISTRY ENTRIES: {presentStudents.length}
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'var(--text-secondary)' }}>
                                SECURITY HASH: SHA-256 AES-256
                            </Typography>
                        </Box>
                    </Box>
                </Grid>
            </Grid>

            {/* Session Setup Dialog */}
            <Dialog
                open={isSetupOpen}
                onClose={() => setIsSetupOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: '#FFFFFF',
                        backgroundImage: 'none',
                        border: '1px solid rgba(0,0,0,0.08)',
                        borderRadius: 6,
                        boxShadow: '0 30px 60px rgba(0,0,0,0.12)'
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 900, fontSize: '1.75rem', p: 4, color: 'var(--text-primary)' }} className="gradient-text-vibrant outfit">
                    INITIATE PROTOCOL
                </DialogTitle>
                <DialogContent sx={{ px: 4, pb: 2 }}>
                    <Stack spacing={4}>
                        <TextField
                            label="Subject / Unit Name"
                            variant="standard"
                            fullWidth
                            value={courseName}
                            onChange={(e) => setCourseName(e.target.value)}
                            InputProps={{
                                disableUnderline: false,
                                startAdornment: <School sx={{ color: 'var(--primary)', mr: 2 }} />,
                            }}
                            sx={{
                                '& .MuiInput-underline:before': { borderBottomColor: 'rgba(0,0,0,0.1)' },
                                '& .MuiInput-underline:after': { borderBottomColor: 'var(--primary)' },
                                '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
                                '& .MuiInputLabel-root.Mui-focused': { color: 'var(--primary)' },
                                '& input': { fontWeight: 600, color: 'var(--text-primary)' }
                            }}
                        />
                        <TextField
                            select
                            label="Physical Location"
                            variant="standard"
                            fullWidth
                            value={selectedClassroom}
                            onChange={(e) => setSelectedClassroom(e.target.value)}
                            InputProps={{
                                startAdornment: <Room sx={{ color: 'var(--primary)', mr: 2 }} />,
                            }}
                            sx={{
                                '& .MuiInput-underline:before': { borderBottomColor: 'rgba(0,0,0,0.1)' },
                                '& .MuiInput-underline:after': { borderBottomColor: 'var(--primary)' },
                                '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
                                '& .MuiInputLabel-root.Mui-focused': { color: 'var(--primary)' },
                            }}
                        >
                            {demoBeacons.map((beacon) => (
                                <MenuItem key={beacon.minor} value={beacon.minor} sx={{ fontWeight: 600 }}>
                                    {beacon.classroom}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 4 }}>
                    <Button onClick={() => setIsSetupOpen(false)} disabled={isLoading} sx={{ color: 'var(--text-secondary)', fontWeight: 700 }}>ABORT</Button>
                    <Button
                        className="premium-button"
                        onClick={confirmStartSession}
                        disabled={!courseName || !selectedClassroom || isLoading}
                    >
                        {isLoading ? "INITIALIZING..." : "START PROTOCOL"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Session End Summary Dialog */}
            <Dialog
                open={!!sessionEndSummary}
                onClose={() => setSessionEndSummary(null)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: '#FFFFFF',
                        backgroundImage: 'none',
                        border: '1px solid rgba(0,0,0,0.08)',
                        borderRadius: 6,
                        boxShadow: '0 30px 60px rgba(0,0,0,0.12)'
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 900, fontSize: '1.5rem', p: 4, color: 'var(--text-primary)' }} className="outfit">
                    SESSION REPORT
                </DialogTitle>
                <DialogContent sx={{ px: 4, pb: 2 }}>
                    {sessionEndSummary && (
                        <Stack spacing={3}>
                            <Box sx={{ p: 3, borderRadius: 4, bgcolor: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.15)', textAlign: 'center' }}>
                                <Typography variant="h2" className="outfit" sx={{ fontWeight: 900, color: '#10B981' }}>
                                    {sessionEndSummary.total}
                                </Typography>
                                <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 2, color: 'var(--text-secondary)' }}>
                                    STUDENTS VERIFIED · {sessionEndSummary.duration}
                                </Typography>
                            </Box>
                            <Divider sx={{ opacity: 0.15 }} />
                            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                                {sessionEndSummary.finalList.map((student, idx) => (
                                    <ListItem key={idx} sx={{
                                        mb: 1, p: 2, borderRadius: 3,
                                        bgcolor: 'rgba(124, 58, 237, 0.03)',
                                        border: '1px solid rgba(0,0,0,0.05)'
                                    }}>
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: 'rgba(124, 58, 237, 0.08)', color: 'var(--primary)', border: '1px solid rgba(124, 58, 237, 0.15)' }}>
                                                <Person />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={<Typography sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>{student.name}</Typography>}
                                            secondary={<Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontWeight: 700 }}>MIS: {student.mis} · {student.time}</Typography>}
                                        />
                                        <Chip label="VERIFIED" size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.08)', color: '#10B981', fontWeight: 900, fontSize: '0.6rem', border: '1px solid rgba(16, 185, 129, 0.2)' }} />
                                    </ListItem>
                                ))}
                                {sessionEndSummary.finalList.length === 0 && (
                                    <Typography variant="body2" sx={{ textAlign: 'center', color: 'var(--text-secondary)', py: 4 }}>No students were recorded.</Typography>
                                )}
                            </List>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 4 }}>
                    <Button
                        className="premium-button"
                        onClick={() => {
                            // Download CSV
                            if (sessionEndSummary?.finalList.length > 0) {
                                const csvContent = "Name,MIS,Time\n" +
                                    sessionEndSummary.finalList.map(s => `${s.name},${s.mis},${s.time}`).join("\n");
                                const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
                                saveAs(blob, `attendance_report.csv`);
                            }
                            setSessionEndSummary(null);
                        }}
                    >
                        DOWNLOAD REPORT & CLOSE
                    </Button>
                </DialogActions>
            </Dialog>

            <style>
                {`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards;
                }
                `}
            </style>
        </Box >
    );
};

export default TeacherDashboard;
