// ── Login prompt modal: shown when a guest taps Save ──
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

export default function LoginPromptModal({ visible, onClose, onLogin }) {
  const { colors, fonts } = useTheme();
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.mask}>
        <LinearGradient colors={[colors.surface, colors.background]} style={[styles.card, { borderColor: colors.borderGold }]}>
          <Text style={styles.icon}>🔖</Text>
          <Text style={[styles.title, fonts.display, { color: colors.text }]}>Sign in to Save</Text>
          <Text style={[styles.desc, { color: colors.textMuted }]}>
            Create a free account to keep your saved dramas{'\n'}and watch history across devices
          </Text>
          <TouchableOpacity onPress={onLogin} style={[styles.primaryBtn, { backgroundColor: colors.gold, borderRadius: 999 }]}>
            <Text style={styles.primaryText}>Log In / Sign Up</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Text style={[styles.close, { color: colors.textMuted }]}>Not Now</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  mask: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1 },
  icon: { fontSize: 34, marginBottom: 10 },
  title: { fontSize: 24, textAlign: 'center' },
  desc: { fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  primaryBtn: { alignSelf: 'stretch', alignItems: 'center', paddingVertical: 14, marginTop: 18 },
  primaryText: { color: '#200B06', fontWeight: '800', fontSize: 16 },
  close: { marginTop: 14, fontSize: 13 },
});
