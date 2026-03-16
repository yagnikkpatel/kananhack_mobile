import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, FlatList, RefreshControl,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getToken } from '@/utils/api';
import { useRouter } from 'expo-router';

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const ALLOWED_EXTENSIONS = ['pdf', 'jpeg', 'jpg', 'doc', 'docx'];

type FileItem = {
  _id: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

const MIME_ICON: Record<string, string> = {
  'application/pdf': 'document-text',
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'application/msword': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
};

const DETAIL_SUPPORTED = ['application/pdf', 'image/jpeg', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export default function UploadScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const cardBg = colorScheme === 'dark' ? '#1E2123' : '#F2F4F7';
  const router = useRouter();

  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFiles = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const token = await getToken();
      const res = await fetch('http://localhost:3000/api/files', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch files');
      setFiles(data.files ?? []);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchFiles(); }, []);

  const pickAndUpload = async () => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (picked.canceled) return;

      const file = picked.assets[0];
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

      if (!ALLOWED_EXTENSIONS.includes(ext) || (file.mimeType && !ALLOWED_TYPES.includes(file.mimeType))) {
        Alert.alert('Invalid file', 'Only PDF, JPEG, JPG, DOC and DOCX files are allowed.');
        return;
      }

      setUploading(true);
      const token = await getToken();
      const formData = new FormData();
      formData.append('file', { uri: file.uri, name: file.name, type: file.mimeType ?? 'application/octet-stream' } as any);

      const res = await fetch('http://localhost:3000/api/files/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');

      await fetchFiles();
    } catch (err: any) {
      Alert.alert('Upload failed', err.message || 'Something went wrong');
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity
        style={[styles.uploadBox, { borderColor: theme.tint, backgroundColor: theme.tint + '10' }]}
        onPress={pickAndUpload}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator size="large" color={theme.tint} />
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={44} color={theme.tint} />
            <Text style={[styles.uploadTitle, { color: theme.text }]}>Tap to upload a file</Text>
            <Text style={[styles.uploadSub, { color: theme.icon }]}>PDF, JPEG, JPG, DOC, DOCX</Text>
          </>
        )}
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} color={theme.tint} />
      ) : (
        <FlatList
          data={files}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchFiles(true)} tintColor={theme.tint} />}
          ListHeaderComponent={
            files.length > 0 ? (
              <Text style={[styles.sectionTitle, { color: theme.icon }]}>
                {files.length} file{files.length !== 1 ? 's' : ''}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <Text style={[styles.empty, { color: theme.icon }]}>No files uploaded yet</Text>
          }
          renderItem={({ item }) => {
            const supported = DETAIL_SUPPORTED.includes(item.mimeType);
            return (
              <TouchableOpacity
                style={[styles.card, { backgroundColor: cardBg }]}
                onPress={() => router.push({ pathname: '/file/[id]', params: { id: item._id, name: item.originalName } } as any)}
                disabled={!supported}
                activeOpacity={supported ? 0.7 : 1}
              >
                <View style={[styles.iconBox, { backgroundColor: theme.tint + '20' }]}>
                  <Ionicons name={(MIME_ICON[item.mimeType] ?? 'document') as any} size={24} color={theme.tint} />
                </View>
                <View style={styles.fileInfo}>
                  <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>{item.originalName}</Text>
                  <Text style={[styles.fileMeta, { color: theme.icon }]}>
                    {formatSize(item.size)} · {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                {supported
                  ? <Ionicons name="chevron-forward" size={18} color={theme.icon} />
                  : <Ionicons name="lock-closed-outline" size={16} color={theme.icon} />}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 20,
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  uploadTitle: { fontSize: 16, fontWeight: '600' },
  uploadSub: { fontSize: 13 },
  list: { paddingTop: 20, gap: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  empty: { textAlign: 'center', marginTop: 32, fontSize: 14 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  fileMeta: { fontSize: 12 },
});
