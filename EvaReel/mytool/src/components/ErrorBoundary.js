// ── Diagnostic: catch JS errors at startup and show them on screen instead of crashing ──
// Enable only while investigating the iOS 26 crash; remove from App.js once the root cause is found.
import React, { Component } from 'react';
import { DevSettings, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

let pendingError = null;
let registeredSetter = null;

function setErrorDisplay(fn) {
  registeredSetter = fn;
  if (fn && pendingError) {
    const e = pendingError;
    pendingError = null;
    fn(e);
  }
}

function showError(error) {
  if (registeredSetter) {
    registeredSetter(error);
  } else {
    pendingError = error;
  }
}

// Global safety net: catch uncaught JS exceptions outside render so we don't
// go straight to RN's fatal → crash.
if (global.ErrorUtils && typeof global.ErrorUtils.setGlobalHandler === 'function') {
  global.ErrorUtils.setGlobalHandler((error) => {
    showError(error);
  });
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  componentDidMount() {
    setErrorDisplay((error) => this.setState({ error }));
  }

  componentWillUnmount() {
    setErrorDisplay(null);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  reload = () => {
    try {
      if (DevSettings && typeof DevSettings.reload === 'function') {
        DevSettings.reload();
      }
    } catch (e) {
      // Release builds may not support hot reload — just ignore (reopen the app manually).
    }
  };

  render() {
    if (this.state.error) {
      return <ErrorScreen error={this.state.error} onReload={this.reload} />;
    }
    return this.props.children;
  }
}

function ErrorScreen({ error, onReload }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>App Crashed on Launch</Text>
      <Text style={styles.subtitle}>Please screenshot the content below and send it to the developer — it is key for diagnosing the crash.</Text>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.message}>{error && error.message ? error.message : String(error)}</Text>
        {error && error.stack ? <Text style={styles.stack}>{error.stack}</Text> : null}
      </ScrollView>
      <TouchableOpacity style={styles.btn} onPress={onReload}>
        <Text style={styles.btnText}>Reload</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1410',
    paddingTop: 90,
    paddingHorizontal: 20,
  },
  title: { color: '#D4AF37', fontSize: 20, fontWeight: '800' },
  subtitle: { color: '#9C8F7F', fontSize: 13, marginTop: 6 },
  scroll: { flex: 1, marginTop: 18, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 12 },
  scrollContent: { padding: 14 },
  message: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  stack: { color: '#D8C8A8', fontSize: 12, marginTop: 12, lineHeight: 18 },
  btn: {
    marginTop: 16,
    marginBottom: 40,
    backgroundColor: '#D4AF37',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: { color: '#1A1410', fontSize: 16, fontWeight: '800' },
});
