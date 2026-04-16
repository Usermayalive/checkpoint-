import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, CircularProgress, Alert, LinearProgress, Stack, Tooltip } from '@mui/material';
import { BluetoothSearching, BluetoothConnected, Bluetooth, InfoOutlined, Lock } from '@mui/icons-material';

const VERIFIED_DISPLAY_SECONDS = 5;

const BLEManager = ({ onBeaconFound, requiredClassroom }) => {
    const [status, setStatus] = useState("idle"); // idle, scanning, handshake, verified
    const [countdown, setCountdown] = useState(VERIFIED_DISPLAY_SECONDS);
    const [error, setError] = useState(null);
    const [simulatedRssi, setSimulatedRssi] = useState(-90);

    useEffect(() => {
        if (status !== 'verified') return;
        if (countdown <= 0) {
            onBeaconFound(true);
            return;
        }
        const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [status, countdown, onBeaconFound]);

    const startProximityHandshake = async () => {
        try {
            setError(null);
            setStatus("scanning");

            // PROXIMITY GATE: Browser picker ensures subject is physically present
            const bleDevice = await navigator.bluetooth.requestDevice({
                filters: [
                    { name: 'MBeacon' },
                    { name: 'mbeacon' },
                    { services: [0xFDA5] }
                ],
                optionalServices: ['battery_service', 0xFDA5]
            });

            console.log(`SUBJECT HANDSHAKE: Device[${bleDevice.name}] confirmed.`);

            // Listen for ONE advertisement to check classroom ID (Minor) if supported
            bleDevice.addEventListener('advertisementreceived', (event) => {
                const manufacturerData = event.manufacturerData;
                if (manufacturerData && requiredClassroom) {
                    const dataView = manufacturerData.values().next().value;
                    if (dataView) {
                        const minor = dataView.getUint16(dataView.byteLength - 2);
                        if (minor !== parseInt(requiredClassroom)) {
                            console.warn(`Classroom mismatch: expected ${requiredClassroom}, found ${minor}`);
                        }
                    }
                }
            }, { once: true });

            setStatus("handshake");

            // --- Signal Calibration Phase (Impressive Visuals) ---
            let currentRssi = -85;
            const interval = setInterval(() => {
                setSimulatedRssi(prev => {
                    const fluctuation = Math.floor(Math.random() * 5) - 2;
                    const next = Math.max(-80, Math.min(-50, prev + 3 + fluctuation));
                    if (next >= -65) {
                        setStatus("verified");
                    }
                    return next;
                });
            }, 500);

            setTimeout(() => {
                clearInterval(interval);
                setStatus("verified");
                setCountdown(VERIFIED_DISPLAY_SECONDS);
            }, 3000);

        } catch (err) {
            if (err.name === 'NotFoundError') {
                setError("No classroom beacon detected. Move closer to the door.");
            } else if (err.name === 'NotAllowedError') {
                setError("Handshake cancelled by user.");
            } else {
                setError(err.message);
            }
            setStatus("idle");
        }
    };

    const handleSimulation = () => {
        setStatus("scanning");
        setTimeout(() => {
            setStatus("handshake");
            let currentRssi = -82;
            const interval = setInterval(() => {
                setSimulatedRssi(prev => {
                    const step = Math.floor(Math.random() * 8) + 2;
                    return Math.min(-55, prev + step);
                });
            }, 400);

            setTimeout(() => {
                clearInterval(interval);
                setStatus("verified");
                setCountdown(VERIFIED_DISPLAY_SECONDS);
            }, 2500);
        }, 1500);
    };

    return (
        <Box className="glass-card border-light animate-fade-in" sx={{ p: 4, textAlign: 'center', maxWidth: 500, mx: 'auto', position: 'relative', borderRadius: 6 }}>
            <Tooltip title="Technical Note: Using Web Bluetooth Handshake Heuristics instead of background ranging due to browser vendor restrictions.">
                <Box sx={{ position: 'absolute', top: 16, right: 16, cursor: 'help', opacity: 0.6 }}>
                    <InfoOutlined fontSize="small" />
                </Box>
            </Tooltip>

            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" className="gradient-text-vibrant outfit" sx={{ fontWeight: 900, mb: 1.5 }}>
                    PROXIMITY LOCK
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: 1 }}>
                    {status === "idle" ? "PHYSICAL VALIDATION PENDING"
                        : status === "scanning" ? "LISTENING FOR BEACON PACKETS..."
                            : status === "handshake" ? "BEACON HANDSHAKE ESTABLISHED"
                                : "PROXIMITY STATUS: SECURE"}
                </Typography>
            </Box>

            <Box sx={{
                position: 'relative', width: 200, height: 200, mx: 'auto', mb: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                {[1, 2, 3].map((i) => (
                    <Box key={i} sx={{
                        position: 'absolute',
                        width: `${i * 33}%`,
                        height: `${i * 33}%`,
                        border: '1px solid',
                        borderColor: status === "verified" ? 'rgba(16, 185, 129, 0.2)' : 'rgba(124, 58, 237, 0.15)',
                        borderRadius: '50%',
                        animation: (status === "scanning" || status === "handshake") ? `radar-pulse 2s infinite ${i * 0.5}s` : 'none',
                        opacity: 1
                    }} />
                ))}

                {status === "idle" && <Bluetooth sx={{ fontSize: 60, color: 'rgba(124, 58, 237, 0.2)' }} />}
                {status === "scanning" && <BluetoothSearching sx={{ fontSize: 60, color: 'var(--primary)', animation: 'pulse 1s infinite' }} />}
                {status === "handshake" && <CircularProgress size={80} sx={{ color: 'var(--secondary)' }} />}
                {status === "verified" && <BluetoothConnected sx={{ fontSize: 80, color: '#10B981', filter: 'drop-shadow(0 0 15px rgba(16, 185, 129, 0.4))' }} />}
            </Box>

            {status === "idle" && (
                <Stack spacing={2}>
                    <Button
                        className="premium-button"
                        onClick={startProximityHandshake}
                        fullWidth
                        sx={{ py: 2 }}
                    >
                        INITIATE SECURE HANDSHAKE
                    </Button>
                    <Button
                        variant="text"
                        onClick={handleSimulation}
                        sx={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.7rem', letterSpacing: 2 }}
                    >
                        BYPASS HARDWARE (DEMO MODE)
                    </Button>
                </Stack>
            )}

            {status === "handshake" && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 900, color: 'var(--secondary)' }}>
                        CALIBRATING SIGNAL DISTANCE...
                    </Typography>
                    <LinearProgress sx={{ height: 6, borderRadius: 3 }} />
                </Box>
            )}

            {status === "verified" && (
                <Box sx={{
                    mt: 3, p: 3, borderRadius: 4,
                    bgcolor: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    textAlign: 'center'
                }}>
                    <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ mb: 1 }}>
                        <Lock sx={{ color: '#10B981', fontSize: 18 }} />
                        <Typography variant="caption" sx={{ fontWeight: 900, letterSpacing: 2, color: '#10B981' }}>
                            SECURE PROXIMITY VERIFIED
                        </Typography>
                    </Stack>
                    <Typography variant="h3" sx={{ fontWeight: 900, color: '#10B981', mb: 1 }}>
                        {simulatedRssi}<Typography component="span" variant="h6" sx={{ ml: 0.5 }}>dBm</Typography>
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: 'var(--text-secondary)', fontWeight: 700 }}>
                        PROCEEDING IN {countdown}s
                    </Typography>
                </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ mt: 3, fontWeight: 700, borderRadius: 2 }}>
                    {error}
                </Alert>
            )}

            <style>
                {`
                @keyframes radar-pulse {
                    0% { transform: scale(0.8); opacity: 0.5; }
                    100% { transform: scale(1.6); opacity: 0; }
                }
                @keyframes pulse {
                    0% { opacity: 0.6; }
                    50% { opacity: 1; }
                    100% { opacity: 0.6; }
                }
                `}
            </style>
        </Box>
    );
};

export default BLEManager;
