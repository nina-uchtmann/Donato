import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { CATEGORIES, colors, isCategory, type Category } from '@/constants/categories';
import centersData from '@/data/centers.json';
import { distanceMiles, getUserCoords, type Coords } from '@/lib/location';

type Center = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  accepts: Category[];
};

const centers = centersData as Center[];

export default function ResultsScreen() {
  const params = useLocalSearchParams<{ category: string }>();
  const category = isCategory(params.category) ? params.category : null;

  const [coords, setCoords] = useState<Coords | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    getUserCoords().then(({ coords, isFallback }) => {
      setCoords(coords);
      setIsFallback(isFallback);
    });
  }, []);

  const results = useMemo(() => {
    if (!coords) return [];
    return centers
      .filter((c) => !category || c.accepts.includes(category))
      .map((c) => ({ ...c, distance: distanceMiles(coords, c) }))
      .sort((a, b) => a.distance - b.distance);
  }, [coords, category]);

  if (!coords) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.muted}>Finding your location…</Text>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <MapView
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        showsUserLocation={!isFallback}
        initialRegion={{ ...coords, latitudeDelta: 0.12, longitudeDelta: 0.12 }}
      >
        {results.map((c) => (
          <Marker
            key={c.id}
            coordinate={{ latitude: c.latitude, longitude: c.longitude }}
            title={c.name}
            description={c.address}
            pinColor={colors.primary}
          />
        ))}
      </MapView>

      <FlatList
        data={results}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            {category && (
              <Text style={styles.headerTitle}>
                {CATEGORIES[category].emoji} Places that take {CATEGORIES[category].label.toLowerCase()}
              </Text>
            )}
            {isFallback && (
              <Text style={styles.notice}>
                Location unavailable, so distances are from the University of Washington.
              </Text>
            )}
            <Text style={styles.notice}>
              Sample data for testing. Check each location's website before dropping off.
            </Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.muted}>No nearby locations for this category yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.distance}>{item.distance.toFixed(1)} mi</Text>
            </View>
            <Text style={styles.muted}>{item.address}</Text>
            <Text style={styles.accepts}>
              Accepts: {item.accepts.map((a) => CATEGORIES[a].emoji + ' ' + CATEGORIES[a].label).join(' · ')}
            </Text>
            <Pressable
              style={({ pressed }) => [styles.directions, pressed && { opacity: 0.8 }]}
              onPress={() => openDirections(item)}
            >
              <Text style={styles.directionsText}>Directions</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

function openDirections({ latitude, longitude }: Coords) {
  const url =
    Platform.OS === 'ios'
      ? `https://maps.apple.com/?daddr=${latitude},${longitude}`
      : `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  Linking.openURL(url);
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  map: { width: '100%', height: 240 },
  list: { padding: 16, gap: 12 },
  header: { gap: 8, marginBottom: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  notice: {
    backgroundColor: colors.warningBg,
    color: colors.warning,
    padding: 10,
    borderRadius: 10,
    fontSize: 13,
  },
  muted: { color: colors.muted, fontSize: 14 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  cardName: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 },
  distance: { fontSize: 15, fontWeight: '700', color: colors.primary },
  accepts: { fontSize: 13, color: colors.text },
  directions: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  directionsText: { color: colors.primary, fontWeight: '700' },
});
