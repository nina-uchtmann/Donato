import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CATEGORIES, CATEGORY_KEYS, colors, type Category } from '@/constants/categories';
import { classifyAll } from '@/lib/classify';
import { detectLabels, hasVisionKey, type VisionLabel } from '@/lib/vision';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  base64: true,
  quality: 0.5,
};

export default function CaptureScreen() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [labels, setLabels] = useState<VisionLabel[]>([]);
  /** Selected categories; a photo of a donation pile can have several. */
  const [selected, setSelected] = useState<Category[]>([]);
  const [detected, setDetected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setPhotoUri(null);
      setLabels([]);
      setSelected([]);
      setDetected(false);
      setLoading(false);
      setError(null);
    }, [])
  );

  async function pickPhoto(source: 'camera' | 'library') {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', `Allow ${source} access in Settings to add a photo.`);
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
        : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    if (result.canceled) return;

    const asset = result.assets[0];
    setPhotoUri(asset.uri);
    setLabels([]);
    setSelected([]);
    setDetected(false);
    setError(null);

    if (hasVisionKey && asset.base64) await identify(asset.base64);
  }

  function toggle(key: Category) {
    setSelected((current) =>
      current.includes(key) ? current.filter((c) => c !== key) : [...current, key],
    );
  }

  async function identify(base64: string) {
    setLoading(true);
    try {
      const visionLabels = await detectLabels(base64);
      setLabels(visionLabels);
      const matches = classifyAll(visionLabels);
      setSelected(matches);
      setDetected(matches.length > 0);
      if (!matches.length) setError("Couldn't tell what this is. Pick categories below.");
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong identifying the item.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Snap it. Sort it. Donate it.</Text>
      <Text style={styles.subtitle}>
        Take a photo of something you'd like to donate and we'll find nearby places that accept it.
      </Text>

      <View style={styles.photoBox}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} />
        ) : (
          <Text style={styles.photoPlaceholder}>
            📷{'\n'}Add a photo to start{'\n'}Take a photo or upload one
          </Text>
        )}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Identifying…</Text>
          </View>
        )}
      </View>

      <View style={styles.row}>
        <Button label="Take photo" onPress={() => pickPhoto('camera')} />
        <Button label="Upload" variant="secondary" onPress={() => pickPhoto('library')} />
      </View>

      {!hasVisionKey && (
        <Text style={styles.notice}>
          Auto-detect is off. Add EXPO_PUBLIC_GOOGLE_VISION_API_KEY to .env to identify items with
          Google Vision. For now, pick categories below.
        </Text>
      )}
      {error && <Text style={styles.notice}>{error}</Text>}

      {labels.length > 0 && (
        <Text style={styles.labels}>
          Detected: {labels.slice(0, 5).map((l) => l.description).join(', ')}
        </Text>
      )}

      <View>
        <Text style={styles.sectionTitle}>
          {detected ? 'Looks like:' : 'What are you donating?'}
        </Text>
        <Text style={styles.hint}>Tap to add or remove. Pick several for a mixed pile.</Text>
      </View>
      <View style={styles.chips}>
        {CATEGORY_KEYS.map((key) => {
          const isSelected = selected.includes(key);
          return (
            <Pressable
              key={key}
              onPress={() => toggle(key)}
              style={[styles.chip, isSelected && styles.chipSelected]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {isSelected ? '✓ ' : ''}
                {CATEGORIES[key].emoji} {CATEGORIES[key].label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Button
        label={selected.length > 1 ? `Find spots for ${selected.length} kinds of items` : 'Find donation spots'}
        disabled={!selected.length || loading}
        onPress={() =>
          router.push({ pathname: '/results', params: { categories: selected.join(',') } })
        }
      />
    </ScrollView>
  );
}

function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}) {
  const secondary = variant === 'secondary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.buttonSecondary,
        (pressed || disabled) && { opacity: disabled ? 0.4 : 0.8 },
      ]}
    >
      <Text style={[styles.buttonText, secondary && styles.buttonTextSecondary]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 15, color: colors.muted, lineHeight: 21 },
  photoBox: {
    height: 260,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: { fontSize: 16, color: colors.muted, textAlign: 'center', lineHeight: 28 },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: { color: '#fff', fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12 },
  notice: {
    backgroundColor: colors.warningBg,
    color: colors.warning,
    padding: 12,
    borderRadius: 10,
    fontSize: 13,
    lineHeight: 18,
  },
  labels: { fontSize: 13, color: colors.muted },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  hint: { fontSize: 13, color: colors.muted, marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 14, color: colors.text },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  button: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  buttonTextSecondary: { color: colors.primary },
});
