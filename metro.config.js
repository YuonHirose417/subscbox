// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// expo-sqlite の Web 版が参照する wasm を解決できるようにする（Web は開発時のレイアウト確認専用）
config.resolver.assetExts.push('wasm');

module.exports = config;
