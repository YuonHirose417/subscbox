#!/usr/bin/env node
/**
 * assets/service-logos/<serviceKey>.png を走査して src/data/serviceLogos.ts を生成する。
 * Metro は動的 require ができないため、ロゴを追加・削除したら `npm run logos` を実行する。
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'assets', 'service-logos');
const out = path.join(root, 'src', 'data', 'serviceLogos.ts');

const keys = fs.existsSync(dir)
  ? fs
      .readdirSync(dir)
      .filter((f) => /^[a-z0-9_]+\.png$/.test(f))
      .map((f) => f.replace(/\.png$/, ''))
      .sort()
  : [];

const lines = keys.map((k) => `  ${k}: require('@/assets/service-logos/${k}.png'),`);
const body = `// このファイルは scripts/generate-service-logos.js が生成する（手で編集しない）
/** require() した画像のアセットID */
type ImageAsset = number;

export const serviceLogos: Partial<Record<string, ImageAsset>> = {
${lines.join('\n')}${lines.length ? '\n' : ''}};
`;
fs.writeFileSync(out, body);
console.log(`serviceLogos.ts: ${keys.length} logo(s)`);
