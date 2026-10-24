// 規約・プライバシーポリシーの公開ページ（GitHub Pages の docs/）を、アプリ内と同じ文面（src/data/legal.ts）から作る。
// 使い方: npm run legal  （文面を変えたら実行してコミットする）
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { privacyPolicy, termsOfUse, LEGAL_UPDATED_AT } = await import('../src/data/legal.ts');

const CONTACT = 'yuon.hirose.info@gmail.com';

const escape = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 本文中の URL をリンクにする
const linkify = (text) =>
  escape(text).replace(/https:\/\/[^\s（）)]+/g, (url) => `<a href="${url}">${url}</a>`);

function page(title, body) {
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)} | サブスクBox</title>
<style>
  :root { color-scheme: light dark; --bg: #F5F6FA; --surface: #FFFFFF; --text: #0F172A; --sub: #56667D; --accent: #3D63E8; }
  @media (prefers-color-scheme: dark) { :root { --bg: #0B0D14; --surface: #151823; --text: #F1F5F9; --sub: #94A3B8; --accent: #7397FF; } }
  body { margin: 0; background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif; line-height: 1.75; }
  main { max-width: 720px; margin: 0 auto; padding: 32px 16px 64px; }
  h1 { font-size: 26px; margin: 0 0 4px; }
  .updated { color: var(--sub); font-size: 14px; margin: 0 0 24px; }
  section { background: var(--surface); border-radius: 16px; padding: 16px 20px; margin: 0 0 12px; }
  h2 { font-size: 17px; margin: 0 0 6px; }
  p { margin: 0; color: var(--sub); font-size: 15px; overflow-wrap: anywhere; }
  a { color: var(--accent); }
  nav { margin: 0 0 24px; font-size: 14px; }
  nav a { margin-right: 16px; }
</style>
</head>
<body>
<main>
<nav><a href="./">サブスクBox</a><a href="privacy.html">プライバシーポリシー</a><a href="terms.html">利用規約</a></nav>
${body}
</main>
</body>
</html>
`;
}

function documentPage(title, sections) {
  const body = [
    `<h1>${escape(title)}</h1>`,
    `<p class="updated">制定日・最終改定日：${escape(LEGAL_UPDATED_AT)}</p>`,
    ...sections.map((s) => `<section><h2>${escape(s.heading)}</h2><p>${linkify(s.body)}</p></section>`),
  ].join('\n');
  return page(title, body);
}

const index = page(
  'サポート',
  [
    '<h1>サブスクBox</h1>',
    '<p class="updated">サブスクリプションを手入力で管理する iPhone アプリ</p>',
    '<section><h2>お問い合わせ</h2><p>ご質問・不具合のご報告は <a href="mailto:' + CONTACT + '">' + CONTACT + '</a> までご連絡ください。</p></section>',
    '<section><h2>ドキュメント</h2><p><a href="privacy.html">プライバシーポリシー</a><br><a href="terms.html">利用規約</a></p></section>',
  ].join('\n'),
);

const docs = join(root, 'docs');
writeFileSync(join(docs, 'privacy.html'), documentPage('プライバシーポリシー', privacyPolicy));
writeFileSync(join(docs, 'terms.html'), documentPage('利用規約', termsOfUse));
writeFileSync(join(docs, 'index.html'), index);
// GitHub Pages の Jekyll 処理を無効にする
writeFileSync(join(docs, '.nojekyll'), '');
console.log('docs/ を更新しました');
