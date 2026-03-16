import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { CameraView, type BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';

import { Text, View } from '@/components/Themed';
import { SCAN_TYPES, type ScanType } from '@/lib/scan-log';
import { supabase } from '@/lib/supabase';

const statusLabelMap: Record<ScanType, string> = {
  receive: 'Receive',
  dispatch: 'Dispatch',
  check: 'Check',
};

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [barcodeValue, setBarcodeValue] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<ScanType>('receive');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const hasScanned = useRef(false);

  const handleStartScan = useCallback(async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }

    hasScanned.current = false;
    setBarcodeValue(null);
    setMessage(null);
    setNotes('');
    setSelectedType('receive');
    setIsScanning(true);

    const locationPermission = await Location.requestForegroundPermissionsAsync();
    if (locationPermission.granted) {
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        .then((position) => {
          setCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        })
        .catch(() => {
          setCoords(null);
        });
    } else {
      setCoords(null);
    }
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

  const handleSubmitLog = useCallback(async () => {
    if (!barcodeValue) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('Please sign in first. No authenticated Supabase user found.');
      }

      const { error: insertError } = await supabase.from('scan_logs').insert({
        user_id: user.id,
        barcode: barcodeValue,
        scan_type: selectedType,
        status: statusLabelMap[selectedType],
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        notes: notes.trim() || null,
      });

      if (insertError) {
        throw new Error(insertError.message);
      }

      setMessage('Saved to Supabase.');
      setBarcodeValue(null);
      setNotes('');
      setSelectedType('receive');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to save scan log.');
    } finally {
      setIsSaving(false);
    }
  }, [barcodeValue, coords, notes, selectedType]);

  const permissionDenied = permission && !permission.granted && permission.canAskAgain === false;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan + Log</Text>

      {!isScanning ? (
        <View style={styles.panel}>
          <Text style={styles.description}>Scan barcode, set status, add notes, then save to Supabase.</Text>

          {permissionDenied ? (
            <Text style={styles.warning}>Camera access is blocked. Enable camera permission in device settings.</Text>
          ) : null}

          <Pressable style={styles.button} onPress={handleStartScan}>
            <Text style={styles.buttonText}>Tap to Scan</Text>
          </Pressable>

          <Text style={styles.resultLabel}>Scanned Barcode</Text>
          <Text style={styles.resultValue}>{barcodeValue ?? 'No scan yet'}</Text>

          {barcodeValue ? (
            <View style={styles.formCard}>
              <Text style={styles.resultLabel}>Status</Text>
              <View style={styles.segmentRow}>
                {SCAN_TYPES.map((type) => {
                  const active = selectedType === type;
                  return (
                    <Pressable
                      key={type}
                      style={[styles.segmentButton, active && styles.segmentButtonActive]}
                      onPress={() => setSelectedType(type)}>
                      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{statusLabelMap[type]}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.resultLabel}>Notes (optional)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Add a quick note"
                multiline
                numberOfLines={3}
                style={styles.notesInput}
              />

              <Pressable style={[styles.button, isSaving && styles.disabledButton]} onPress={handleSubmitLog} disabled={isSaving}>
                <Text style={styles.buttonText}>{isSaving ? 'Saving...' : 'Save Log'}</Text>
              </Pressable>
            </View>
          ) : null}

          {message ? <Text style={styles.message}>{message}</Text> : null}
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
  formCard: {
    gap: 10,
    backgroundColor: 'transparent',
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'transparent',
  },
  segmentButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#d0d5dd',
  },
  segmentButtonActive: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  segmentText: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#344054',
  },
  segmentTextActive: {
    color: '#fff',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#d0d5dd',
    borderRadius: 10,
    padding: 10,
    minHeight: 84,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
  },
  disabledButton: {
    opacity: 0.7,
  },
  message: {
    fontSize: 14,
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