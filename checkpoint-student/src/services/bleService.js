import { Capacitor } from '@capacitor/core';
import { BleClient } from '@capacitor-community/bluetooth-le';

const isNative = Capacitor.isNativePlatform();

export const bleService = {
    isNative,

    async initialize() {
        if (isNative) {
            await BleClient.initialize();
        }
    },

    async startNativeScan(onResult, onError) {
        if (!isNative) return;

        try {
            await BleClient.requestLEScan(
                {
                    // Optionally filter for the MBeacon names:
                    // However, sometimes it's better to scan all and filter in JS 
                    // for best cross-platform reliability initially.
                },
                (result) => {
                    const name = result.device.name || result.localName;
                    if (name && name.toLowerCase().includes('mbeacon')) {
                        onResult({
                            name,
                            rssi: result.rssi,
                            deviceId: result.device.deviceId
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
            console.error("Error stopping scan:", error);
        }
    },

    async startWebScan() {
        if (isNative) {
            console.warn("startWebScan called on native device.");
            return null;
        }

        const device = await navigator.bluetooth.requestDevice({
            filters: [
                { name: 'MBeacon' },
                { name: 'mbeacon' },
                { services: [0xFDA5] }
            ],
            optionalServices: ['battery_service', 0xFDA5]
        });

        return device;
    }
};
