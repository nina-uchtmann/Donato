import * as ImagePicker from 'expo-image-picker';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { LinearGradient } from 'expo-linear-gradient';
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
import { SafeAreaView } from 'react-native-safe-area-context';

import { CATEGORIES, CATEGORY_KEYS, colors, type Category } from '@/constants/categories';
import { classifyAll } from '@/lib/classify';
import { detectLabels, hasVisionKey, type VisionLabel } from '@/lib/vision';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  base64: true,
  quality: 0.5,
};

export default function CaptureScreen() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
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

  if (!fontsLoaded) {
    return (
      <View style={styles.fontLoading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#EAF6EF', colors.background, '#FFFFFF']}
      locations={[0, 0.58, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'bottom', 'left']}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.brandRow}>
            <Text style={styles.brand}>Donato</Text>
            <Image
              source={require('../../assets/Donato logo.png')}
              style={styles.brandLogo}
              resizeMode="contain"
              accessible={false}
            />
          </View>
          <View style={styles.hero}>
            <Text style={styles.title}>Snap it.{'\n'}Sort it.{'\n'}Donate it.</Text>
            <Text style={styles.subtitle}>
              Give your stuff a second life. Take a photo of something you'd like to donate and we'll find nearby places that accept it.
            </Text>
          </View>

          <View style={styles.photoBox}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} />
            ) : (
              <View style={styles.photoPrompt}>
                <View style={styles.photoIcon}>
                  <Text style={styles.photoIconText}>+</Text>
                </View>
                <Text style={styles.photoTitle}>Add a photo</Text>
                <Text style={styles.photoHint}>Take or upload one to get started</Text>
              </View>
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
            <Button label="Choose photo" variant="secondary" onPress={() => pickPhoto('library')} />
          </View>

          {!hasVisionKey && (
            <Text style={styles.notice}>
              Auto-detect is off. Add EXPO_PUBLIC_GOOGLE_VISION_API_KEY to .env to identify items
              with Google Vision. For now, pick categories below.
            </Text>
          )}
          {error && <Text style={styles.notice}>{error}</Text>}

          {labels.length > 0 && (
            <Text style={styles.labels}>
              Detected: {labels.slice(0, 5).map((l) => l.description).join(', ')}
            </Text>
          )}

          <View style={styles.categoryHeading}>
            <Text style={styles.sectionTitle}>
              {detected ? 'Looks like:' : 'What are you donating?'}
            </Text>
            <Text style={styles.hint}>Select all that apply</Text>
          </View>
          <View style={styles.categoryGrid}>
            {CATEGORY_KEYS.map((key) => {
              const isSelected = selected.includes(key);
              return (
                <Pressable
                  key={key}
                  onPress={() => toggle(key)}
                  style={({ pressed }) => [
                    styles.categoryCard,
                    isSelected && styles.categoryCardSelected,
                    pressed && styles.categoryCardPressed,
                  ]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                >
                  {isSelected && <Text style={styles.selectedMark}>✓</Text>}
                  <Text style={styles.categoryEmoji}>{CATEGORIES[key].emoji}</Text>
                  <Text
                    numberOfLines={1}
                    style={[styles.categoryText, isSelected && styles.categoryTextSelected]}
                  >
                    {CATEGORIES[key].label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Button
            fullWidth
            label={
              selected.length > 1
                ? `Find spots for ${selected.length} kinds of items`
                : 'Find donation spots'
            }
            disabled={!selected.length || loading}
            onPress={() =>
              router.push({ pathname: '/results', params: { categories: selected.join(',') } })
            }
          />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  fullWidth = false,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  fullWidth?: boolean;
}) {
  const secondary = variant === 'secondary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        fullWidth ? styles.buttonFullWidth : styles.buttonInRow,
        secondary && styles.buttonSecondary,
        (pressed || disabled) && { opacity: disabled ? 0.4 : 0.8 },
      ]}
    >
      <Text style={[styles.buttonText, secondary && styles.buttonTextSecondary]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  fontLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  container: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 32, gap: 18 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  brand: { fontFamily: 'Inter_700Bold', fontSize: 22, color: colors.primary },
  brandLogo: { width: 27, height: 27 },
  hero: { gap: 10, marginBottom: 2 },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 38,
    lineHeight: 43,
    letterSpacing: -1.2,
    color: colors.text,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.muted,
    lineHeight: 23,
    maxWidth: 360,
  },
  photoBox: {
    height: 214,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: { width: '100%', height: '100%' },
  photoPrompt: { alignItems: 'center', gap: 7 },
  photoIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  photoIconText: { fontFamily: 'Inter_400Regular', fontSize: 34, lineHeight: 38, color: colors.primary },
  photoTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.text },
  photoHint: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.muted },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: { color: '#fff', fontFamily: 'Inter_600SemiBold' },
  row: { flexDirection: 'row', gap: 12 },
  notice: {
    backgroundColor: colors.warningBg,
    color: colors.warning,
    padding: 12,
    borderRadius: 10,
    fontSize: 13,
    lineHeight: 18,
  },
  labels: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.muted },
  categoryHeading: { gap: 3, marginTop: 4 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 19, color: colors.text },
  hint: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.muted },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  categoryCard: {
    width: '48%',
    minHeight: 98,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
  },
  categoryCardSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  categoryCardPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  categoryEmoji: { fontSize: 24 },
  categoryText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.text,
    textAlign: 'center',
  },
  categoryTextSelected: { fontFamily: 'Inter_600SemiBold', color: colors.primary },
  selectedMark: {
    position: 'absolute',
    right: 10,
    top: 9,
    color: colors.primary,
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  button: {
    backgroundColor: colors.primary,
    minHeight: 48,
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonInRow: { flex: 1 },
  buttonFullWidth: { marginTop: 2 },
  buttonSecondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonText: { color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  buttonTextSecondary: { color: colors.primary },
});
