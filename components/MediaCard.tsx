import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Media, fullUrl, formatDuration, formatViews } from '@/services/mediacms-api';

interface Props {
  media: Media;
  onPress: (media: Media) => void;
}

const typeIcon = (type: string) => {
  if (type === 'audio') return '🎵';
  if (type === 'image') return '🖼';
  return '▶';
};

export const MediaCard: React.FC<Props> = ({ media, onPress }) => {
  const thumb = fullUrl(media.thumbnail_url);

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(media)} activeOpacity={0.85}>
      <View style={styles.imageWrap}>
        <Image source={{ uri: thumb }} style={styles.image} resizeMode="cover" />
        <View style={styles.typeTag}>
          <Text style={styles.typeIcon}>{typeIcon(media.media_type)}</Text>
        </View>
        {media.duration > 0 && (
          <View style={styles.duration}>
            <Text style={styles.durationText}>{formatDuration(media.duration)}</Text>
          </View>
        )}
        {media.encoding_status !== 'success' && (
          <View style={styles.processingBadge}>
            <Text style={styles.processingText}>Procesando…</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{media.title}</Text>
        <View style={styles.meta}>
          <Text style={styles.author} numberOfLines={1}>
            {media.author_name || media.user}
          </Text>
          <Text style={styles.stats}>
            👁 {formatViews(media.views)}  {media.size ? `· ${media.size}` : ''}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  imageWrap: {
    width: '100%',
    height: 190,
    backgroundColor: '#111',
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  typeTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  typeIcon: { fontSize: 14 },
  duration: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  durationText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  processingBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(255,150,0,0.9)',
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  processingText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  info: { padding: 12 },
  title: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', lineHeight: 21, marginBottom: 6 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  author: { fontSize: 12, color: '#0066cc', flex: 1, marginRight: 8 },
  stats: { fontSize: 12, color: '#999' },
});
