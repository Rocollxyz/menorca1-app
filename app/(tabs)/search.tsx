import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  searchMedia,
  getCategories,
  getMediaByCategory,
  Media,
  Category,
} from '@/services/mediacms-api';
import { MediaCard } from '@/components/MediaCard';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Media[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [catsLoaded, setCatsLoaded] = useState(false);

  useEffect(() => {
    getCategories()
      .then(res => setCategories(res.results ?? []))
      .catch(() => {})
      .finally(() => setCatsLoaded(true));
  }, []);

  const handleSearch = async (q = query) => {
    if (!q.trim()) return;
    setSearching(true);
    setSelectedCat(null);
    try {
      const res = await searchMedia(q.trim());
      setResults(res.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleCategory = async (cat: Category) => {
    if (selectedCat === cat.id) {
      setSelectedCat(null);
      setResults([]);
      return;
    }
    setSelectedCat(cat.id);
    setQuery('');
    setSearching(true);
    try {
      const res = await getMediaByCategory(cat.id);
      setResults(res.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const hasResults = results.length > 0;
  const showEmpty = !searching && (query.trim().length > 0 || selectedCat) && !hasResults;

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Buscar videos, audios…"
          placeholderTextColor="#aaa"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => handleSearch()}
          returnKeyType="search"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => handleSearch()}
          disabled={searching}
        >
          {searching ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.searchBtnText}>🔍</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Categorías */}
      {catsLoaded && categories.length > 0 && (
        <FlatList
          horizontal
          data={categories}
          keyExtractor={c => c.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, selectedCat === item.id && styles.chipActive]}
              onPress={() => handleCategory(item)}
            >
              <Text style={[styles.chipText, selectedCat === item.id && styles.chipTextActive]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.chips}
          showsHorizontalScrollIndicator={false}
          style={styles.chipsRow}
        />
      )}

      {/* Resultados */}
      {searching && results.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0066cc" />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.friendly_token}
          renderItem={({ item }) => (
            <MediaCard
              media={item}
              onPress={() =>
                router.push({ pathname: '/player', params: { token: item.friendly_token } })
              }
            />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            showEmpty ? (
              <Text style={styles.empty}>No se encontraron resultados</Text>
            ) : !query && !selectedCat ? (
              <Text style={styles.hint}>Busca por título o selecciona una categoría</Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  searchBar: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  searchBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#0066cc',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: { fontSize: 18 },
  chipsRow: { maxHeight: 52, backgroundColor: '#fff' },
  chips: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  chipActive: { backgroundColor: '#0066cc', borderColor: '#0066cc' },
  chipText: { fontSize: 13, color: '#444', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  list: { padding: 12, paddingBottom: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  empty: { textAlign: 'center', marginTop: 48, color: '#999', fontSize: 15 },
  hint: { textAlign: 'center', marginTop: 48, color: '#bbb', fontSize: 14 },
});
