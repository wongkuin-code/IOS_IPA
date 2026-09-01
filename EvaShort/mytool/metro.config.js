const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 确保图片资源（@react-navigation/elements 等依赖 import 的 .png）在 web 打包时能被 Metro 当作静态资源解析
const assetExts = new Set([
  ...config.resolver.assetExts,
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'bmp',
]);
config.resolver.assetExts = Array.from(assetExts);

module.exports = config;
