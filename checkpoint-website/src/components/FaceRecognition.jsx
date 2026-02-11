import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { FaceLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';
import { Box, Button, Typography, CircularProgress, Stack } from '@mui/material';
import { Security, CameraAlt, Fingerprint } from '@mui/icons-material';
import { attendanceService } from '../services/attendanceService';

const BLINK_THRESHOLD = 0.35;
const BLINKS_REQUIRED = 2;

const FaceRecognition = ({ onVerificationComplete }) => {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const faceLandmarkerRef = useRef(null);
    const animFrameRef = useRef(null);
    const drawingUtilsRef = useRef(null);
    const lastBlinkTimeRef = useRef(0);
    const wasBlinkingRef = useRef(false);

    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const [capturing, setCapturing] = useState(false);
    const [blinkCount, setBlinkCount] = useState(0);
    const [message, setMessage] = useState("Initializing Biometric AI...");
    const [verified, setVerified] = useState(false);
    const [studentDetails, setStudentDetails] = useState(null);

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

                    if (capturing && result.faceBlendshapes && result.faceBlendshapes.length > 0) {
                        const categories = result.faceBlendshapes[0].categories;
                        const eyeScore = (categories.find(c => c.categoryName === 'eyeBlinkLeft')?.score + categories.find(c => c.categoryName === 'eyeBlinkRight')?.score) / 2;

                        if (eyeScore > BLINK_THRESHOLD && !wasBlinkingRef.current && (now - lastBlinkTimeRef.current > 400)) {
                            wasBlinkingRef.current = true;
                            lastBlinkTimeRef.current = now;
                            setBlinkCount(prev => {
                                const next = prev + 1;
                                if (next >= BLINKS_REQUIRED) {
                                    // Blink Check Passed - Verify with Backend
                                    setCapturing(false);
                                    setMessage("LIVENESS CONFIRMED. ANALYZING...");

                                    const imageSrc = webcamRef.current.getScreenshot();
                                    fetch(imageSrc)
                                        .then(res => res.blob())
                                        .then(async blob => {
                                            try {
                                                const result = await attendanceService.verifyFace(blob);
                                                if (result.verified) {
                                                    setVerified(true);
                                                    setStudentDetails({ name: result.name, mis: result.mis });
                                                    setMessage(`✓ ACCESS GRANTED: ${result.name}`);
                                                    // Record attendance on backend for Teacher Dashboard
                                                    await attendanceService.postAttendance(result.name, result.mis);
                                                    // Reduced delay for smoother transition
                                                    setTimeout(() => onVerificationComplete(true, { name: result.name, mis: result.mis }), 1500);
                                                } else {
                                                    setMessage("⚠ UNAUTHORIZED: " + (result.message || "Unknown"));
                                                    setTimeout(() => {
                                                        setBlinkCount(0);
                                                        setMessage("RETRYING BIOMETRIC SCAN...");
                                                    }, 2000);
                                                }
                                            } catch (err) {
                                                setMessage("SYSTEM CONNECTION ERROR");
                                                setCapturing(false);
                                            }
                                        });
                                }
                                return next;
                            });
                        } else if (eyeScore < BLINK_THRESHOLD) {
                            wasBlinkingRef.current = false;
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
    }, [modelsLoaded, capturing, verified, onVerificationComplete]);

    const startLivenessCheck = useCallback(() => {
        setCapturing(true);
        setBlinkCount(0);
        setMessage("BLINK EYES TO VERIFY LIVENESS");
    }, []);

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
                    color: verified ? '#10B981' : capturing ? 'var(--accent-pink)' : 'var(--text-secondary)',
                    fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase'
                }}>
                    {message}
                </Typography>
            </Box>

            <Box sx={{
                position: 'relative', width: '100%', aspectRatio: '4/3', borderRadius: 4, overflow: 'hidden', mb: 4,
                bgcolor: '#F1F5F9', border: verified ? '2px solid #10B981' : '1px solid rgba(0,0,0,0.08)',
                boxShadow: verified ? '0 4px 24px rgba(16, 185, 129, 0.15)' : '0 4px 16px rgba(0,0,0,0.06)'
            }}>
                <Webcam audio={false} ref={webcamRef} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'scaleX(-1)', zIndex: 2 }} />

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
                    {capturing && (
                        <Stack direction="row" spacing={3} sx={{ mb: 1 }}>
                            {Array.from({ length: BLINKS_REQUIRED }).map((_, i) => (
                                <Box key={i} sx={{
                                    width: 44, height: 44, borderRadius: '50%', border: '2px solid',
                                    borderColor: i < blinkCount ? '#10B981' : 'rgba(0,0,0,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: i < blinkCount ? '#10B981' : 'rgba(0,0,0,0.2)',
                                    background: i < blinkCount ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                                    boxShadow: i < blinkCount ? '0 2px 12px rgba(16, 185, 129, 0.15)' : 'none',
                                    transition: 'all 0.4s'
                                }}>
                                    {i < blinkCount ? '✓' : <CameraAlt sx={{ fontSize: 18 }} />}
                                </Box>
                            ))}
                        </Stack>
                    )}

                    <Button
                        className="premium-button"
                        onClick={startLivenessCheck}
                        disabled={capturing || !faceDetected}
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
                `}
            </style>
        </Box>
    );
};

export default FaceRecognition;
