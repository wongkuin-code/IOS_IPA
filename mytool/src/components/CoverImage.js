// ── Cover image with base64-first rendering and a local-asset fallback ──
// Renders the inline base64 poster; if it hasn't loaded within FALLBACK_DELAY
// (or errors), swaps to the Expo-standard bundled asset so a black card never sticks.
import { useEffect, useRef, useState } from 'react';
import { Image } from 'react-native';

const FALLBACK_DELAY = 10000;

export default function CoverImage({ uri, asset, style, resizeMode = 'cover' }) {
  const [useAsset, setUseAsset] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    loadedRef.current = false;
    setUseAsset(false);
    const timer = setTimeout(() => {
      if (!loadedRef.current) setUseAsset(true);
    }, FALLBACK_DELAY);
    return () => clearTimeout(timer);
  }, [uri, asset]);

  if (useAsset && asset) {
    return <Image source={asset} style={style} resizeMode={resizeMode} />;
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      resizeMode={resizeMode}
      onLoad={() => {
        loadedRef.current = true;
      }}
      onError={() => setUseAsset(true)}
    />
  );
}
