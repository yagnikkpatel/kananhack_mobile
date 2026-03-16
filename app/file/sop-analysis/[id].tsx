import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getToken } from '@/utils/api';

type SuggestedFormat = {
  name: string;
  focus: string;
  structure: string[];
  sample_outline: string;
};

type Analysis = {
  current_analysis: {
    strengths: string[];
    weaknesses: string[];
    missing_elements: string[];
    impact_score: string;
  };
  comparison: {
    structure: string;
    tone: string;
    clarity: string;
  };
  suggested_formats: SuggestedFormat[];
  overall_suggestions: string;
};

export default function SopAnalysisScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const cardBg = colorScheme === 'dark' ? '#1E2123' : '#F2F4F7';

  const [data, setData] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedFormat, setExpandedFormat] = useState<number | null>(null);

  useEffect(() => {
    navigation.setOptions({
      title: 'SOP Analysis',
      headerStyle: { backgroundColor: theme.background },
      headerTintColor: theme.text,
    });
    fetchAnalysis();
  }, []);

  const fetchAnalysis = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:3000/api/files/${id}/sop-analysis`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const raw = await res.text();
      if (raw.trim().startsWith('<')) throw new Error('Analysis not available for this file.');
      const json = JSON.parse(raw);
      if (!res.ok) throw new Error(json.message || 'Failed to fetch analysis');
      setData(json);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <View style={[styles.center, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.tint} />
      <Text style={[styles.hint, { color: theme.icon }]}>Analyzing your SOP...</Text>
    </View>
  );

  if (errorMsg) return (
    <View style={[styles.center, { backgroundColor: theme.background, padding: 32 }]}>
      <Ionicons name="alert-circle-outline" size={48} color={theme.icon} />
      <Text style={[styles.hint, { color: theme.icon, textAlign: 'center', marginTop: 12 }]}>{errorMsg}</Text>
    </View>
  );

  if (!data) return null;

  const scoreNum = parseInt(data.current_analysis.impact_score);
  const scoreColor = scoreNum >= 70 ? '#34C759' : scoreNum >= 40 ? '#FF9F0A' : '#FF3B30';

  const SectionTitle = ({ title }: { title: string }) => (
    <Text style={[styles.sectionTitle, { color: theme.icon }]}>{title}</Text>
  );

  const BulletList = ({ items, color, icon }: { items: string[]; color: string; icon: string }) => (
    <>
      {items.map((s, i) => (
        <View key={i} style={styles.bulletRow}>
          <Ionicons name={icon as any} size={16} color={color} style={{ marginTop: 2 }} />
          <Text style={[styles.bulletText, { color: theme.text }]}>{s}</Text>
        </View>
      ))}
    </>
  );

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.scroll}>

      {/* Impact Score */}
      <View style={[styles.card, { backgroundColor: cardBg, alignItems: 'center' }]}>
        <Text style={[styles.scoreLabel, { color: theme.icon }]}>Impact Score</Text>
        <Text style={[styles.scoreValue, { color: scoreColor }]}>{data.current_analysis.impact_score}</Text>
        <View style={[styles.barBg, { backgroundColor: theme.icon + '30', width: '100%' }]}>
          <View style={[styles.barFill, { width: `${scoreNum}%`, backgroundColor: scoreColor }]} />
        </View>
      </View>

      {/* Strengths */}
      <SectionTitle title="Strengths" />
      <View style={[styles.card, { backgroundColor: cardBg }]}>
        <BulletList items={data.current_analysis.strengths} color="#34C759" icon="checkmark-circle" />
      </View>

      {/* Weaknesses */}
      <SectionTitle title="Weaknesses" />
      <View style={[styles.card, { backgroundColor: cardBg }]}>
        <BulletList items={data.current_analysis.weaknesses} color="#FF3B30" icon="close-circle" />
      </View>

      {/* Missing Elements */}
      <SectionTitle title="Missing Elements" />
      <View style={[styles.card, { backgroundColor: cardBg }]}>
        <BulletList items={data.current_analysis.missing_elements} color="#FF9F0A" icon="alert-circle" />
      </View>

      {/* Comparison */}
      <SectionTitle title="Comparison with Ideal SOP" />
      <View style={[styles.card, { backgroundColor: cardBg }]}>
        {[
          { label: 'Structure', value: data.comparison.structure },
          { label: 'Tone', value: data.comparison.tone },
          { label: 'Clarity', value: data.comparison.clarity },
        ].map((item, i, arr) => (
          <View key={item.label} style={[styles.compRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.icon + '20' }]}>
            <Text style={[styles.compLabel, { color: theme.tint }]}>{item.label}</Text>
            <Text style={[styles.compValue, { color: theme.text }]}>{item.value}</Text>
          </View>
        ))}
      </View>

      {/* Suggested Formats */}
      <SectionTitle title="Suggested Formats" />
      {data.suggested_formats.map((fmt, i) => (
        <TouchableOpacity
          key={fmt.name}
          style={[styles.card, { backgroundColor: cardBg }]}
          onPress={() => setExpandedFormat(expandedFormat === i ? null : i)}
          activeOpacity={0.8}
        >
          <View style={styles.fmtHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fmtName, { color: theme.text }]}>{fmt.name}</Text>
              <Text style={[styles.fmtFocus, { color: theme.icon }]}>{fmt.focus}</Text>
            </View>
            <Ionicons name={expandedFormat === i ? 'chevron-up' : 'chevron-down'} size={20} color={theme.icon} />
          </View>

          {expandedFormat === i && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.icon + '20' }]} />
              <Text style={[styles.compLabel, { color: theme.tint, marginBottom: 8 }]}>Structure</Text>
              {fmt.structure.map((s, j) => (
                <View key={j} style={styles.bulletRow}>
                  <Text style={[styles.stepNum, { color: theme.tint }]}>{j + 1}.</Text>
                  <Text style={[styles.bulletText, { color: theme.text }]}>{s}</Text>
                </View>
              ))}
              <View style={[styles.divider, { backgroundColor: theme.icon + '20' }]} />
              <Text style={[styles.compLabel, { color: theme.tint, marginBottom: 6 }]}>Sample Outline</Text>
              <Text style={[styles.sampleText, { color: theme.text }]}>{fmt.sample_outline}</Text>
            </>
          )}
        </TouchableOpacity>
      ))}

      {/* Overall Suggestions */}
      <SectionTitle title="Overall Suggestions" />
      <View style={[styles.card, { backgroundColor: cardBg }]}>
        <Text style={[styles.sampleText, { color: theme.text, lineHeight: 22 }]}>{data.overall_suggestions}</Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  card: { borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 },
  scoreLabel: { fontSize: 13, marginBottom: 6 },
  scoreValue: { fontSize: 40, fontWeight: '800', marginBottom: 12 },
  barBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  bulletRow: { flexDirection: 'row', gap: 8, marginBottom: 10, alignItems: 'flex-start' },
  bulletText: { fontSize: 14, flex: 1, lineHeight: 20 },
  stepNum: { fontSize: 14, fontWeight: '700', width: 20 },
  compRow: { paddingVertical: 12 },
  compLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  compValue: { fontSize: 14, lineHeight: 20 },
  fmtHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fmtName: { fontSize: 15, fontWeight: '700' },
  fmtFocus: { fontSize: 13, marginTop: 2 },
  divider: { height: 1, marginVertical: 12 },
  sampleText: { fontSize: 14 },
  hint: { fontSize: 14, marginTop: 12 },
});
