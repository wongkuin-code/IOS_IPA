// ── First-frame cover: loads a drama's first video and pauses it on frame 1 ──
// Used wherever a poster appears but we'd rather show the video's real first
// frame instead of a static image (Discover grid, strips, hero cards).
//
// 关键保证：静态封面永远垫在底层，视频层只有在其首帧真正渲染出来后才盖上去
// （opacity 0→1）。所以无论加载中、加载失败、还是没有片源，卡片都绝不黑屏、
// 绝不空白 —— "封面必须永远有东西可看"。
import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import CoverImage from './CoverImage';

export default function VideoCover({ src, fallback, style, resizeMode = 'cover' }) {
  const [failed, setFailed] = useState(false);
  const [frameReady, setFrameReady] = useState(false);

  const player = useVideoPlayer(src, (p) => {
    p.loop = false;
    p.muted = true;
    p.playbackRate = 1.0;
  });

  // 换片源/出错时，先把"首帧已就绪"复位 → 视觉回到底层静态封面。
  useEffect(() => {
    setFrameReady(false);
    setFailed(false);
  }, [src]);

  // Cover only: never autoplay. Once ready, park on the very first frame.
  useEventListener(player, 'statusChange', ({ status }) => {
    if (status === 'readyToPlay' && src) {
      player.pause();
      player.currentTime = 0.02;
    } else if (status === 'error') {
      setFailed(true);
    }
  });

  const showVideo = src && !failed;

  return (
    <View style={style}>
      {/* 静态封面（封面图/主题渐变）永远垫在底层，pointerEvents 关掉免得挡点击 */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {fallback || null}
      </View>
      {showVideo ? (
        <VideoView
          // opacity 0 时视频仍在挂载加载，但不可见 → 底下封面一直亮着；
          // 首帧真的画出来了才 transition 到可见，杜绝"黑屏覆盖封面"。
          style={[StyleSheet.absoluteFill, { opacity: frameReady ? 1 : 0 }]}
          player={player}
          contentFit={resizeMode}
          nativeControls={false}
          playsInline
          onFirstFrameRender={() => setFrameReady(true)}
        />
      ) : null}
    </View>
  );
}

// Convenience: prefer the video's first frame; otherwise show the static cover.
export function DramaVideoCover({ drama, asset, fallback, style }) {
  return (
    <VideoCover
      src={firstVideo(drama)}
      fallback={<CoverImage asset={asset} fallback={fallback} style={style} />}
      style={style}
    />
  );
}

function firstVideo(drama) {
  if (!drama) return null;
  if (Array.isArray(drama.episodeVideos) && drama.episodeVideos.length) {
    return drama.episodeVideos[0];
  }
  return drama.videoUrl || null;
}