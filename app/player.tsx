import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useAuth } from '@/context/AuthContext';
import {
  getMediaDetail,
  getComments,
  postComment,
  likeMedia,
  dislikeMedia,
  recordWatch,
  Media,
  Comment,
  fullUrl,
  getVideoUrl,
  formatDuration,
  formatViews,
  BASE,
} from '@/services/mediacms-api';

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });

function MediaPlayer({ videoUrl, isAudio, thumbnailUrl }: { videoUrl: string; isAudio: boolean; thumbnailUrl: string }) {
  const player = useVideoPlayer(videoUrl, p => { p.loop = false; });

  return (
    <View style={isAudio ? styles.audioWrap : styles.videoWrap}>
      {isAudio && (
        <Image source={{ uri: thumbnailUrl }} style={styles.audioBg} blurRadius={8} />
      )}
      <VideoView
        player={player}
        style={isAudio ? styles.audioPlayer : styles.videoPlayer}
        fullscreenOptions={{ supportedOrientations: 'landscape' }}
        allowsPictureInPicture
        contentFit="contain"
      />
    </View>
  );
}

export default function PlayerScreen() {
  const { token: mediaToken } = useLocalSearchParams<{ token: string }>();
  const { token: authToken } = useAuth();
  const router = useRouter();

  const [media, setMedia] = useState<Media | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);

  useEffect(() => {
    if (!mediaToken) return;
    Promise.all([
      getMediaDetail(mediaToken),
      getComments(mediaToken).catch(() => []),
    ])
      .then(([m, c]) => {
        setMedia(m);
        setComments(c);
        recordWatch(mediaToken).catch(() => undefined);
      })
      .catch(() => Alert.alert('Error', 'No se pudo cargar el contenido'))
      .finally(() => setLoading(false));
  }, [mediaToken]);

  const handleLike = async () => {
    if (!authToken) { router.push('/login'); return; }
    try {
      await likeMedia(mediaToken);
      setLiked(l => !l);
      if (disliked) setDisliked(false);
    } catch {}
  };

  const handleDislike = async () => {
    if (!authToken) { router.push('/login'); return; }
    try {
      await dislikeMedia(mediaToken);
      setDisliked(d => !d);
      if (liked) setLiked(false);
    } catch {}
  };

  const handleComment = async () => {
    if (!authToken) { router.push('/login'); return; }
    if (!newComment.trim()) return;
    setPosting(true);
    try {
      const c = await postComment(mediaToken, newComment.trim());
      setComments(prev => [c, ...prev]);
      setNewComment('');
    } catch {
      Alert.alert('Error', 'No se pudo publicar el comentario');
    } finally {
      setPosting(false);
    }
  };

  const handleShare = async () => {
    if (!media) return;
    try {
      await Share.share({
        message: `${media.title}\n${BASE}/view?m=${media.friendly_token}`,
      });
    } catch {}
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  if (!media) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Contenido no encontrado</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const videoUrl = getVideoUrl(media);
  const isPlayable = (media.media_type === 'video' || media.media_type === 'audio') && !!videoUrl;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView bounces={false}>
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>

        {/* Player / Thumbnail */}
        {isPlayable ? (
          <MediaPlayer
            videoUrl={videoUrl!}
            isAudio={media.media_type === 'audio'}
            thumbnailUrl={fullUrl(media.thumbnail_url)}
          />
        ) : (
          <Image
            source={{ uri: fullUrl(media.thumbnail_url) }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        )}

        <View style={styles.content}>
          {/* Título */}
          <Text style={styles.title}>{media.title}</Text>

          {/* Meta */}
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              👁 {formatViews(media.views)}  ·  {formatDate(media.add_date)}
            </Text>
            {media.duration > 0 && (
              <Text style={styles.metaText}>⏱ {formatDuration(media.duration)}</Text>
            )}
          </View>

          {/* Autor */}
          <View style={styles.authorRow}>
            <Image
              source={{ uri: fullUrl(media.author_thumbnail) }}
              style={styles.avatar}
            />
            <Text style={styles.authorName}>{media.author_name || media.user}</Text>
          </View>

          {/* Acciones */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, liked && styles.actionBtnActive]}
              onPress={handleLike}
            >
              <Text style={styles.actionIcon}>👍</Text>
              <Text style={styles.actionCount}>{media.likes + (liked ? 1 : 0)}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, disliked && styles.actionBtnActive]}
              onPress={handleDislike}
            >
              <Text style={styles.actionIcon}>👎</Text>
              <Text style={styles.actionCount}>{media.dislikes}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
              <Text style={styles.actionIcon}>🔗</Text>
              <Text style={styles.actionLabel}>Compartir</Text>
            </TouchableOpacity>

            {media.allow_download && (
              <View style={styles.actionBtn}>
                <Text style={styles.actionIcon}>⬇</Text>
                <Text style={styles.actionLabel}>Descarga</Text>
              </View>
            )}
          </View>

          {/* Descripción */}
          {!!media.description && (
            <View style={styles.descBox}>
              <Text style={styles.descText}>{media.description}</Text>
            </View>
          )}

          {/* Categorías */}
          {(media.categories_info?.length ?? 0) > 0 && (
            <View style={styles.tagsRow}>
              {media.categories_info!.map(cat => (
                <View key={cat.id} style={styles.tag}>
                  <Text style={styles.tagText}>{cat.title}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Tags */}
          {(media.tags_info?.length ?? 0) > 0 && (
            <View style={styles.tagsRow}>
              {media.tags_info!.map((tag, i) => (
                <View key={i} style={[styles.tag, styles.tagAlt]}>
                  <Text style={[styles.tagText, styles.tagTextAlt]}>#{tag.title}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Relacionados */}
          {(media.related_media?.length ?? 0) > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Relacionados</Text>
              {media.related_media!.slice(0, 6).map(rel => (
                <TouchableOpacity
                  key={rel.friendly_token}
                  style={styles.relatedItem}
                  onPress={() =>
                    router.push({ pathname: '/player', params: { token: rel.friendly_token } })
                  }
                >
                  <Image
                    source={{ uri: fullUrl(rel.thumbnail_url) }}
                    style={styles.relatedThumb}
                  />
                  <View style={styles.relatedInfo}>
                    <Text style={styles.relatedTitle} numberOfLines={2}>{rel.title}</Text>
                    <Text style={styles.relatedMeta}>
                      {rel.user}  ·  {rel.duration > 0 ? formatDuration(rel.duration) : rel.media_type}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Comentarios */}
          {media.enable_comments !== false && (
            <View style={styles.commentsSection}>
              <Text style={styles.sectionTitle}>Comentarios ({comments.length})</Text>

              {/* Nuevo comentario */}
              <View style={styles.commentInputRow}>
                <TextInput
                  style={styles.commentInput}
                  placeholder={authToken ? 'Escribe un comentario…' : 'Inicia sesión para comentar'}
                  placeholderTextColor="#bbb"
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                  editable={!!authToken}
                  returnKeyType="send"
                />
                {authToken && (
                  <TouchableOpacity
                    style={[styles.sendBtn, !newComment.trim() && styles.sendBtnDisabled]}
                    onPress={handleComment}
                    disabled={!newComment.trim() || posting}
                  >
                    {posting ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.sendIcon}>➤</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {!authToken && (
                <TouchableOpacity onPress={() => router.push('/login')}>
                  <Text style={styles.loginPrompt}>Iniciar sesión para comentar →</Text>
                </TouchableOpacity>
              )}

              {/* Lista comentarios */}
              {comments.map(c => (
                <View key={c.uid} style={styles.commentItem}>
                  <Image
                    source={{ uri: fullUrl(c.author_thumbnail_url) }}
                    style={styles.commentAvatar}
                  />
                  <View style={styles.commentBubble}>
                    <Text style={styles.commentAuthor}>{c.author_name || 'Usuario'}</Text>
                    <Text style={styles.commentText}>{c.text}</Text>
                    <Text style={styles.commentDate}>{formatDate(c.add_date)}</Text>
                  </View>
                </View>
              ))}

              {comments.length === 0 && (
                <Text style={styles.noComments}>Sin comentarios aún. ¡Sé el primero!</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorText: { fontSize: 16, color: '#666' },
  backLink: { color: '#0066cc', fontSize: 15, marginTop: 8 },
  backBtn: { paddingHorizontal: 16, paddingVertical: 12 },
  backText: { color: '#0066cc', fontSize: 15, fontWeight: '600' },

  videoWrap: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  videoPlayer: { width: '100%', height: '100%' },
  audioWrap: { width: '100%', backgroundColor: '#1a1a2e' },
  audioBg: { width: '100%', height: 180, opacity: 0.4 },
  audioPlayer: { width: '100%', height: 56, marginTop: -56 },
  thumbnail: { width: '100%', height: 220 },

  content: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', lineHeight: 28, marginBottom: 8 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  metaText: { fontSize: 13, color: '#888' },

  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ddd' },
  authorName: { fontSize: 14, fontWeight: '600', color: '#333' },

  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: '#fff', borderRadius: 20,
    borderWidth: 1, borderColor: '#e0e0e0',
  },
  actionBtnActive: { backgroundColor: '#e8f0fe', borderColor: '#0066cc' },
  actionIcon: { fontSize: 16 },
  actionCount: { fontSize: 14, fontWeight: '600', color: '#333' },
  actionLabel: { fontSize: 13, color: '#555' },

  descBox: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12 },
  descText: { fontSize: 14, color: '#555', lineHeight: 22 },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  tag: { backgroundColor: '#e8f0fe', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16 },
  tagText: { fontSize: 12, color: '#0066cc', fontWeight: '600' },
  tagAlt: { backgroundColor: '#f0f0f0' },
  tagTextAlt: { color: '#555' },

  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a1a', marginTop: 20, marginBottom: 12 },

  relatedItem: {
    flexDirection: 'row', gap: 12, backgroundColor: '#fff',
    borderRadius: 10, padding: 10, marginBottom: 8,
  },
  relatedThumb: { width: 96, height: 62, borderRadius: 6, backgroundColor: '#ddd' },
  relatedInfo: { flex: 1, justifyContent: 'center' },
  relatedTitle: { fontSize: 13, fontWeight: '600', color: '#333', lineHeight: 18 },
  relatedMeta: { fontSize: 12, color: '#999', marginTop: 4 },

  commentsSection: { marginTop: 4 },
  commentInputRow: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'flex-end' },
  commentInput: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12,
    fontSize: 14, borderWidth: 1, borderColor: '#e0e0e0',
    minHeight: 44, maxHeight: 120, color: '#1a1a1a',
  },
  sendBtn: {
    width: 44, height: 44, backgroundColor: '#0066cc',
    borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#ccc' },
  sendIcon: { color: '#fff', fontSize: 18 },
  loginPrompt: { color: '#0066cc', fontSize: 14, marginBottom: 12 },

  commentItem: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  commentAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#ddd', flexShrink: 0 },
  commentBubble: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 10 },
  commentAuthor: { fontSize: 13, fontWeight: '700', color: '#333' },
  commentText: { fontSize: 14, color: '#555', marginTop: 3, lineHeight: 20 },
  commentDate: { fontSize: 11, color: '#bbb', marginTop: 4 },
  noComments: { textAlign: 'center', color: '#aaa', fontSize: 14, paddingVertical: 16 },
});
