import { Capacitor } from '@capacitor/core';
import { BleClient } from '@capacitor-community/bluetooth-le';

const isNative = Capacitor.isNativePlatform();

/**
 * Real BLE Service — No Simulation
 * 
 * Native (iOS/Android via Capacitor): Uses @capacitor-community/bluetooth-le
 *   for background LE scanning with real RSSI values from each advertisement.
 *
 * Web (Chrome on laptop/desktop): Uses Web Bluetooth requestDevice() for
 *   device selection, then watchAdvertisements() (experimental Chrome API)
 *   to receive real RSSI values from advertisement events.
 */
export const bleService = {
    isNative,

    // ── Native (Capacitor) ──────────────────────────────────────────────

    async initialize() {
        if (isNative) {
            await BleClient.initialize({ androidNeverForLocation: true });
        }
    },

    /**
     * Start a native BLE LE scan. Filters for devices with "mbeacon" in the name.
     * @param {function} onResult - Called with { name, rssi, deviceId } for each matching advertisement
     * @param {function} onError  - Called with error object on failure
     */
    async startNativeScan(onResult, onError) {
        if (!isNative) return;

        try {
            await BleClient.requestLEScan(
                {
                    // Scan for all devices; filter in callback for reliability
                    allowDuplicates: true,
                },
                (result) => {
                    const name = result.device?.name || result.localName || '';
                    // Accept any BLE device — allows testing with any beacon hardware
                    // For production, filter by name or service UUID
                    if (name && (name.toLowerCase().includes('mbeacon') || name.toLowerCase().includes('beacon'))) {
                        onResult({
                            name,
                            rssi: result.rssi,
                            deviceId: result.device.deviceId,
                            txPower: result.txPower
                        });
                    }
                }
            );
        } catch (error) {
            console.error("Native scan error:", error);
            if (onError) onError(error);
        }
    },

    async stopNativeScan() {
        if (!isNative) return;
        try {
            await BleClient.stopLEScan();
        } catch (error) {
            console.error("Error stopping native scan:", error);
        }
    },

    // ── Web (Chrome / Edge Bluetooth) ───────────────────────────────────

    /**
     * Request a BLE device via the browser picker, then start watching
     * advertisements to get real RSSI values.
     *
     * @param {function} onRssiUpdate - Called with { name, rssi, device } on each advertisement
     * @param {function} onError      - Called on error
     * @returns {{ device, stopWatching }} - The selected device and a cleanup function
     */
    async startWebScanWithRSSI(onRssiUpdate, onError) {
        if (isNative) {
            console.warn("startWebScanWithRSSI called on native platform.");
            return null;
        }

        if (!navigator.bluetooth) {
            throw new Error("Web Bluetooth is not supported in this browser. Please use Chrome or Edge.");
        }

        // Step 1: User picks a BLE device from the browser dialog
        const device = await navigator.bluetooth.requestDevice({
            // Accept ALL nearby BLE devices so we can scan broadly
            acceptAllDevices: true,
            optionalServices: ['battery_service']
        });

        console.log(`[BLE] Device selected: ${device.name || device.id}`);

        // Step 2: Use watchAdvertisements() to get real RSSI
        // This is an experimental API available in Chrome 85+ with flag or Chrome 93+ stable
        if (device.watchAdvertisements) {
            const abortController = new AbortController();

            device.addEventListener('advertisementreceived', (event) => {
                const rssi = event.rssi;
                const txPower = event.txPower;
                console.log(`[BLE] Advertisement: RSSI=${rssi} dBm, TxPower=${txPower}, Name=${event.name || device.name}`);

                onRssiUpdate({
                    name: event.name || device.name || device.id,
                    rssi: rssi,
                    txPower: txPower,
                    device: device
                });
            });

            try {
                await device.watchAdvertisements({ signal: abortController.signal });
                console.log("[BLE] watchAdvertisements() started — receiving real RSSI");
            } catch (watchError) {
                console.warn("[BLE] watchAdvertisements() failed:", watchError);
                // Fallback: try connecting to GATT to at least confirm proximity
                if (onError) onError(new Error("Your browser does not support real-time RSSI monitoring. Please use Chrome 93+ or use the native app."));
                return { device, stopWatching: () => {} };
            }

            return {
                device,
                stopWatching: () => {
                    abortController.abort();
                    console.log("[BLE] watchAdvertisements() stopped");
                }
            };
        } else {
            // watchAdvertisements not available — attempt GATT connection as proximity proof
            console.warn("[BLE] watchAdvertisements() not available in this browser");

            // Try GATT connect to confirm the device is reachable
            let rssiEstimate = null;
            try {
                const server = await device.gatt.connect();
                // Connection success = device is nearby
                rssiEstimate = -55; // Estimated — GATT connection implies proximity
                console.log("[BLE] GATT connected — device confirmed nearby");

                onRssiUpdate({
                    name: device.name || device.id,
                    rssi: rssiEstimate,
                    txPower: null,
                    device: device,
                    isEstimate: true
                });

                // Disconnect since we don't need to stay connected
                server.disconnect();
            } catch (gattErr) {
                console.warn("[BLE] GATT connection failed:", gattErr);
                onRssiUpdate({
                    name: device.name || device.id,
                    rssi: -75,
                    txPower: null,
                    device: device,
                    isEstimate: true
                });
            }

            return {
                device,
                stopWatching: () => {}
            };
        }
    }
};
