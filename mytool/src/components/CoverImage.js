// ── Gradient-first cover: renders the fallback art immediately, then swaps to
// the bundled photo once it decodes; on failure the gradient stays on —
// a cover card can never end up black. ──
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

export default function CoverImage({ asset, fallback, style, resizeMode = 'cover' }) {
  const [failed, setFailed] = useState(false);

  if (!asset) return fallback || null;

  return (
    <View style={style}>
      {fallback || null}
      {failed ? null : (
        <Image
          source={asset}
          style={StyleSheet.absoluteFill}
          resizeMode={resizeMode}
          onError={() => setFailed(true)}
        />
      )}
    </View>
  );
}