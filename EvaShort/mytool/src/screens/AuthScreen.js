// ── Auth screen: login / register / guest login / guest upgrade ──
import { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../auth/AuthContext';
import StatusBarDark from '../components/StatusBarDark';

export default function AuthScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { status, user, authError, setAuthError, login, register, guestLogin, upgrade } = useAuth();
  const isGuest = Boolean(user && user.isGuest);

  // Set right before a successful auth action; used to pop/reset the stack.
  const justSucceeded = useRef(false);

  useEffect(() => {
    if (!justSucceeded.current) return;
    justSucceeded.current = false;
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  }, [status, navigation]);

  const closeIfStacked = () => {
    if (navigation.canGoBack()) navigation.goBack();
  };

  const [mode, setMode] = useState('login'); // login | register
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  const submitting = busy || status === 'loading';

  const switchMode = (m) => {
    setMode(m);
    setAuthError(null);
  };

  const submit = async () => {
    if (submitting) return;
    setBusy(true);
    try {
      if (mode === 'register') {
        if (!account.trim() || !password) {
          setAuthError('Please enter an account and password');
          return;
        }
        if (isGuest) {
          const ok = await upgrade(account.trim(), password);
          if (ok) closeIfStacked();
        } else {
          const ok = await register(account.trim(), password);
          if (ok) justSucceeded.current = true;
        }
      } else {
        if (!account.trim() || !password) {
          setAuthError('Please enter your account and password');
          return;
        }
        const ok = await login(account.trim(), password);
        if (ok) {
          if (isGuest) closeIfStacked();
          else justSucceeded.current = true;
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const upgradeAccount = async () => {
    if (submitting) return;
    setBusy(true);
    try {
      if (!account.trim() || !password) {
        setAuthError('Please enter an account and password');
        return;
      }
      const ok = await upgrade(account.trim(), password);
      if (ok) closeIfStacked();
    } finally {
      setBusy(false);
    }
  };

  const guest = async () => {
    if (submitting) return;
    setBusy(true);
    try {
      const ok = await guestLogin();
      if (ok) justSucceeded.current = true;
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 40 }]}>
      <StatusBarDark />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 30 }]} keyboardShouldPersistTaps="handled">
          <Text style={[styles.logo, fonts.display, { color: colors.gold }]}>✦ EvaShort</Text>
          <Text style={[styles.tagline, { color: colors.textMuted }]}>
            {isGuest ? 'Turn your guest profile into a full account' : 'Short dramas, big feelings'}
          </Text>

          <View style={styles.segment}>
            {['login', 'register'].map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => switchMode(m)}
                style={[styles.segmentBtn, mode === m && { backgroundColor: colors.gold }]}
              >
                <Text style={{ color: mode === m ? '#200B06' : colors.textMuted, fontWeight: '800', fontSize: 14 }}>
                  {m === 'login' ? 'Log In' : 'Sign Up'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.textMuted }]}>Account</Text>
          <TextInput
            value={account}
            onChangeText={setAccount}
            placeholder={isGuest ? 'Create an account name (2-20 chars)' : 'Your account name'}
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.borderGold }]}
            maxLength={20}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={[styles.label, { color: colors.textMuted }]}>Password</Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.borderGold }]}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPw}
              style={[styles.inputInner, { color: colors.text }]}
            />
            <TouchableOpacity onPress={() => setShowPw((v) => !v)} style={styles.eyeBtn} hitSlop={10}>
              <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {authError ? <Text style={styles.error}>{authError}</Text> : null}

          <TouchableOpacity
            disabled={submitting}
            onPress={isGuest && mode === 'register' ? upgradeAccount : submit}
            style={[styles.primaryBtn, { backgroundColor: colors.gold }, submitting && styles.disabled]}
          >
            {busy ? (
              <ActivityIndicator color="#200B06" />
            ) : (
              <Text style={styles.primaryText}>
                {mode === 'login' ? 'Log In' : isGuest ? 'Upgrade My Account' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          {!isGuest ? (
            <TouchableOpacity disabled={submitting} onPress={guest} style={styles.guestBtn}>
              <Text style={[styles.guestText, { color: colors.textMuted }]}>
                {busy ? 'Creating guest profile…' : 'Continue as Guest ›'}
              </Text>
            </TouchableOpacity>
          ) : null}

          <Text style={[styles.footnote, { color: colors.textMuted }]}>
            By continuing you agree to our Privacy Policy.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 24 },
  logo: { fontSize: 34, textAlign: 'center', letterSpacing: 1 },
  tagline: { fontSize: 13, textAlign: 'center', marginTop: 6, marginBottom: 26 },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#2A211A',
    borderRadius: 12,
    padding: 4,
    marginBottom: 22,
  },
  segmentBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 6, marginLeft: 2 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, marginBottom: 12 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 12,
    paddingRight: 8,
  },
  inputInner: { flex: 1, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15 },
  eyeBtn: { padding: 6 },
  error: { fontSize: 12, color: '#E8A08B', lineHeight: 17, marginBottom: 10 },
  primaryBtn: { alignItems: 'center', paddingVertical: 15, borderRadius: 999, marginTop: 6 },
  primaryText: { color: '#200B06', fontWeight: '800', fontSize: 16 },
  disabled: { opacity: 0.6 },
  guestBtn: { alignItems: 'center', paddingVertical: 16, marginTop: 4 },
  guestText: { fontSize: 14, fontWeight: '700' },
  footnote: { fontSize: 11, textAlign: 'center', marginTop: 14, lineHeight: 16 },
});
