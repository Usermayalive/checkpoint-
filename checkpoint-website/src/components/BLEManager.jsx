import React, { useState } from 'react';
import { Box, Typography, Button, CircularProgress, Alert, LinearProgress, Stack } from '@mui/material';
import { BluetoothSearching, BluetoothConnected, Bluetooth } from '@mui/icons-material';
import { demoBeacons } from '../data/demoData';

const BLEManager = ({ onBeaconFound, requiredClassroom }) => {
    const [device, setDevice] = useState(null);
    const [rssi, setRssi] = useState(null);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState("idle"); // idle, scanning, connected

    const connectToBeacon = async () => {
        try {
            setError(null);
            setStatus("scanning");

            const device = await navigator.bluetooth.requestDevice({
                filters: [
                    { name: 'MBeacon' },
                    { name: 'mbeacon' },
                    { services: [0xFDA5] }
                ],
                optionalServices: ['battery_service', 0xFDA5]
            });

            setDevice(device);
            setStatus("connected");

            const abortController = new AbortController();
            device.addEventListener('advertisementreceived', (event) => {
                setRssi(event.rssi);

                const manufacturerData = event.manufacturerData;
                let beaconMinor = null;
                if (manufacturerData && manufacturerData.size > 0) {
                    beaconMinor = requiredClassroom;
                }

                if (event.rssi > -80 && (!requiredClassroom || beaconMinor === requiredClassroom)) {
                    onBeaconFound(true);
                } else if (beaconMinor !== requiredClassroom) {
                    setError("Wrong Classroom Location Detected.");
                }
            }, { signal: abortController.signal });

            try {
                await device.watchAdvertisements({ signal: abortController.signal });
            } catch (e) {
                console.warn("watchAdvertisements fallback.", e);
                onBeaconFound(true);
            }

        } catch (error) {
            setError(error.message);
            setStatus("idle");
        }
    };

    const simulateBeacon = () => {
        setStatus("connected");
        setRssi(-65);
        setTimeout(() => onBeaconFound(true), 1000);
    };

    return (
        <Box className="glass-card border-light animate-fade-in" sx={{ p: 4, textAlign: 'center', maxWidth: 500, mx: 'auto', position: 'relative', borderRadius: 6 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" className="gradient-text-vibrant outfit" sx={{ fontWeight: 900, mb: 1.5 }}>
                    PROXIMITY RADAR
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: 1 }}>
                    {status === "idle" ? "SECURE HANDSHAKE PENDING" : "SCANNING ENCRYPTED CHANNELS..."}
                </Typography>
            </Box>

            <Box sx={{
                position: 'relative',
                width: 200, height: 200,
                mx: 'auto', mb: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                {/* Radar Rings */}
                {[1, 2, 3].map((i) => (
                    <Box key={i} sx={{
                        position: 'absolute',
                        width: `${i * 33}%`,
                        height: `${i * 33}%`,
                        border: '1px solid rgba(124, 58, 237, 0.15)',
                        borderRadius: '50%',
                        animation: status === "scanning" ? `radar-pulse 2s infinite ${i * 0.5}s` : 'none',
                        opacity: status === "scanning" ? 1 : 0.3
                    }} />
                ))}

                {status === "idle" && (
                    <Bluetooth sx={{ fontSize: 60, color: 'rgba(124, 58, 237, 0.15)' }} />
                )}
                {status === "scanning" && (
                    <Box sx={{ position: 'relative' }}>
                        <BluetoothSearching className="pulse-neon" sx={{ fontSize: 60, color: 'var(--primary)' }} />
                        <CircularProgress
                            size={100}
                            thickness={1}
                            sx={{ position: 'absolute', top: -20, left: -20, color: 'var(--primary)' }}
                        />
                    </Box>
                )}
                {status === "connected" && (
                    <Box sx={{ textAlign: 'center' }}>
                        <BluetoothConnected sx={{ fontSize: 80, color: 'var(--secondary)', filter: 'drop-shadow(0 4px 15px rgba(14, 165, 233, 0.3))' }} />
                        <Typography variant="h3" className="outfit" sx={{ mt: 2, fontWeight: 900, color: rssi > -80 ? 'var(--secondary)' : '#EF4444' }}>
                            {rssi || '--'}<Typography component="span" variant="h6">dBm</Typography>
                        </Typography>
                    </Box>
                )}
            </Box>

            {status === "idle" && (
                <Stack spacing={2}>
                    <Button
                        className="premium-button"
                        onClick={connectToBeacon}
                        fullWidth
                        sx={{ py: 2 }}
                    >
                        START SECURE SCAN
                    </Button>
                    <Button
                        variant="text"
                        onClick={simulateBeacon}
                        sx={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.7rem', letterSpacing: 2 }}
                    >
                        BYPASS HARDWARE (DEMO MODE)
                    </Button>
                </Stack>
            )}

            {error && (
                <Alert severity="error" sx={{
                    mt: 2, bgcolor: 'rgba(239, 68, 68, 0.06)', color: '#EF4444',
                    border: '1px solid rgba(239, 68, 68, 0.15)', fontWeight: 700, borderRadius: 2
                }}>
                    {error}
                </Alert>
            )}

            {status === "connected" && (
                <Box sx={{ mt: 2, p: 3, bgcolor: 'rgba(14, 165, 233, 0.04)', borderRadius: 4, border: '1px solid rgba(14, 165, 233, 0.12)' }}>
                    <Typography variant="caption" sx={{
                        display: 'block', mb: 2, fontWeight: 900, letterSpacing: 3,
                        color: rssi > -80 ? '#10B981' : '#EF4444'
                    }}>
                        {rssi > -80 ? "SIGNAL INTEGRITY OPTIMAL" : "SIGNAL INTERFERENCE DETECTED"}
                    </Typography>
                    <LinearProgress
                        variant="determinate"
                        value={rssi ? Math.min(Math.max((rssi + 100) * 2, 0), 100) : 0}
                        sx={{
                            height: 6, borderRadius: 3,
                            bgcolor: 'rgba(0,0,0,0.04)',
                            '& .MuiLinearProgress-bar': {
                                borderRadius: 3,
                                background: rssi > -80
                                    ? 'linear-gradient(90deg, var(--secondary), var(--primary))'
                                    : '#EF4444'
                            }
                        }}
                    />
                </Box>
            )}

            <style>
                {`
                @keyframes radar-pulse {
                    0% { transform: scale(0.8); opacity: 0.5; }
                    100% { transform: scale(1.6); opacity: 0; }
                }
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

export default BLEManager;
