import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/AuthContext';
import { getToken } from '@/utils/api';
import { useRouter } from 'expo-router';

const DOC_META: Record<string, { label: string; icon: string }> = {
  marksheet:            { label: 'Marksheet',           icon: 'school-outline' },
  statement_of_purpose: { label: 'Statement of Purpose', icon: 'document-text-outline' },
  pancard:              { label: 'PAN Card',             icon: 'card-outline' },
};

type DocItem = {
  type: string;
  file_id: string;
  original_name: string;
  uploaded_at: string;
  verification_status: string;
  authenticity_score: string;
  summary: string;
};

type Dashboard = {
  documents_uploaded: number;
  documents_required: number;
  completion_percentage: number;
  missing_documents: string[];
  documents: DocItem[];
};

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const cardBg = colorScheme === 'dark' ? '#1E2123' : '#F2F4F7';
  const { user } = useAuth();
  const router = useRouter();

  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const token = await getToken();
      const res = await fetch('http://localhost:3000/api/application/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setDashboard(data);
    } catch { }
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, []);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const token = await getToken();
      const res = await fetch('http://localhost:3000/api/application/submit', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Submission failed');
      Alert.alert(
        'Application Submitted! 🎉',
        `Submitted on ${new Date(data.submitted_at).toLocaleString()}`,
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const pct = dashboard?.completion_percentage ?? 0;
  const isComplete = pct === 100;

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchDashboard(true)} tintColor={theme.tint} />}
    >
      {/* Greeting */}
      <View>
        <Text style={[styles.greeting, { color: theme.text }]}>Hello, {user?.fullName?.split(' ')[0] || 'there'} 👋</Text>
        <Text style={[styles.greetingSub, { color: theme.icon }]}>Here's your application overview</Text>
      </View>

      {/* Progress Card */}
      <View style={[styles.card, { backgroundColor: cardBg }]}>
        <View style={styles.progressHeader}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Application Progress</Text>
          {loading
            ? <ActivityIndicator size="small" color={theme.tint} />
            : <Text style={[styles.pct, { color: isComplete ? '#34C759' : theme.tint }]}>{pct}%</Text>
          }
        </View>
        <View style={[styles.barBg, { backgroundColor: theme.icon + '30' }]}>
          <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: isComplete ? '#34C759' : theme.tint }]} />
        </View>
        {!loading && dashboard && (
          <Text style={[styles.progressSub, { color: theme.icon }]}>
            {dashboard.documents_uploaded} of {dashboard.documents_required} documents uploaded
          </Text>
        )}
      </View>

      {/* All done banner + Submit */}
      {!loading && isComplete && (
        <>
          <View style={[styles.banner, { backgroundColor: '#34C75918' }]}>
            <Ionicons name="trophy-outline" size={20} color="#34C759" />
            <Text style={[styles.bannerText, { color: '#34C759' }]}>All documents submitted!</Text>
          </View>
          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="send-outline" size={18} color="#fff" />
                  <Text style={styles.submitText}>Submit Application</Text>
                </>
            }
          </TouchableOpacity>
        </>
      )}

      {/* Missing documents */}
      {!loading && (dashboard?.missing_documents?.length ?? 0) > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.icon }]}>Missing</Text>
          <View style={[styles.card, { backgroundColor: '#FF3B3012', padding: 0, overflow: 'hidden' }]}>
            {dashboard!.missing_documents.map((doc, i, arr) => (
              <View key={doc} style={[styles.docRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#FF3B3020' }]}>
                <View style={[styles.docIcon, { backgroundColor: '#FF3B3020' }]}>
                  <Ionicons name={(DOC_META[doc]?.icon ?? 'document-outline') as any} size={20} color="#FF3B30" />
                </View>
                <Text style={[styles.docLabel, { color: theme.text }]}>{DOC_META[doc]?.label ?? doc}</Text>
                <Ionicons name="alert-circle-outline" size={20} color="#FF3B30" />
              </View>
            ))}
          </View>
        </>
      )}

      {/* Uploaded documents */}
      {!loading && (dashboard?.documents?.length ?? 0) > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.icon }]}>Uploaded Documents</Text>
          {dashboard!.documents.map((doc) => {
            const meta = DOC_META[doc.type] ?? { label: doc.type, icon: 'document-outline' };
            const verified = doc.verification_status === 'verified';
            const statusColor = verified ? '#34C759' : '#FF9F0A';
            return (
              <TouchableOpacity
                key={doc.file_id}
                style={[styles.card, { backgroundColor: cardBg }]}
                onPress={() => router.push({ pathname: '/file/[id]', params: { id: doc.file_id, name: doc.original_name } } as any)}
              >
                <View style={styles.docCardHeader}>
                  <View style={[styles.docIcon, { backgroundColor: theme.tint + '20' }]}>
                    <Ionicons name={meta.icon as any} size={20} color={theme.tint} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.docLabel, { color: theme.text }]}>{meta.label}</Text>
                    <Text style={[styles.docName, { color: theme.icon }]} numberOfLines={1}>{doc.original_name}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
                    <Ionicons name="shield-checkmark" size={11} color={statusColor} />
                    <Text style={[styles.badgeText, { color: statusColor }]}>{doc.verification_status}</Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.icon + '20' }]} />

                <Text style={[styles.summary, { color: theme.icon }]} numberOfLines={3}>{doc.summary}</Text>

                <View style={styles.docFooter}>
                  <Text style={[styles.footerText, { color: theme.icon }]}>
                    Authenticity: <Text style={{ color: theme.text, fontWeight: '600' }}>{doc.authenticity_score}</Text>
                  </Text>
                  <Text style={[styles.footerText, { color: theme.icon }]}>
                    {new Date(doc.uploaded_at).toLocaleDateString()}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </>
      )}

      {loading && <ActivityIndicator style={{ marginTop: 32 }} color={theme.tint} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 24, gap: 16, paddingBottom: 40 },
  greeting: { fontSize: 24, fontWeight: '700' },
  greetingSub: { fontSize: 14, marginTop: 4 },
  card: { borderRadius: 16, padding: 16 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '600' },
  pct: { fontSize: 20, fontWeight: '700' },
  barBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  progressSub: { fontSize: 12, marginTop: 8 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14 },
  bannerText: { fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  docRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  docIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  docLabel: { fontSize: 14, fontWeight: '600' },
  docName: { fontSize: 12, marginTop: 1 },
  docCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  divider: { height: 1, marginVertical: 12 },
  summary: { fontSize: 13, lineHeight: 20 },
  docFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  footerText: { fontSize: 12 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#34C759', padding: 16, borderRadius: 14 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
