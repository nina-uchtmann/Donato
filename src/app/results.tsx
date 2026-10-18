import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { CATEGORIES, colors, isCategory, type Category } from '@/constants/categories';
import centersData from '@/data/centers.json';
import importedData from '@/data/imported.json';
import { distanceMiles, geocode, getUserCoords, placeName, type Coords } from '@/lib/location';
import Slider from '@react-native-community/slider';

type Center = {
  id: string;
  name: string;
  /** Missing for some imported places; directions still work from the coordinates. */
  address?: string;
  latitude: number;
  longitude: number;
  accepts: Category[];
  /** Anything to know before going, e.g. "By appointment only". */
  note?: string;
  /** The place's donation page. */
  website?: string;
  phone?: string;
  /** Free-text hours from the source dataset. */
  hours?: string;
  /** Where an imported place came from. Hand-checked places have no source. */
  source?: 'osm' | 'seattle' | 'kingcounty';
  updated?: string;
};

/** Hand-checked places first, then places imported by `npm run import:data`. */
const centers = [...(centersData as Center[]), ...(importedData as Center[])];

const SOURCE_LABELS: Record<NonNullable<Center['source']>, string> = {
  osm: 'OpenStreetMap',
  seattle: 'Seattle open data',
  kingcounty: 'King County',
};

/** Keeps the map responsive in dense areas; the list still shows everything. */
const MAX_MARKERS = 150;

