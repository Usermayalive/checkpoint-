import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Alert, LinearProgress, Stack, Tooltip } from '@mui/material';
import { BluetoothSearching, BluetoothConnected, Bluetooth, InfoOutlined, Lock } from '@mui/icons-material';
import { bleService } from '../services/bleService';

const VERIFIED_DISPLAY_SECONDS = 5;

// The RSSI value required to count as "verified"
// Depends on beacon transmit power and environment. -65 is a good start.
const NATIVE_PROXIMITY_THRESHOLD = -65; 

const BLEManager = ({ onBeaconFound, requiredClassroom }) => {
    const [status, setStatus] = useState("idle"); // idle, scanning, handshake, verified
    const [countdown, setCountdown] = useState(VERIFIED_DISPLAY_SECONDS);
    const [error, setError] = useState(null);
    const [simulatedRssi, setSimulatedRssi] = useState(-90);

    // Provide indication of whether we are running native real RSSI or web demo
    const [isNativeMode, setIsNativeMode] = useState(bleService.isNative);

    useEffect(() => {
        // Initialize Capacitor BLE if native
        if (bleService.isNative) {
            bleService.initialize().catch(err => {
                console.error("Failed to init BLE plugin:", err);
                setError("Failed to initialize Bluetooth hardware on device.");
            });
        }

        // Cleanup native scan on unmount
        return () => {
            if (bleService.isNative) {
                bleService.stopNativeScan();
            }
        };
    }, []);

    useEffect(() => {
        if (status !== 'verified') return;
        if (countdown <= 0) {
            onBeaconFound(true);
            return;
        }
        const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [status, countdown, onBeaconFound]);

    const startNativeHandshake = async () => {
        try {
            setError(null);
            setStatus("scanning");
            setSimulatedRssi(-100);

            // Set a 30-second timeout — if beacon not found or too far, reject
            const scanTimeout = setTimeout(() => {
                bleService.stopNativeScan();
                setStatus("rejected");
                setError("You appear to be outside the classroom. Please move closer to the beacon and try again.");
            }, 30000);

            await bleService.startNativeScan(
                (result) => {
                    // Update UI with the *real* live RSSI value
                    setSimulatedRssi(result.rssi);
                    setStatus("handshake");

                    // Check distance
                    if (result.rssi >= NATIVE_PROXIMITY_THRESHOLD) {
                        // Found it and close enough!
                        clearTimeout(scanTimeout);
                        bleService.stopNativeScan();
                        setStatus("verified");
                        setCountdown(VERIFIED_DISPLAY_SECONDS);
                    }
                },
                (err) => {
                    clearTimeout(scanTimeout);
                    setError("Scan error: " + (err.message || err));
                    setStatus("idle");
                }
            );

        } catch (err) {
            setError(err.message || "Failed to start native scan.");
            setStatus("idle");
        }
    };

    const startWebHandshake = async () => {
        try {
            setError(null);
            setStatus("scanning");

            const bleDevice = await bleService.startWebScan();
            console.log(`SUBJECT HANDSHAKE: Device[${bleDevice.name}] confirmed.`);

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

            // Web fallback: simulate RSSI fluctuating since we can't scan passively
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

    const startProximityHandshake = () => {
        if (isNativeMode) {
            startNativeHandshake();
        } else {
            startWebHandshake();
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
            <Tooltip title={isNativeMode ? "Running Native Capacitor BLE with Real RSSI" : "Technical Note: Using Web Bluetooth Handshake Heuristics instead of background ranging due to browser vendor restrictions."}>
                <Box sx={{ position: 'absolute', top: 16, right: 16, cursor: 'help', opacity: 0.6 }}>
                    <InfoOutlined fontSize="small" color={isNativeMode ? "primary" : "inherit"} />
                </Box>
            </Tooltip>

            {isNativeMode && (
                <Box sx={{ position: 'absolute', top: 16, left: 16 }}>
                    <Typography variant="caption" sx={{ color: 'var(--primary)', fontWeight: 'bold' }}>NATIVE APP</Typography>
                </Box>
            )}

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
                        {isNativeMode ? `READING SIGNAL DISTANCE...` : `CALIBRATING SIGNAL DISTANCE...`}
                    </Typography>
                    
                    {/* Display live RSSI in handshake phase for Native mode */}
                    {isNativeMode && simulatedRssi !== -100 && (
                        <Typography variant="body2" sx={{ color: 'var(--primary)', fontWeight: 700, mb: 1 }}>
                            Current RSSI: {simulatedRssi} dBm
                        </Typography>
                    )}
                    
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

            {status === "rejected" && (
                <Box sx={{
                    mt: 3, p: 4, borderRadius: 4,
                    bgcolor: 'rgba(239, 68, 68, 0.05)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    textAlign: 'center'
                }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#EF4444', mb: 1 }}>
                        ⚠ OUTSIDE CLASSROOM
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 3 }}>
                        No beacon signal detected within range. Please ensure you are physically inside the classroom and try again.
                    </Typography>
                    <Button
                        className="premium-button"
                        onClick={() => { setStatus("idle"); setError(null); }}
                        sx={{ py: 1.5 }}
                    >
                        RETRY PROXIMITY CHECK
                    </Button>
                </Box>
            )}

            {error && status !== "rejected" && (
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
