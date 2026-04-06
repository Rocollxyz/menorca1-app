import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import {
  getUserProfile,
  getUserMedia,
  deleteMedia,
  getWatchHistory,
  UserProfile,
  Media,
  Paginated,
  fullUrl,
  formatViews,
  formatDuration,
} from '@/services/mediacms-api';
import { MediaCard } from '@/components/MediaCard';

export default function ProfileScreen() {
  const { token, username, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mediaData, setMediaData] = useState<Paginated<Media> | null>(null);
  const [history, setHistory] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!token || !username) { setLoading(false); return; }
      setLoading(true);
      Promise.all([
        getUserProfile(username),
        getUserMedia(username),
        getWatchHistory().catch(() => ({ results: [] } as any)),
      ])
        .then(([p, m, h]) => { setProfile(p); setMediaData(m); setHistory(h.results ?? []); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, [token, username])
  );

  if (!token) {
    return (
      <View style={styles.center}>
        <Text style={styles.guestIcon}>👤</Text>
        <Text style={styles.guestTitle}>Tu perfil</Text>
        <Text style={styles.guestSub}>Inicia sesión para ver y gestionar tu contenido</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login')}>
          <Text style={styles.loginBtnText}>Iniciar sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  const handleDelete = (mediaToken: string, title: string) => {
    Alert.alert(
      'Eliminar',
      `¿Eliminar "${title}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMedia(mediaToken);
              setMediaData(prev =>
                prev
                  ? { ...prev, results: prev.results.filter(m => m.friendly_token !== mediaToken), count: prev.count - 1 }
                  : prev
              );
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el archivo');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <FlatList
      data={mediaData?.results ?? []}
      keyExtractor={item => item.friendly_token}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <View>
          <MediaCard
            media={item}
            onPress={() =>
              router.push({ pathname: '/player', params: { token: item.friendly_token } })
            }
          />
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item.friendly_token, item.title)}
          >
            <Text style={styles.deleteBtnText}>🗑 Eliminar</Text>
          </TouchableOpacity>
        </View>
      )}
      ListHeaderComponent={
        <View>
          {/* Cabecera de perfil */}
          <View style={styles.profileCard}>
            <Image
              source={{ uri: fullUrl(profile?.thumbnail_url ?? '') }}
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{profile?.name || username}</Text>
              <Text style={styles.username}>@{username}</Text>
              {profile?.description ? (
                <Text style={styles.bio} numberOfLines={3}>{profile.description}</Text>
              ) : null}
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{mediaData?.count ?? 0}</Text>
              <Text style={styles.statLabel}>Archivos</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>
                {formatViews((mediaData?.results ?? []).reduce((acc, m) => acc + m.views, 0))}
              </Text>
              <Text style={styles.statLabel}>Vistas totales</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>
                {(mediaData?.results ?? []).reduce((acc, m) => acc + m.likes, 0)}
              </Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={() => router.push('/(tabs)/upload')}
          >
            <Text style={styles.uploadBtnText}>⬆ Subir nuevo contenido</Text>
          </TouchableOpacity>

          {mediaData && mediaData.count > 0 && (
            <Text style={styles.sectionTitle}>Mis archivos ({mediaData.count})</Text>
          )}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>Aún no has subido ningún archivo</Text>
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={() => router.push('/(tabs)/upload')}
          >
            <Text style={styles.uploadBtnText}>Subir primer archivo</Text>
          </TouchableOpacity>
        </View>
      }
      ListFooterComponent={
        <View>
          {history.length > 0 && (
            <View style={styles.historySection}>
              <Text style={styles.sectionTitle}>Historial ({history.length})</Text>
              {history.map(item => (
                <TouchableOpacity
                  key={item.friendly_token}
                  style={styles.historyItem}
                  onPress={() => router.push({ pathname: '/player', params: { token: item.friendly_token } })}
                >
                  <Image source={{ uri: fullUrl(item.thumbnail_url) }} style={styles.historyThumb} />
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.historyMeta}>{item.author_name} · {item.duration > 0 ? formatDuration(item.duration) : item.media_type}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 12, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  guestIcon: { fontSize: 60 },
  guestTitle: { fontSize: 22, fontWeight: '700', color: '#1a1a1a' },
  guestSub: { fontSize: 14, color: '#888', textAlign: 'center' },
  loginBtn: {
    backgroundColor: '#0066cc', paddingHorizontal: 36, paddingVertical: 14,
    borderRadius: 12, marginTop: 8,
  },
  loginBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  profileCard: {
    flexDirection: 'row', gap: 14, backgroundColor: '#fff',
    borderRadius: 14, padding: 16, marginBottom: 12, alignItems: 'center',
  },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#e0e0e0' },
  profileInfo: { flex: 1 },
  name: { fontSize: 19, fontWeight: '700', color: '#1a1a1a' },
  username: { fontSize: 14, color: '#888', marginTop: 2 },
  bio: { fontSize: 13, color: '#555', marginTop: 6, lineHeight: 18 },

  statsRow: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14,
    padding: 16, marginBottom: 12, alignItems: 'center',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '700', color: '#0066cc' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: '#e0e0e0' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 10, marginTop: 4 },

  deleteBtn: {
    marginHorizontal: 2, marginBottom: 10, paddingVertical: 9,
    backgroundColor: '#fff5f5', borderRadius: 8, alignItems: 'center',
  },
  deleteBtnText: { color: '#d32f2f', fontSize: 13, fontWeight: '600' },

  emptyWrap: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 15, color: '#999' },

  uploadBtn: {
    backgroundColor: '#0066cc', borderRadius: 12, padding: 14,
    alignItems: 'center', marginBottom: 16,
  },
  uploadBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  logoutBtn: {
    margin: 8, padding: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#d32f2f', alignItems: 'center',
  },
  logoutText: { color: '#d32f2f', fontWeight: '700', fontSize: 15 },

  historySection: { marginTop: 8 },
  historyItem: {
    flexDirection: 'row', gap: 12, backgroundColor: '#fff',
    borderRadius: 10, padding: 10, marginBottom: 8,
  },
  historyThumb: { width: 96, height: 62, borderRadius: 6, backgroundColor: '#ddd' },
  historyInfo: { flex: 1, justifyContent: 'center' },
  historyTitle: { fontSize: 13, fontWeight: '600', color: '#333', lineHeight: 18 },
  historyMeta: { fontSize: 12, color: '#999', marginTop: 4 },
});
