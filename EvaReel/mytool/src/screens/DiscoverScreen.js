// ── Discover: a few locked teasers; tapping shows a "coming soon" modal ──
import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import StatusBarDark from '../components/StatusBarDark';
import PosterCard from '../components/PosterCard';
import { dramas } from '../data/mockDramas';

export default function DiscoverScreen() {
  const { colors, spacing, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const [notice, setNotice] = useState(false);
  const locked = dramas.filter((d) => !d.available).slice(0, 3);

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + spacing.sm }]}>
      <StatusBarDark />
      <View style={[styles.header, { paddingHorizontal: spacing.md }]}>
        <Text style={[styles.title, fonts.display, { color: colors.text }]}>Discover</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>More healing videos coming soon</Text>
      </View>
      <View style={[styles.row, { paddingHorizontal: spacing.md }]}>
        {locked.map((d) => (
          <PosterCard key={d.id} drama={d} locked onPress={() => setNotice(true)} />
        ))}
      </View>

      {notice ? (
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setNotice(false)}
          style={[styles.mask, { backgroundColor: 'rgba(0,0,0,0.8)' }]}
        >
          <View style={[styles.box, { backgroundColor: colors.surface, borderColor: colors.borderGold }]}>
            <Text style={[styles.boxTitle, fonts.display, { color: colors.text }]}>Coming Soon</Text>
            <Text style={[styles.boxMsg, { color: colors.textMuted }]}>
              This content is not open yet. Stay tuned.
            </Text>
            <TouchableOpacity onPress={() => setNotice(false)} style={[styles.ok, { backgroundColor: colors.gold }]}>
              <Text style={styles.okText}>OK</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { marginBottom: 16 },
  title: { fontSize: 26, lineHeight: 30 },
  subtitle: { fontSize: 14, marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  mask: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 50 },
  box: { width: '100%', maxWidth: 360, borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1 },
  boxTitle: { fontSize: 22, textAlign: 'center' },
  boxMsg: { fontSize: 14, textAlign: 'center', marginTop: 10, lineHeight: 21 },
  ok: { alignSelf: 'stretch', alignItems: 'center', paddingVertical: 12, marginTop: 18, borderRadius: 999 },
  okText: { color: '#1A1410', fontWeight: '800', fontSize: 15 },
});
