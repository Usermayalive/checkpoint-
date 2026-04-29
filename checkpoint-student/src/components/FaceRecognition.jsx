import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { FaceLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';
import { Box, Button, Typography, CircularProgress, Stack, LinearProgress } from '@mui/material';
import { Fingerprint, Warning } from '@mui/icons-material';
import { attendanceService } from '../services/attendanceService';

const BLINK_THRESHOLD = 0.35;
const BLINKS_REQUIRED = 2;
const DEPTH_VARIANCE_THRESHOLD = 0.00005; // Minimum z-variance for a real 3D face (MediaPipe z is small on webcam)
const HEAD_TURN_THRESHOLD = 0.06; // How much head must turn (nose x-offset from center)
const CHALLENGE_HOLD_FRAMES = 8; // How many consecutive frames the challenge must be held
const MICRO_MOVEMENT_WINDOW = 15; // Frames to analyze for micro-movements
const MICRO_MOVEMENT_MIN = 0.0001; // Minimum expected natural micro-movement

const FaceRecognition = ({ onVerificationComplete }) => {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const faceLandmarkerRef = useRef(null);
    const animFrameRef = useRef(null);
    const drawingUtilsRef = useRef(null);
    const lastBlinkTimeRef = useRef(0);
    const wasBlinkingRef = useRef(false);

    // Anti-spoofing refs
    const landmarkHistoryRef = useRef([]); // stores recent landmark positions for micro-movement analysis
    const challengeFramesRef = useRef(0); // consecutive frames the head turn challenge is held
    const depthPassedRef = useRef(false);
    const spoofScoreRef = useRef(0); // cumulative spoof suspicion score

    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const [capturing, setCapturing] = useState(false);
    const [blinkCount, setBlinkCount] = useState(0);
    const [message, setMessage] = useState("Initializing Biometric AI...");
    const [verified, setVerified] = useState(false);
    const [studentDetails, setStudentDetails] = useState(null);
    const [spoofWarning, setSpoofWarning] = useState(null);

    // Challenge state: after blinks, require a head turn
    const [challengePhase, setChallengePhase] = useState('idle');
    // idle -> blink -> head_turn -> verifying -> done
    const [headTurnDirection, setHeadTurnDirection] = useState(null); // 'left' or 'right' (random)
    const [headTurnProgress, setHeadTurnProgress] = useState(0);

    useEffect(() => {
        let cancelled = false;
        const initFaceLandmarker = async () => {
            try {
                setMessage("Fetching neural weights...");
                const filesetResolver = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
                );
                if (cancelled) return;
                setMessage("Configuring inference engine...");
                const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                    baseOptions: {
                        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    numFaces: 1,
                    outputFaceBlendshapes: true,
                });
                if (cancelled) return;
                faceLandmarkerRef.current = faceLandmarker;
                setModelsLoaded(true);
                setMessage("AI READY. SCANNING FOR SUBJECT.");
            } catch (err) {
                console.error("MediaPipe init failed:", err);
                setMessage("HARDWARE INITIALIZATION FAILED");
            }
        };
        initFaceLandmarker();
        return () => {
            cancelled = true;
            if (faceLandmarkerRef.current) faceLandmarkerRef.current.close();
        };
    }, []);

    // ── Anti-Spoofing: Face Depth Analysis ──
    // Real faces have significant z-coordinate variance across landmarks.
    // Photos/screens are flat → very low z-variance.
    const analyzeFaceDepth = (landmarks) => {
        const zValues = landmarks.map(lm => lm.z);
        const mean = zValues.reduce((a, b) => a + b, 0) / zValues.length;
        const variance = zValues.reduce((sum, z) => sum + Math.pow(z - mean, 2), 0) / zValues.length;
        return variance;
    };

    // analyzeMicroMovements removed — was unused and caused ESLint CI failure
    // Can be re-added when integrated into the detection pipeline

    // ── Anti-Spoofing: Head Turn Detection ──
    const detectHeadTurn = (landmarks) => {
        // Use nose tip (index 1) and face edges to determine head orientation
        const noseTip = landmarks[1];
        const leftCheek = landmarks[234];
        const rightCheek = landmarks[454];

        if (!noseTip || !leftCheek || !rightCheek) return { direction: 'center', offset: 0 };

        const faceCenter = (leftCheek.x + rightCheek.x) / 2;
        const offset = noseTip.x - faceCenter;

        // Positive offset = head turned left (from camera's perspective)
        // Negative offset = head turned right
        let direction = 'center';
        if (offset > HEAD_TURN_THRESHOLD) direction = 'left';
        else if (offset < -HEAD_TURN_THRESHOLD) direction = 'right';

        return { direction, offset };
    };

    useEffect(() => {
        if (!modelsLoaded) return;
        let lastFaceState = false;
        let lastDetectTime = 0;

        const detect = () => {
            const video = webcamRef.current?.video;
            const canvas = canvasRef.current;
            if (!video || video.readyState !== 4 || !canvas || !faceLandmarkerRef.current) {
                animFrameRef.current = requestAnimationFrame(detect);
                return;
            }
            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            }

            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const now = performance.now();
            if (now - lastDetectTime < 33) {
                animFrameRef.current = requestAnimationFrame(detect);
                return;
            }
            lastDetectTime = now;

            try {
                const result = faceLandmarkerRef.current.detectForVideo(video, now);
                if (result.faceLandmarks && result.faceLandmarks.length > 0) {
                    const landmarks = result.faceLandmarks[0];
                    if (!drawingUtilsRef.current) drawingUtilsRef.current = new DrawingUtils(ctx);

                    const mainColor = verified ? "#10B981" : capturing ? "#EC4899" : "#7C3AED";
                    const secondaryColor = "#0EA5E9";

                    drawingUtilsRef.current.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, { color: "rgba(0, 0, 0, 0.05)", lineWidth: 0.5 });
                    drawingUtilsRef.current.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, { color: mainColor, lineWidth: 1.5 });
                    drawingUtilsRef.current.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, { color: secondaryColor, lineWidth: 2 });
                    drawingUtilsRef.current.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, { color: secondaryColor, lineWidth: 2 });

                    if (!lastFaceState) {
                        lastFaceState = true;
                        setFaceDetected(true);
                        if (!capturing) setMessage("SUBJECT DETECTED. AUTHORIZE SCAN.");
                    }

                    // ── Continuous anti-spoofing checks (run every frame when capturing) ──
                    if (capturing) {
                        // 1. Face Depth Check — detect flat screens
                        const depthVariance = analyzeFaceDepth(landmarks);
                        if (depthVariance < DEPTH_VARIANCE_THRESHOLD) {
                            spoofScoreRef.current += 0.5;
                            if (spoofScoreRef.current > 60) {
                                setSpoofWarning("⚠ FLAT SURFACE DETECTED — Please show your real face, not a screen or photo");
                            }
                        } else {
                            depthPassedRef.current = true;
                            if (spoofScoreRef.current > 0) spoofScoreRef.current -= 1;
                            if (spoofScoreRef.current <= 20) setSpoofWarning(null);
                        }
                    }

                    // ── Phase: Blink Detection ──
                    if (capturing && challengePhase === 'blink' && result.faceBlendshapes && result.faceBlendshapes.length > 0) {
                        const categories = result.faceBlendshapes[0].categories;
                        const eyeScore = (categories.find(c => c.categoryName === 'eyeBlinkLeft')?.score + categories.find(c => c.categoryName === 'eyeBlinkRight')?.score) / 2;

                        if (eyeScore > BLINK_THRESHOLD && !wasBlinkingRef.current && (now - lastBlinkTimeRef.current > 400)) {
                            wasBlinkingRef.current = true;
                            lastBlinkTimeRef.current = now;
                            setBlinkCount(prev => {
                                const next = prev + 1;
                                if (next >= BLINKS_REQUIRED) {
                                    // Blinks passed → move to head turn challenge
                                    const direction = Math.random() > 0.5 ? 'left' : 'right';
                                    setHeadTurnDirection(direction);
                                    setChallengePhase('head_turn');
                                    challengeFramesRef.current = 0;
                                    setHeadTurnProgress(0);
                                    setMessage(`TURN HEAD ${direction.toUpperCase()}`);
                                }
                                return next;
                            });
                        } else if (eyeScore < BLINK_THRESHOLD) {
                            wasBlinkingRef.current = false;
                        }
                    }

                    // ── Phase: Head Turn Challenge ──
                    if (capturing && challengePhase === 'head_turn' && headTurnDirection) {
                        const headTurn = detectHeadTurn(landmarks);

                        if (headTurn.direction === headTurnDirection) {
                            challengeFramesRef.current += 1;
                            const progress = Math.min(challengeFramesRef.current / CHALLENGE_HOLD_FRAMES, 1);
                            setHeadTurnProgress(progress);

                            if (challengeFramesRef.current >= CHALLENGE_HOLD_FRAMES) {
                                // Head turn verified! Now capture and verify with backend
                                setChallengePhase('verifying');
                                setMessage("LIVENESS CONFIRMED. FACE FORWARD AND ANALYZING...");

                                // Wait briefly for user to face forward, then capture
                                setTimeout(() => {
                                    const imageSrc = webcamRef.current?.getScreenshot();
                                    if (!imageSrc) {
                                        setMessage("CAPTURE FAILED. RETRYING...");
                                        setChallengePhase('blink');
                                        setBlinkCount(0);
                                        return;
                                    }

                                    fetch(imageSrc)
                                        .then(res => res.blob())
                                        .then(async blob => {
                                            try {
                                                const result = await attendanceService.verifyFace(blob);
                                                if (result.verified) {
                                                    // Check backend anti-spoofing result
                                                    if (result.spoof_detected) {
                                                        setSpoofWarning("⚠ SPOOF DETECTED BY SERVER — This does not appear to be a live face");
                                                        setMessage("⛔ VERIFICATION FAILED: Spoofing detected");
                                                        setChallengePhase('idle');
                                                        setCapturing(false);
                                                        setTimeout(() => {
                                                            setSpoofWarning(null);
                                                            setBlinkCount(0);
                                                            setChallengePhase('idle');
                                                            setMessage("RETRYING BIOMETRIC SCAN...");
                                                        }, 3000);
                                                        return;
                                                    }

                                                    setVerified(true);
                                                    setStudentDetails({ name: result.name, mis: result.mis });
                                                    setMessage(`✓ ACCESS GRANTED: ${result.name}`);
                                                    await attendanceService.postAttendance(result.name, result.mis);
                                                    setTimeout(() => onVerificationComplete(true, { name: result.name, mis: result.mis }), 1500);
                                                } else {
                                                    setMessage("⚠ UNAUTHORIZED: " + (result.message || "Unknown"));
                                                    setTimeout(() => {
                                                        setBlinkCount(0);
                                                        setChallengePhase('idle');
                                                        setCapturing(false);
                                                        setMessage("RETRYING BIOMETRIC SCAN...");
                                                    }, 2000);
                                                }
                                            } catch (err) {
                                                setMessage("SYSTEM CONNECTION ERROR");
                                                setCapturing(false);
                                                setChallengePhase('idle');
                                            }
                                        });
                                }, 1500); // 1.5s delay for user to face forward
                            }
                        } else {
                            // Wrong direction or not turned enough
                            if (challengeFramesRef.current > 0) {
                                challengeFramesRef.current = Math.max(0, challengeFramesRef.current - 1);
                                setHeadTurnProgress(Math.max(0, challengeFramesRef.current / CHALLENGE_HOLD_FRAMES));
                            }
                        }
                    }

                } else {
                    if (lastFaceState) {
                        lastFaceState = false;
                        setFaceDetected(false);
                        if (!capturing) setMessage("AWAITING SUBJECT ALIGNMENT");
                    }
                }
            } catch (err) { }
            animFrameRef.current = requestAnimationFrame(detect);
        };
        animFrameRef.current = requestAnimationFrame(detect);
        return () => cancelAnimationFrame(animFrameRef.current);
    }, [modelsLoaded, capturing, verified, onVerificationComplete, challengePhase, headTurnDirection]);

    const startLivenessCheck = useCallback(() => {
        setCapturing(true);
        setBlinkCount(0);
        setChallengePhase('blink');
        setHeadTurnDirection(null);
        setHeadTurnProgress(0);
        setSpoofWarning(null);
        spoofScoreRef.current = 0;
        depthPassedRef.current = false;
        landmarkHistoryRef.current = [];
        challengeFramesRef.current = 0;
        setMessage("BLINK YOUR EYES TWICE TO VERIFY LIVENESS");
    }, []);

    // Get the current challenge step label
    const getChallengeLabel = () => {
        if (challengePhase === 'blink') return `BLINK YOUR EYES (${blinkCount}/${BLINKS_REQUIRED})`;
        if (challengePhase === 'head_turn') return `TURN HEAD ${headTurnDirection?.toUpperCase() || ''}`;
        if (challengePhase === 'verifying') return 'FACE FORWARD — ANALYZING...';
        return 'AUTHORIZE BIOMETRIC SCAN';
    };

    return (
        <Box className="glass-card border-light animate-fade-in" sx={{ p: { xs: 2.5, md: 5 }, textAlign: 'center', maxWidth: 640, mx: 'auto', position: 'relative', borderRadius: 6 }}>
            <Box sx={{ mb: 4 }}>
                <Stack direction="row" justifyContent="center" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                    <Fingerprint sx={{ color: verified ? '#10B981' : 'var(--primary)', fontSize: 28 }} />
                    <Typography variant="h5" className="gradient-text-vibrant outfit" sx={{ fontWeight: 900, letterSpacing: -0.5 }}>
                        BIOMETRIC GATEWAY
                    </Typography>
                </Stack>
                <Typography variant="caption" sx={{
                    color: verified ? '#10B981' : spoofWarning ? '#EF4444' : capturing ? 'var(--accent-pink)' : 'var(--text-secondary)',
                    fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase'
                }}>
                    {message}
                </Typography>
            </Box>

            <Box sx={{
                position: 'relative', width: '100%', aspectRatio: '4/3', borderRadius: 4, overflow: 'hidden', mb: 4,
                bgcolor: '#F1F5F9',
                border: verified ? '2px solid #10B981' : spoofWarning ? '2px solid #EF4444' : '1px solid rgba(0,0,0,0.08)',
                boxShadow: verified ? '0 4px 24px rgba(16, 185, 129, 0.15)' : spoofWarning ? '0 4px 24px rgba(239, 68, 68, 0.15)' : '0 4px 16px rgba(0,0,0,0.06)'
            }}>
                <Webcam audio={false} ref={webcamRef} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'scaleX(-1)', zIndex: 2 }} />

                {/* Head turn direction overlay */}
                {challengePhase === 'head_turn' && headTurnDirection && (
                    <Box sx={{
                        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                        [headTurnDirection === 'left' ? 'left' : 'right']: 16,
                        zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center'
                    }}>
                        <Typography sx={{
                            fontSize: 64,
                            animation: 'bounce-arrow 1s infinite',
                            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))'
                        }}>
                            {headTurnDirection === 'left' ? '👈' : '👉'}
                        </Typography>
                    </Box>
                )}

                {/* Spoof warning overlay */}
                {spoofWarning && (
                    <Box sx={{
                        position: 'absolute', top: 0, left: 0, right: 0,
                        bgcolor: 'rgba(239, 68, 68, 0.9)',
                        p: 1.5, zIndex: 15,
                        backdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1
                    }}>
                        <Warning sx={{ color: '#fff', fontSize: 20 }} />
                        <Typography variant="caption" sx={{ color: '#fff', fontWeight: 800, letterSpacing: 1, fontSize: '0.7rem' }}>
                            {spoofWarning}
                        </Typography>
                    </Box>
                )}

                {!modelsLoaded && (
                    <Box sx={{ position: 'absolute', inset: 0, zIndex: 10, bgcolor: '#F8FAFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <CircularProgress sx={{ color: 'var(--primary)', mb: 3 }} />
                        <Typography variant="caption" sx={{ letterSpacing: 2, color: 'var(--text-secondary)', fontWeight: 800 }}>{message}</Typography>
                    </Box>
                )}

                {verified && studentDetails && (
                    <Box sx={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        bgcolor: 'rgba(16, 185, 129, 0.95)',
                        p: 2, zIndex: 5,
                        backdropFilter: 'blur(4px)'
                    }}>
                        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>
                            {studentDetails.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#fff', opacity: 0.9, letterSpacing: 1 }}>
                            MIS: {studentDetails.mis}
                        </Typography>
                    </Box>
                )}
            </Box>

            {!verified && (
                <Stack spacing={3} alignItems="center">
                    {/* Challenge progress indicators */}
                    {capturing && (
                        <Box sx={{ width: '100%' }}>
                            {/* Step indicators */}
                            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 2 }}>
                                {/* Blink indicators */}
                                {Array.from({ length: BLINKS_REQUIRED }).map((_, i) => (
                                    <Box key={`blink-${i}`} sx={{
                                        width: 40, height: 40, borderRadius: '50%', border: '2px solid',
                                        borderColor: i < blinkCount ? '#10B981' : 'rgba(0,0,0,0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: i < blinkCount ? '#10B981' : 'rgba(0,0,0,0.2)',
                                        background: i < blinkCount ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                                        boxShadow: i < blinkCount ? '0 2px 12px rgba(16, 185, 129, 0.15)' : 'none',
                                        transition: 'all 0.4s', fontSize: 14
                                    }}>
                                        {i < blinkCount ? '✓' : '👁'}
                                    </Box>
                                ))}

                                {/* Divider */}
                                <Box sx={{ width: 2, height: 40, bgcolor: 'rgba(0,0,0,0.08)', mx: 1 }} />

                                {/* Head turn indicator */}
                                <Box sx={{
                                    width: 40, height: 40, borderRadius: '50%', border: '2px solid',
                                    borderColor: challengePhase === 'verifying' || challengePhase === 'done' ? '#10B981' : challengePhase === 'head_turn' ? 'var(--accent-pink)' : 'rgba(0,0,0,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: challengePhase === 'verifying' ? 'rgba(16, 185, 129, 0.08)' : challengePhase === 'head_turn' ? 'rgba(236, 72, 153, 0.08)' : 'transparent',
                                    transition: 'all 0.4s', fontSize: 14
                                }}>
                                    {challengePhase === 'verifying' || challengePhase === 'done' ? '✓' : headTurnDirection === 'left' ? '←' : headTurnDirection === 'right' ? '→' : '↔'}
                                </Box>
                            </Stack>

                            {/* Head turn progress bar */}
                            {challengePhase === 'head_turn' && (
                                <Box sx={{ width: '100%', mb: 1 }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={headTurnProgress * 100}
                                        sx={{
                                            height: 6, borderRadius: 3,
                                            bgcolor: 'rgba(236, 72, 153, 0.1)',
                                            '& .MuiLinearProgress-bar': {
                                                borderRadius: 3,
                                                background: 'linear-gradient(90deg, #EC4899, #7C3AED)',
                                                transition: 'transform 0.2s ease'
                                            }
                                        }}
                                    />
                                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'var(--accent-pink)', fontWeight: 800, letterSpacing: 2 }}>
                                        TURN HEAD {headTurnDirection?.toUpperCase()} AND HOLD
                                    </Typography>
                                </Box>
                            )}

                            {/* Current challenge label */}
                            <Typography variant="caption" sx={{
                                display: 'block', fontWeight: 900, letterSpacing: 2,
                                color: spoofWarning ? '#EF4444' : 'var(--text-secondary)'
                            }}>
                                {getChallengeLabel()}
                            </Typography>
                        </Box>
                    )}

                    <Button
                        className="premium-button"
                        onClick={startLivenessCheck}
                        disabled={capturing || (!faceDetected && modelsLoaded)}
                        sx={{ minWidth: 260, opacity: faceDetected ? 1 : 0.5 }}
                    >
                        {capturing ? "VERIFYING LIVENESS..." : faceDetected ? "AUTHORIZE BIOMETRIC SCAN" : "AWAITING SUBJECT"}
                    </Button>
                </Stack>
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
                @keyframes bounce-arrow {
                    0%, 100% { transform: translateX(0); }
                    50% { transform: translateX(10px); }
                }
                `}
            </style>
        </Box>
    );
};

export default FaceRecognition;
