// ── Edit profile: nickname + avatar emoji picker (guest can upgrade here) ──
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../auth/AuthContext';
import StatusBarDark from '../components/StatusBarDark';

const AVATARS = ['👤', '🦊', '🐼', '🦁', '🐯', '🐸', '🐳', '🦄', '🐝', '🌸', '🔥', '🌟', '🎬', '🎭', '😎', '🧸'];

export default function EditProfileScreen() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, updateProfile } = useAuth();
  const isGuest = Boolean(user && user.isGuest);

  const [nickname, setNickname] = useState(user ? user.nickname : '');
  const [avatar, setAvatar] = useState(user && user.avatar ? user.avatar : '👤');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!nickname.trim()) {
      Alert.alert('Nickname required', 'Please enter a nickname first.');
      return;
    }
    setBusy(true);
    const r = await updateProfile(nickname.trim(), avatar);
    setBusy(false);
    if (r.ok) {
      Alert.alert('Saved', 'Your profile has been updated.');
      navigation.goBack();
    } else {
      Alert.alert('Update failed', r.error || 'Please try again later.');
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + spacing.sm }]}>
      <StatusBarDark />
      <View style={[styles.header, { paddingHorizontal: spacing.md }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{isGuest ? 'Upgrade Account' : 'Edit Profile'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 40 }}>
        {isGuest ? (
          <View style={[styles.note, { borderColor: colors.borderGold }]}>
            <Text style={[styles.noteText, { color: colors.textMuted }]}>
              You are browsing as a guest. Pick a nickname and avatar — your saved shows and watch history will be kept on this account.
            </Text>
          </View>
        ) : null}

        <Text style={[styles.label, { color: colors.textMuted }]}>Avatar</Text>
        <View style={styles.avatarRow}>
          {AVATARS.map((a) => (
            <TouchableOpacity
              key={a}
              onPress={() => setAvatar(a)}
              style={[
                styles.avatarCell,
                { backgroundColor: colors.surface },
                avatar === a && { borderColor: colors.gold, borderWidth: 2 },
              ]}
            >
              <Text style={styles.avatarEmoji}>{a}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.textMuted }]}>Nickname</Text>
        <TextInput
          value={nickname}
          onChangeText={setNickname}
          placeholder="Your display name"
          placeholderTextColor={colors.textMuted}
          maxLength={20}
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.borderGold }]}
        />

        <TouchableOpacity
          disabled={busy}
          onPress={save}
          style={[styles.saveBtn, { backgroundColor: colors.gold }, busy && styles.disabled]}
        >
          {busy ? <ActivityIndicator color="#200B06" /> : <Text style={styles.saveText}>Save</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  title: { flex: 1, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  note: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 18 },
  noteText: { fontSize: 12, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 8, marginLeft: 2 },
  avatarRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  avatarCell: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,77,46,0.16)',
  },
  avatarEmoji: { fontSize: 24 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, marginBottom: 20 },
  saveBtn: { alignItems: 'center', paddingVertical: 15, borderRadius: 999, marginTop: 6 },
  saveText: { color: '#200B06', fontWeight: '800', fontSize: 16 },
  disabled: { opacity: 0.6 },
});
