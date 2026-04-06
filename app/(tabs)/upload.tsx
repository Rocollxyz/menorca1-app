import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { uploadMedia } from '@/services/mediacms-api';

interface PickedFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

const formatBytes = (b: number) => {
  if (b > 1_000_000_000) return `${(b / 1_000_000_000).toFixed(1)} GB`;
  if (b > 1_000_000) return `${(b / 1_000_000).toFixed(1)} MB`;
  if (b > 1_000) return `${(b / 1_000).toFixed(0)} KB`;
  return `${b} B`;
};

export default function UploadScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<PickedFile | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!token) {
    return (
      <View style={styles.center}>
        <Text style={styles.guestIcon}>☁️</Text>
        <Text style={styles.guestTitle}>Inicia sesión para subir contenido</Text>
        <Text style={styles.guestSub}>Necesitas una cuenta en media.menorca1.com</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login')}>
          <Text style={styles.loginBtnText}>Iniciar sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['video/*', 'audio/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        const a = result.assets[0];
        setFile({
          uri: a.uri,
          name: a.name,
          type: a.mimeType ?? 'video/mp4',
          size: a.size,
        });
        if (!title) setTitle(a.name.replace(/\.[^.]+$/, ''));
      }
    } catch {
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  const handleUpload = async () => {
    if (!file) { Alert.alert('', 'Selecciona un archivo primero'); return; }
    if (!title.trim()) { Alert.alert('', 'El título es obligatorio'); return; }
    setUploading(true);
    setProgress(0);
    try {
      await uploadMedia(file, title.trim(), description.trim(), token);
      Alert.alert(
        '¡Subido con éxito!',
        'El archivo se está procesando. Aparecerá en tu perfil en breve.',
        [{
          text: 'OK',
          onPress: () => {
            setFile(null);
            setTitle('');
            setDescription('');
            setProgress(0);
          },
        }]
      );
    } catch (e: any) {
      Alert.alert('Error al subir', e.message || 'Inténtalo de nuevo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

      {/* Selector de archivo */}
      <TouchableOpacity style={styles.picker} onPress={pickFile} disabled={uploading}>
        {file ? (
          <View style={styles.fileInfo}>
            <Text style={styles.fileIcon}>
              {file.type.startsWith('audio') ? '🎵' : '🎬'}
            </Text>
            <Text style={styles.fileName} numberOfLines={2}>{file.name}</Text>
            {file.size && (
              <Text style={styles.fileSize}>{formatBytes(file.size)}</Text>
            )}
            <Text style={styles.changeTip}>Toca para cambiar</Text>
          </View>
        ) : (
          <View style={styles.pickerEmpty}>
            <Text style={styles.pickerEmoji}>📁</Text>
            <Text style={styles.pickerLabel}>Seleccionar archivo</Text>
            <Text style={styles.pickerSub}>Video o audio</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Título */}
      <Text style={styles.label}>Título *</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Título del contenido"
        placeholderTextColor="#bbb"
        maxLength={200}
        editable={!uploading}
      />

      {/* Descripción */}
      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Descripción opcional"
        placeholderTextColor="#bbb"
        multiline
        numberOfLines={4}
        editable={!uploading}
      />

      {/* Barra de progreso */}
      {uploading && (
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
          </View>
          <Text style={styles.progressText}>{progress}% subido</Text>
        </View>
      )}

      {/* Botón subir */}
      <TouchableOpacity
        style={[styles.uploadBtn, (!file || uploading) && styles.uploadBtnDisabled]}
        onPress={handleUpload}
        disabled={!file || uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.uploadBtnText}>⬆ Subir</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  guestIcon: { fontSize: 56 },
  guestTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', textAlign: 'center' },
  guestSub: { fontSize: 14, color: '#888', textAlign: 'center' },
  loginBtn: {
    backgroundColor: '#0066cc', paddingHorizontal: 36, paddingVertical: 14,
    borderRadius: 12, marginTop: 8,
  },
  loginBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  picker: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#0066cc',
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    padding: 20,
  },
  pickerEmpty: { alignItems: 'center', gap: 6 },
  pickerEmoji: { fontSize: 40 },
  pickerLabel: { fontSize: 16, fontWeight: '600', color: '#0066cc' },
  pickerSub: { fontSize: 13, color: '#aaa' },
  fileInfo: { alignItems: 'center', gap: 6 },
  fileIcon: { fontSize: 36 },
  fileName: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', textAlign: 'center' },
  fileSize: { fontSize: 12, color: '#888' },
  changeTip: { fontSize: 12, color: '#0066cc', marginTop: 4 },

  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 13,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  textarea: { height: 100, textAlignVertical: 'top' },

  progressWrap: { marginBottom: 16 },
  progressTrack: {
    height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#0066cc', borderRadius: 4 },
  progressText: { fontSize: 12, color: '#666', textAlign: 'center', marginTop: 6 },

  uploadBtn: {
    backgroundColor: '#0066cc', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  uploadBtnDisabled: { backgroundColor: '#b0c8e8' },
  uploadBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
