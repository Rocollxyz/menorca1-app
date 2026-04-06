import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { getMedia, Media, Paginated } from '@/services/mediacms-api';
import { MediaCard } from '@/components/MediaCard';

export default function HomeScreen() {
  const router = useRouter();
  const [data, setData] = useState<Paginated<Media> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const load = async (p = 1, append = false) => {
    try {
      setError(null);
      const res = await getMedia(p);
      setData(prev =>
        append && prev
          ? { ...res, results: [...prev.results, ...res.results] }
          : res
      );
      setPage(p);
    } catch {
      setError('No se pudo cargar el contenido. Comprueba tu conexión.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load(1).finally(() => setLoading(false));
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load(1);
    setRefreshing(false);
  };

  const onEndReached = async () => {
    if (loadingMore || !data?.next) return;
    setLoadingMore(true);
    await load(page + 1, true);
    setLoadingMore(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); load(1).finally(() => setLoading(false)); }}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={data?.results ?? []}
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
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0066cc" />
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        loadingMore ? <ActivityIndicator style={styles.footer} color="#0066cc" /> : null
      }
      ListEmptyComponent={
        <Text style={styles.empty}>No hay contenido disponible</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 24 },
  list: { padding: 12, paddingBottom: 24 },
  errorText: { fontSize: 15, color: '#666', textAlign: 'center' },
  retryBtn: { backgroundColor: '#0066cc', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: 48, color: '#999', fontSize: 15 },
  footer: { paddingVertical: 16 },
});
