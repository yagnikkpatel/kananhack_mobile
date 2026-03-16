import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getToken } from '@/utils/api';

const GRADE_COLOR: Record<string, string> = {
  'A+': '#34C759', A: '#30D158', B: '#007AFF', C: '#FF9F0A', D: '#FF6B00', F: '#FF3B30',
};

// Guess endpoint suffix from filename
function guessEndpoints(name: string): string[] {
  const lower = name.toLowerCase();
  if (lower.includes('pan') || lower.match(/\.(jpg|jpeg|png)$/)) {
    return ['pancard-summary', 'marksheet-details', 'sop-summary'];
  }
  if (lower.includes('sop') || lower.includes('statement') || lower.match(/\.(doc|docx)$/)) {
    return ['sop-summary', 'marksheet-details', 'pancard-summary'];
  }
  return ['marksheet-details', 'sop-summary', 'pancard-summary'];
}

async function fetchWithPost(id: string, endpoint: string, token: string) {
  const res = await fetch(`http://localhost:3000/api/files/${id}/${endpoint}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  const raw = await res.text();
  if (raw.trim().startsWith('<')) return null;
  try {
    const json = JSON.parse(raw);
    if (!res.ok) return null;
    return json;
  } catch {
    return null;
  }
}

export default function FileDetailScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const cardBg = colorScheme === 'dark' ? '#1E2123' : '#F2F4F7';

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({
      title: 'Document Details',
      headerStyle: { backgroundColor: theme.background },
      headerTintColor: theme.text,
    });
    fetchDetails();
  }, []);

  const fetchDetails = async () => {
    try {
      const token = await getToken();
      const endpoints = guessEndpoints(name ?? '');
      let result = null;
      for (const ep of endpoints) {
        result = await fetchWithPost(id, ep, token!);
        if (result?.document_type) break;
      }
      if (!result) throw new Error('Could not load document details. Please try again.');
      setData(result);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <View style={[styles.center, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.tint} />
      <Text style={[styles.hint, { color: theme.icon }]}>Analyzing document...</Text>
    </View>
  );

  if (errorMsg) return (
    <View style={[styles.center, { backgroundColor: theme.background, padding: 32 }]}>
      <Ionicons name="document-text-outline" size={48} color={theme.icon} />
      <Text style={[styles.hint, { color: theme.text, marginTop: 16, textAlign: 'center', fontSize: 15, fontWeight: '600' }]}>Details Unavailable</Text>
      <Text style={[styles.hint, { color: theme.icon, textAlign: 'center' }]}>{errorMsg}</Text>
    </View>
  );

  if (!data) return null;

  const statusColor = data.verification_status === 'verified' ? '#34C759' : '#FF9F0A';

  const StatusBadge = () => (
    <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
      <Ionicons name="shield-checkmark" size={12} color={statusColor} />
      <Text style={[styles.badgeText, { color: statusColor }]}>{data.verification_status}</Text>
    </View>
  );

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: theme.icon }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
    </View>
  );

  const BulletList = ({ items, color }: { items: string[]; color: string }) => (
    <>
      {items.map((s) => (
        <View key={s} style={styles.bulletRow}>
          <Ionicons name="checkmark-circle" size={16} color={color} />
          <Text style={[styles.bulletText, { color: theme.text }]}>{s}</Text>
        </View>
      ))}
    </>
  );

  const SectionTitle = ({ title }: { title: string }) => (
    <Text style={[styles.sectionTitle, { color: theme.icon }]}>{title}</Text>
  );

  // ── MARKSHEET ──────────────────────────────────────────────
  if (data.document_type === 'marksheet') {
    const resultColor = data.result_status?.toLowerCase().includes('pass') ? '#34C759' : '#FF9F0A';
    return (
      <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.scroll}>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <View style={styles.row}>
            <Text style={[styles.title, { color: theme.text }]}>{data.student_name}</Text>
            <StatusBadge />
          </View>
          <Text style={[styles.sub, { color: theme.icon }]}>{data.university_name}</Text>
          <Text style={[styles.sub, { color: theme.icon }]}>{data.institute_name}</Text>
          <Text style={[styles.program, { color: theme.tint }]}>{data.program}</Text>
        </View>

        <View style={styles.statsRow}>
          {[{ label: 'SGPA', value: data.sgpa }, { label: 'CGPA', value: data.cgpa }, { label: 'Credits', value: data.total_credits }].map((s) => (
            <View key={s.label} style={[styles.statBox, { backgroundColor: cardBg }]}>
              <Text style={[styles.statValue, { color: theme.tint }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: theme.icon }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: cardBg }]}>
          {[
            { label: 'Enrollment No.', value: data.enrollment_number },
            { label: 'Seat No.', value: data.seat_number },
            { label: 'Academic Year', value: data.academic_year },
            { label: 'Semester', value: data.semester },
            { label: 'Backlogs', value: data.backlog },
            { label: 'Performance', value: data.overall_performance },
            { label: 'Authenticity', value: data.authenticity_score },
          ].map((item, i, arr) => (
            <View key={item.label} style={[styles.infoRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.icon + '20' }]}>
              <Text style={[styles.infoLabel, { color: theme.icon }]}>{item.label}</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{item.value}</Text>
            </View>
          ))}
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.infoLabel, { color: theme.icon }]}>Result</Text>
            <View style={[styles.badge, { backgroundColor: resultColor + '20' }]}>
              <Text style={[styles.badgeText, { color: resultColor, fontWeight: '700' }]}>{data.result_status}</Text>
            </View>
          </View>
        </View>

        <SectionTitle title="Subjects" />
        <View style={[styles.card, { backgroundColor: cardBg, padding: 0, overflow: 'hidden' }]}>
          <View style={[styles.tableHeader, { backgroundColor: theme.tint + '15' }]}>
            <Text style={[styles.thSubject, { color: theme.icon }]}>Subject</Text>
            <Text style={[styles.thSmall, { color: theme.icon }]}>Cr.</Text>
            <Text style={[styles.thSmall, { color: theme.icon }]}>Grade</Text>
            <Text style={[styles.thSmall, { color: theme.icon }]}>GP</Text>
          </View>
          {data.subjects?.map((s: any, i: number) => (
            <View key={s.subject_code} style={[styles.tableRow, i % 2 === 1 && { backgroundColor: theme.tint + '08' }]}>
              <View style={styles.thSubject}>
                <Text style={[styles.subjectName, { color: theme.text }]} numberOfLines={2}>{s.subject_name}</Text>
                <Text style={[styles.subjectCode, { color: theme.icon }]}>{s.subject_code}</Text>
              </View>
              <Text style={[styles.thSmall, { color: theme.text }]}>{s.credit}</Text>
              <Text style={[styles.thSmall, styles.grade, { color: GRADE_COLOR[s.grade] ?? theme.text }]}>{s.grade}</Text>
              <Text style={[styles.thSmall, { color: theme.text }]}>{s.grade_point}</Text>
            </View>
          ))}
        </View>

        <SectionTitle title="Strengths" />
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <BulletList items={data.strengths ?? []} color="#34C759" />
        </View>

        {data.areas_of_improvement?.length > 0 && <>
          <SectionTitle title="Areas of Improvement" />
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <BulletList items={data.areas_of_improvement} color="#FF9F0A" />
          </View>
        </>}

        <SectionTitle title="Summary" />
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <Text style={[styles.summary, { color: theme.text }]}>{data.summary}</Text>
        </View>
      </ScrollView>
    );
  }

  // ── SOP ────────────────────────────────────────────────────
  if (data.document_type === 'statement_of_purpose') {
    return (
      <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.scroll}>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <View style={styles.row}>
            <Text style={[styles.title, { color: theme.text }]}>{data.applicant_name}</Text>
            <StatusBadge />
          </View>
          <Text style={[styles.program, { color: theme.tint }]}>{data.target_program}</Text>
        </View>

        <View style={styles.statsRow}>
          {[
            { label: 'Words', value: String(data.word_count) },
            { label: 'Clarity', value: data.clarity_score },
            { label: 'Authenticity', value: data.authenticity_score },
          ].map((s) => (
            <View key={s.label} style={[styles.statBox, { backgroundColor: cardBg }]}>
              <Text style={[styles.statValue, { color: theme.tint, fontSize: 16 }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: theme.icon }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: cardBg }]}>
          {[
            { label: 'Target University', value: data.target_university },
            { label: 'Target Country', value: data.target_country },
            { label: 'Tone', value: data.tone },
          ].map((item, i, arr) => (
            <View key={item.label} style={[styles.infoRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.icon + '20' }]}>
              <Text style={[styles.infoLabel, { color: theme.icon }]}>{item.label}</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        <SectionTitle title="Main Topics" />
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <BulletList items={data.main_topics ?? []} color={theme.tint} />
        </View>

        <SectionTitle title="Strengths" />
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <BulletList items={data.strengths ?? []} color="#34C759" />
        </View>

        {data.areas_of_improvement?.length > 0 && <>
          <SectionTitle title="Areas of Improvement" />
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <BulletList items={data.areas_of_improvement} color="#FF9F0A" />
          </View>
        </>}

        <SectionTitle title="Summary" />
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <Text style={[styles.summary, { color: theme.text }]}>{data.summary}</Text>
        </View>

        <TouchableOpacity
          style={[styles.analyseBtn, { backgroundColor: theme.tint }]}
          onPress={() => router.push({ pathname: '/file/sop-analysis/[id]', params: { id } } as any)}
        >
          <Ionicons name="analytics-outline" size={18} color="#fff" />
          <Text style={styles.analyseBtnText}>Analyse SOP</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── PAN CARD ───────────────────────────────────────────────
  if (data.document_type === 'pancard') {
    return (
      <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.scroll}>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <View style={styles.row}>
            <Text style={[styles.title, { color: theme.text }]}>{data.name}</Text>
            <StatusBadge />
          </View>
          <Text style={[styles.program, { color: theme.tint }]}>{data.pan_number}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: cardBg }]}>
          {[
            { label: 'PAN Number', value: data.pan_number },
            { label: "Father's Name", value: data.father_name },
            { label: 'Date of Birth', value: data.date_of_birth },
            { label: 'Gender', value: data.gender || 'Not specified' },
            { label: 'Issuing Authority', value: data.issuing_authority },
            { label: 'Authenticity', value: data.authenticity_score },
          ].map((item, i, arr) => (
            <View key={item.label} style={[styles.infoRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.icon + '20' }]}>
              <Text style={[styles.infoLabel, { color: theme.icon }]}>{item.label}</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        <SectionTitle title="Summary" />
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <Text style={[styles.summary, { color: theme.text }]}>{data.summary}</Text>
        </View>
      </ScrollView>
    );
  }

  // ── UNKNOWN ────────────────────────────────────────────────
  return (
    <View style={[styles.center, { backgroundColor: theme.background, padding: 32 }]}>
      <Ionicons name="help-circle-outline" size={48} color={theme.icon} />
      <Text style={[styles.hint, { color: theme.icon, marginTop: 12, textAlign: 'center' }]}>Unknown document type: {data.document_type}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  card: { borderRadius: 16, padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  title: { fontSize: 17, fontWeight: '700', flex: 1, marginRight: 8 },
  sub: { fontSize: 13, marginBottom: 2 },
  program: { fontSize: 13, fontWeight: '600', marginTop: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 12 },
  statBox: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 12, marginTop: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' },
  sectionTitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 },
  tableHeader: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10 },
  tableRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center' },
  thSubject: { flex: 3 },
  thSmall: { flex: 1, textAlign: 'center', fontSize: 13 },
  subjectName: { fontSize: 13, fontWeight: '500' },
  subjectCode: { fontSize: 11, marginTop: 2 },
  grade: { fontWeight: '700' },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  bulletText: { fontSize: 14, flex: 1 },
  summary: { fontSize: 14, lineHeight: 22 },
  hint: { fontSize: 14, marginTop: 12 },
  analyseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14 },
  analyseBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
