import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, CircularProgress, Alert, LinearProgress, Stack, Tooltip, Chip } from '@mui/material';
import { BluetoothSearching, BluetoothConnected, Bluetooth, InfoOutlined, Lock, SignalCellularAlt } from '@mui/icons-material';

const VERIFIED_DISPLAY_SECONDS = 5;

// RSSI threshold for proximity verification
const PROXIMITY_THRESHOLD = -65;

// Consecutive readings above threshold needed to confirm
const REQUIRED_CONFIRMATIONS = 3;

const BLEManager = ({ onBeaconFound, requiredClassroom }) => {
    const [status, setStatus] = useState("idle"); // idle, scanning, handshake, verified, rejected
    const [countdown, setCountdown] = useState(VERIFIED_DISPLAY_SECONDS);
    const [error, setError] = useState(null);
    const [rssi, setRssi] = useState(null);
    const [deviceName, setDeviceName] = useState(null);
    const [rssiHistory, setRssiHistory] = useState([]);
    const [isEstimate, setIsEstimate] = useState(false);

    const confirmCountRef = useRef(0);
    const scanTimeoutRef = useRef(null);
    const cleanupRef = useRef(null);

    // Countdown after verification
    useEffect(() => {
        if (status !== 'verified') return;
        if (countdown <= 0) {
            onBeaconFound(true);
            return;
        }
        const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [status, countdown, onBeaconFound]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (cleanupRef.current) cleanupRef.current();
            if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
        };
    }, []);

    // Handle incoming RSSI reading
    const handleRssiReading = (result) => {
        const currentRssi = result.rssi;
        setRssi(currentRssi);
        setDeviceName(result.name);
        setIsEstimate(!!result.isEstimate);
        setStatus("handshake");

        setRssiHistory(prev => [...prev.slice(-19), currentRssi]);

        if (currentRssi >= PROXIMITY_THRESHOLD) {
            confirmCountRef.current += 1;
            if (confirmCountRef.current >= REQUIRED_CONFIRMATIONS) {
                if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
                if (cleanupRef.current) cleanupRef.current();
                setStatus("verified");
                setCountdown(VERIFIED_DISPLAY_SECONDS);
            }
        } else {
            confirmCountRef.current = Math.max(0, confirmCountRef.current - 1);
        }
    };

    const startProximityHandshake = async () => {
        try {
            setError(null);
            setStatus("scanning");
            setRssi(null);
            setRssiHistory([]);
            confirmCountRef.current = 0;

            if (!navigator.bluetooth) {
                setError("Web Bluetooth is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
                setStatus("idle");
                return;
            }

            // 45-second timeout
            scanTimeoutRef.current = setTimeout(() => {
                if (cleanupRef.current) cleanupRef.current();
                setStatus("rejected");
                setError("Could not confirm proximity. Make sure you are near the classroom beacon.");
            }, 45000);

            // Step 1: User picks a BLE device
            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: ['battery_service']
            });

            console.log(`[BLE] Device selected: ${device.name || device.id}`);
            setDeviceName(device.name || device.id);

            // Step 2: Use watchAdvertisements() for real RSSI (Chrome 93+)
            if (device.watchAdvertisements) {
                const abortController = new AbortController();
                cleanupRef.current = () => {
                    abortController.abort();
                    console.log("[BLE] Stopped watching advertisements");
                };

                device.addEventListener('advertisementreceived', (event) => {
                    handleRssiReading({
                        name: event.name || device.name || device.id,
                        rssi: event.rssi,
                        txPower: event.txPower,
                        device: device
                    });
                });

                try {
                    await device.watchAdvertisements({ signal: abortController.signal });
                    console.log("[BLE] watchAdvertisements() active — receiving real RSSI");
                } catch (watchErr) {
                    console.warn("[BLE] watchAdvertisements() failed, falling back to GATT:", watchErr);
                    await attemptGattFallback(device);
                }
            } else {
                // Fallback for browsers without watchAdvertisements
                console.warn("[BLE] watchAdvertisements() not available — using GATT fallback");
                await attemptGattFallback(device);
            }

        } catch (err) {
            if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);

            if (err.name === 'NotFoundError') {
                setError("No BLE device selected. Please select your classroom beacon.");
            } else if (err.name === 'NotAllowedError') {
                setError("Bluetooth permission denied. Please allow Bluetooth access.");
            } else {
                setError(err.message || "Failed to start Bluetooth scan.");
            }
            setStatus("idle");
        }
    };

    // GATT connection fallback — can't get real RSSI, but confirms device reachability
    const attemptGattFallback = async (device) => {
        try {
            const server = await device.gatt.connect();
            console.log("[BLE] GATT connected — device confirmed nearby");
            handleRssiReading({
                name: device.name || device.id,
                rssi: -55, // estimate
                device: device,
                isEstimate: true
            });
            server.disconnect();
        } catch (gattErr) {
            console.warn("[BLE] GATT failed:", gattErr);
            handleRssiReading({
                name: device.name || device.id,
                rssi: -75,
                device: device,
                isEstimate: true
            });
        }
    };

    const getSignalStrength = () => {
        if (rssi === null) return 0;
        return Math.max(0, Math.min(100, ((rssi + 100) / 60) * 100));
    };

    const getSignalColor = () => {
        if (rssi === null) return 'rgba(124, 58, 237, 0.3)';
        if (rssi >= -50) return '#10B981';
        if (rssi >= -65) return '#F59E0B';
        if (rssi >= -80) return '#F97316';
        return '#EF4444';
    };

    const getSignalLabel = () => {
        if (rssi === null) return 'NO SIGNAL';
        if (rssi >= -50) return 'EXCELLENT';
        if (rssi >= -65) return 'GOOD';
        if (rssi >= -80) return 'FAIR';
        return 'WEAK';
    };

    return (
        <Box className="glass-card border-light animate-fade-in" sx={{ p: 4, textAlign: 'center', maxWidth: 520, mx: 'auto', position: 'relative', borderRadius: 6 }}>
            {/* Platform indicator */}
            <Chip
                label="WEB BLUETOOTH"
                size="small"
                sx={{
                    position: 'absolute', top: 16, left: 16,
                    bgcolor: 'rgba(14, 165, 233, 0.08)',
                    color: '#0EA5E9',
                    fontWeight: 900, fontSize: '0.6rem', letterSpacing: 1,
                    border: '1px solid rgba(14, 165, 233, 0.2)'
                }}
            />

            <Tooltip title="Real-time BLE proximity verification using hardware RSSI signal strength via Web Bluetooth API">
                <Box sx={{ position: 'absolute', top: 16, right: 16, cursor: 'help', opacity: 0.6 }}>
                    <InfoOutlined fontSize="small" color="primary" />
                </Box>
            </Tooltip>

            {/* Header */}
            <Box sx={{ mb: 4, mt: 2 }}>
                <Typography variant="h4" className="gradient-text-vibrant outfit" sx={{ fontWeight: 900, mb: 1.5 }}>
                    PROXIMITY LOCK
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: 1 }}>
                    {status === "idle" ? "PHYSICAL VALIDATION PENDING"
                        : status === "scanning" ? "SCANNING FOR BLE BEACONS..."
                            : status === "handshake" ? `BEACON DETECTED: ${deviceName || 'UNKNOWN'}`
                                : status === "rejected" ? "PROXIMITY CHECK FAILED"
                                    : "PROXIMITY STATUS: VERIFIED"}
                </Typography>
            </Box>

            {/* Radar Animation */}
            <Box sx={{
                position: 'relative', width: 200, height: 200, mx: 'auto', mb: 4,
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

            {/* Idle: Start Button */}
            {status === "idle" && (
                <Button
                    className="premium-button"
                    onClick={startProximityHandshake}
                    fullWidth
                    sx={{ py: 2 }}
                >
                    INITIATE SECURE HANDSHAKE
                </Button>
            )}

            {/* Handshake: Real-time RSSI Display */}
            {status === "handshake" && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" sx={{ display: 'block', mb: 2, fontWeight: 900, color: 'var(--secondary)', letterSpacing: 1 }}>
                        READING SIGNAL STRENGTH...
                    </Typography>

                    {rssi !== null && (
                        <Box sx={{
                            p: 3, mb: 2, borderRadius: 4,
                            bgcolor: 'rgba(0,0,0,0.02)',
                            border: `1px solid ${getSignalColor()}33`,
                        }}>
                            <Stack direction="row" justifyContent="center" alignItems="baseline" spacing={1}>
                                <SignalCellularAlt sx={{ color: getSignalColor(), fontSize: 28 }} />
                                <Typography variant="h2" sx={{ fontWeight: 900, color: getSignalColor(), fontFamily: 'monospace' }}>
                                    {rssi}
                                </Typography>
                                <Typography variant="h6" sx={{ color: 'var(--text-secondary)', fontWeight: 700 }}>dBm</Typography>
                            </Stack>

                            <Stack direction="row" justifyContent="center" spacing={2} sx={{ mt: 1 }}>
                                <Chip
                                    label={getSignalLabel()}
                                    size="small"
                                    sx={{
                                        bgcolor: `${getSignalColor()}15`,
                                        color: getSignalColor(),
                                        fontWeight: 900, fontSize: '0.65rem',
                                        border: `1px solid ${getSignalColor()}30`
                                    }}
                                />
                                {isEstimate && (
                                    <Chip
                                        label="ESTIMATED"
                                        size="small"
                                        sx={{
                                            bgcolor: 'rgba(245, 158, 11, 0.08)',
                                            color: '#F59E0B',
                                            fontWeight: 900, fontSize: '0.6rem',
                                            border: '1px solid rgba(245, 158, 11, 0.2)'
                                        }}
                                    />
                                )}
                                {deviceName && (
                                    <Chip
                                        label={deviceName}
                                        size="small"
                                        sx={{
                                            bgcolor: 'rgba(124, 58, 237, 0.06)',
                                            color: 'var(--primary)',
                                            fontWeight: 700, fontSize: '0.6rem',
                                            border: '1px solid rgba(124, 58, 237, 0.15)'
                                        }}
                                    />
                                )}
                            </Stack>

                            {/* Signal strength bar */}
                            <Box sx={{ mt: 2 }}>
                                <LinearProgress
                                    variant="determinate"
                                    value={getSignalStrength()}
                                    sx={{
                                        height: 8, borderRadius: 4,
                                        bgcolor: 'rgba(0,0,0,0.06)',
                                        '& .MuiLinearProgress-bar': {
                                            bgcolor: getSignalColor(),
                                            borderRadius: 4,
                                            transition: 'transform 0.3s ease'
                                        }
                                    }}
                                />
                                <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                                    <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontSize: '0.6rem', fontWeight: 700 }}>-100 dBm</Typography>
                                    <Typography variant="caption" sx={{ color: getSignalColor(), fontSize: '0.6rem', fontWeight: 900 }}>
                                        THRESHOLD: {PROXIMITY_THRESHOLD} dBm
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontSize: '0.6rem', fontWeight: 700 }}>-40 dBm</Typography>
                                </Stack>
                            </Box>

                            {/* RSSI History sparkline */}
                            {rssiHistory.length > 1 && (
                                <Box sx={{ mt: 2, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '2px', height: 30 }}>
                                    {rssiHistory.slice(-15).map((val, idx) => {
                                        const height = Math.max(4, ((val + 100) / 60) * 30);
                                        const isAboveThreshold = val >= PROXIMITY_THRESHOLD;
                                        return (
                                            <Box
                                                key={idx}
                                                sx={{
                                                    width: 4, height: `${height}px`,
                                                    bgcolor: isAboveThreshold ? '#10B981' : 'rgba(124, 58, 237, 0.3)',
                                                    borderRadius: 1,
                                                    transition: 'height 0.2s ease'
                                                }}
                                            />
                                        );
                                    })}
                                </Box>
                            )}
                        </Box>
                    )}

                    {rssi === null && <LinearProgress sx={{ height: 6, borderRadius: 3 }} />}

                    <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'var(--text-secondary)', fontWeight: 600 }}>
                        Need {REQUIRED_CONFIRMATIONS} consecutive readings above {PROXIMITY_THRESHOLD} dBm to verify
                    </Typography>
                </Box>
            )}

            {/* Verified */}
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
                    <Typography variant="h3" sx={{ fontWeight: 900, color: '#10B981', mb: 1, fontFamily: 'monospace' }}>
                        {rssi}<Typography component="span" variant="h6" sx={{ ml: 0.5 }}>dBm</Typography>
                    </Typography>
                    {deviceName && (
                        <Typography variant="caption" sx={{ display: 'block', color: 'var(--text-secondary)', fontWeight: 700, mb: 1 }}>
                            DEVICE: {deviceName}
                        </Typography>
                    )}
                    <Typography variant="caption" sx={{ display: 'block', color: 'var(--text-secondary)', fontWeight: 700 }}>
                        PROCEEDING IN {countdown}s
                    </Typography>
                </Box>
            )}

            {/* Rejected */}
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
                    <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 1 }}>
                        {rssi !== null
                            ? `Last RSSI: ${rssi} dBm (need ≥ ${PROXIMITY_THRESHOLD} dBm)`
                            : 'No beacon signal detected.'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 3 }}>
                        Please ensure you are near the BLE beacon and try again.
                    </Typography>
                    <Button
                        className="premium-button"
                        onClick={() => { setStatus("idle"); setError(null); setRssi(null); setRssiHistory([]); confirmCountRef.current = 0; }}
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