export default function ResultsScreen() {
  const params = useLocalSearchParams<{ category: string }>();
  const category = isCategory(params.category) ? params.category : null;
  const [maxDistance, setMaxDistance] = useState(10);
  /** Where distances are measured from. Starts at the phone's location. */
  const [coords, setCoords] = useState<Coords | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  /** Set when the user moved the search spot; null means "your location". */
  const [movedTo, setMovedTo] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  /** The result card showing hours and notes; only one is open at a time. */
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    resetToMyLocation();
  }, []);

  async function resetToMyLocation() {
    const { coords, isFallback } = await getUserCoords();
    setIsFallback(isFallback);
    setMovedTo(null);
    setSearchError(null);
    setQuery('');
    showOnMap(coords);
  }

  function showOnMap(next: Coords) {
    setCoords(next);
    mapRef.current?.animateToRegion({ ...next, latitudeDelta: 0.12, longitudeDelta: 0.12 }, 400);
  }

  /** Moves the search spot to a point picked on the map, then names it. */
  async function moveTo(next: Coords) {
    setSearchError(null);
    setMovedTo('the pinned spot');
    showOnMap(next);
    const name = await placeName(next);
    if (name) setMovedTo(name);
  }

  async function search() {
    Keyboard.dismiss();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      const found = await geocode(query);
      if (!found) {
        setSearchError(`Couldn't find "${query.trim()}". Try a city, ZIP code, or street address.`);
        return;
      }
      setMovedTo(query.trim());
      showOnMap(found);
    } catch {
      setSearchError("Search isn't available right now. Long-press the map to pick a spot instead.");
    } finally {
      setSearching(false);
    }
  }

  const results = useMemo(() => {
  if (!coords) return [];

  return centers
    .filter((c) => !category || c.accepts.includes(category))
    .map((c) => ({ ...c, distance: distanceMiles(coords, c) }))
    .filter((c) => c.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance);
}, [coords, category, maxDistance]);

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
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={search}
          placeholder="Search a city, ZIP, or address"
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          autoCorrect={false}
        />
        <Pressable
          style={({ pressed }) => [styles.searchButton, pressed && { opacity: 0.8 }]}
          onPress={search}
          disabled={searching}
        >
          {searching ? <ActivityIndicator color="#fff" /> : <Text style={styles.searchButtonText}>Go</Text>}
        </Pressable>
      </View>

      {Platform.OS === 'ios' ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          showsUserLocation={!isFallback}
          initialRegion={{ ...coords, latitudeDelta: 0.12, longitudeDelta: 0.12 }}
          onLongPress={(e) => moveTo(e.nativeEvent.coordinate)}
        >
          {results.slice(0, MAX_MARKERS).map((c) => (
            <Marker
              key={c.id}
              coordinate={{ latitude: c.latitude, longitude: c.longitude }}
              title={c.name}
              description={c.address}
              pinColor={colors.primary}
            />
          ))}
          <Marker
            key="search-spot"
            coordinate={coords}
            title="Searching from here"
            description="Drag the pin or long-press the map to move it"
            pinColor="tomato"
            draggable
            onDragEnd={(e) => moveTo(e.nativeEvent.coordinate)}
            zIndex={1000}
          />
        </MapView>
      ) : (
        <View style={styles.mapUnavailable}>
          <Text style={styles.mapUnavailableText}>
            Map preview is unavailable on Android in Expo Go. Search above to look somewhere else,
            browse nearby places below, and tap Directions to open Google Maps.
          </Text>
        </View>
      )}

      {movedTo && (
        <View style={styles.movedBar}>
          <Text style={styles.movedText} numberOfLines={1}>
            📍 Near {movedTo}
          </Text>
          <Pressable onPress={resetToMyLocation} hitSlop={8}>
            <Text style={styles.movedLink}>Use my location</Text>
          </Pressable>
        </View>
      )}
      {searchError && <Text style={styles.searchError}>{searchError}</Text>}

      {/* Kept outside the FlatList: a native slider inside a scrolling list fights
          the list for the same touch ("Ended a touch event which was not counted
          in trackedTouchCount"). */}
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderTitle}>Search within {maxDistance} miles</Text>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={25}
          step={1}
          value={maxDistance}
          onValueChange={setMaxDistance}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
        />
      </View>

      <FlatList
        data={results}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {category ? `${CATEGORIES[category].emoji} ` : ''}
              {results.length} {results.length === 1 ? 'place' : 'places'} within {maxDistance} mi
            </Text>
            {isFallback && !movedTo && (
              <Text style={styles.notice}>Using UW as your location. Search above to change it.</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.muted}>Nothing nearby yet. Try a larger distance or another spot.</Text>
        }
        ListFooterComponent={
          <Text style={styles.attribution}>
            Hours and rules change, so check before you go.{'\n'}Data: © OpenStreetMap contributors
            (ODbL), City of Seattle, King County.
          </Text>
        }
        renderItem={({ item }) => {
          const expanded = expandedId === item.id;
          const hasDetails = Boolean(item.hours || item.note || item.source);
          return (
            <Pressable
              style={styles.card}
              onPress={() => hasDetails && setExpandedId(expanded ? null : item.id)}
              accessibilityHint={hasDetails ? 'Shows hours and donation notes' : undefined}
            >
              <View style={styles.cardTop}>
                <Text style={styles.cardName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.distance}>{item.distance.toFixed(1)} mi</Text>
              </View>
              <View style={styles.cardMeta}>
                <Text style={[styles.muted, styles.flex]} numberOfLines={1}>
                  {item.address ?? 'No address listed'}
                </Text>
                <Text
                  style={styles.acceptIcons}
                  accessibilityLabel={`Accepts ${item.accepts.map((a) => CATEGORIES[a].label).join(', ')}`}
                >
                  {item.accepts.map((a) => CATEGORIES[a].emoji).join(' ')}
                </Text>
              </View>

              {expanded && (
                <View style={styles.details}>
                  {item.hours && <Text style={styles.detailText}>🕒 {item.hours}</Text>}
                  {item.note && <Text style={styles.detailText}>{item.note}</Text>}
                  <Text style={styles.source}>
                    Accepts {item.accepts.map((a) => CATEGORIES[a].label.toLowerCase()).join(', ')}
                    {item.source ? ` · ${SOURCE_LABELS[item.source]}` : ''}
                    {item.updated ? ` (${item.updated})` : ''}
                  </Text>
                </View>
              )}

              <View style={styles.actions}>
                <ActionButton label="Directions" onPress={() => openDirections(item)} />
                {item.website && <ActionButton label="Info" onPress={() => Linking.openURL(item.website!)} />}
                {item.phone && (
                  <ActionButton
                    label="Call"
                    onPress={() => Linking.openURL(`tel:${item.phone!.replace(/[^\d+]/g, '')}`)}
                  />
                )}
                {hasDetails && (
                  <Text style={styles.moreText}>{expanded ? 'Less ▴' : 'More ▾'}</Text>
                )}
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.directions, pressed && { opacity: 0.8 }]}
      onPress={onPress}
      hitSlop={4}
    >
      <Text style={styles.directionsText}>{label}</Text>
    </Pressable>
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
  mapUnavailable: {
    height: 240,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  mapUnavailableText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  list: { padding: 16, gap: 10 },
  header: { gap: 8, marginBottom: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  searchBar: {
    flexDirection: 'row',
    gap: 8,
    padding: 10,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.background,
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    minWidth: 52,
    alignItems: 'center',
  },
  searchButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  movedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primaryLight,
  },
  movedText: { flex: 1, color: colors.text, fontWeight: '600' },
  movedLink: { color: colors.primary, fontWeight: '700' },
  searchError: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.warningBg,
    color: colors.warning,
    fontSize: 13,
  },
  sliderContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  sliderTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  slider: { width: '100%', height: 40 },
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
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  cardName: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 },
  distance: { fontSize: 15, fontWeight: '700', color: colors.primary },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  acceptIcons: { fontSize: 14 },
  details: {
    gap: 4,
    paddingTop: 8,
    marginTop: 2,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  detailText: { fontSize: 13, color: colors.text, lineHeight: 18 },
  source: { fontSize: 12, color: colors.muted },
  moreText: { marginLeft: 'auto', color: colors.muted, fontSize: 13, fontWeight: '600' },
  attribution: { fontSize: 11, color: colors.muted, textAlign: 'center', marginTop: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 4 },
  directions: {
    backgroundColor: colors.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  directionsText: { color: colors.primary, fontWeight: '700' },
});
