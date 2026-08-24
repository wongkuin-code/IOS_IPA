import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-native': path.resolve(__dirname, 'node_modules/react-native-web'),
      'expo-status-bar': path.resolve(__dirname, 'shims/expo-status-bar.js'),
      '@react-native-async-storage/async-storage': path.resolve(
        __dirname,
        'shims/async-storage.js',
      ),
    },
    extensions: ['.web.js', '.js', '.jsx', '.json'],
    modules: [path.resolve(__dirname, 'node_modules'), 'node_modules'],
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    __DEV__: JSON.stringify(true),
    global: 'globalThis',
  },
  esbuild: {
    loader: 'jsx',
    include: /.*\.js$/,
    exclude: [],
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1500,
  },
});
