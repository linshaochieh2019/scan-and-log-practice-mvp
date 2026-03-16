import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { CameraView, type BarcodeScanningResult, useCameraPermissions } from 'expo-camera';

import { Text, View } from '@/components/Themed';

export default function TabOneScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [barcodeValue, setBarcodeValue] = useState<string | null>(null);
  const hasScanned = useRef(false);

  const handleStartScan = useCallback(async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }

    hasScanned.current = false;
    setBarcodeValue(null);
    setIsScanning(true);
  }, [permission?.granted, requestPermission]);

  const handleCancelScan = useCallback(() => {
    setIsScanning(false);
  }, []);

  const handleBarcodeScanned = useCallback((result: BarcodeScanningResult) => {
    if (hasScanned.current) return;

    hasScanned.current = true;
    setBarcodeValue(result.data);
    setIsScanning(false);
  }, []);

  const permissionDenied = permission && !permission.granted && permission.canAskAgain === false;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello Scanner</Text>

      {!isScanning ? (
        <View style={styles.panel}>
          <Text style={styles.description}>
            Tap the button below to scan a barcode and show the value.
          </Text>

          {permissionDenied ? (
            <Text style={styles.warning}>
              Camera access is blocked. Enable camera permission in device settings.
            </Text>
          ) : null}

          <Pressable style={styles.button} onPress={handleStartScan}>
            <Text style={styles.buttonText}>Tap to Scan</Text>
          </Pressable>

          <Text style={styles.resultLabel}>Scanned Barcode:</Text>
          <Text style={styles.resultValue}>{barcodeValue ?? 'No scan yet'}</Text>
        </View>
      ) : (
        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['aztec', 'ean13', 'ean8', 'pdf417', 'qr', 'upc_a', 'upc_e', 'code128', 'code39'],
            }}
            onBarcodeScanned={handleBarcodeScanned}
          />
          <Text style={styles.helperText}>Point camera at a barcode</Text>
          <Pressable style={[styles.button, styles.cancelButton]} onPress={handleCancelScan}>
            <Text style={styles.buttonText}>Cancel</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  panel: {
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
  },
  warning: {
    color: '#b54708',
    textAlign: 'center',
    fontWeight: '600',
  },
  button: {
    alignSelf: 'center',
    minHeight: 64,
    minWidth: 180,
    backgroundColor: '#0a7ea4',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#475467',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  resultLabel: {
    fontWeight: '600',
  },
  resultValue: {
    fontSize: 16,
  },
  scannerContainer: {
    gap: 10,
    alignItems: 'center',
  },
  camera: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  helperText: {
    fontSize: 14,
    opacity: 0.75,
  },
});