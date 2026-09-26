#!/usr/bin/env node
// 依對照檔改寫 data/quotes.json 既有語錄的文字（id 與標籤不動）。
//
// 用法：
//   node scripts/apply-quote-edits.mjs <edits.json> [--dry-run]
//
// edits.json 是 { "<id>": "<新文字>", ... } 的物件。
// 守門與 scripts/generate-quotes.sh 相同：字元白名單、簡體偵測（opencc-js cn→tw）、
// 長度 8–30 字、與其他語錄及本批文字去重；任何一筆不過就整批中止、不寫檔。
// 寫回格式與生成腳本一致（一行一物件），交給 tests/content.test.ts 再驗一次。
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const quotesFile = path.join(projectRoot, 'data/quotes.json');
const require = createRequire(import.meta.url);
const OpenCC = require(path.join(projectRoot, 'node_modules/opencc-js'));
const toTw = OpenCC.Converter({ from: 'cn', to: 'tw' });

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const editsFile = args.find((a) => !a.startsWith('--'));
if (!editsFile) {
  console.error('用法：node scripts/apply-quote-edits.mjs <edits.json> [--dry-run]');
  process.exit(2);
}

// 與 generate-quotes.sh 相同的守門規則。
const allowed = /^[一-鿿㐀-䶿　-〿＀-￯—…]+$/u;
const normalize = (s) => s.replace(/[　-〿＀-￯—…]/gu, '').replace(/臺/gu, '台');
const sharedChars = new Set(Array.from('只念干后面里云系台制志周征松借布采划冲舍余于几向咸准秋谷范表丑才家回困卷克蒙折致朱御愿岳筑症沾游郁它升涂么'));
const simplifiedChars = (text) =>
  Array.from(text).filter((c) => !sharedChars.has(c) && toTw(c) !== c);

const quotes = JSON.parse(fs.readFileSync(quotesFile, 'utf8'));
const edits = JSON.parse(fs.readFileSync(editsFile, 'utf8'));
const byId = new Map(quotes.map((q) => [q.id, q]));
const editIds = new Set(Object.keys(edits).map(Number));

// 去重基準：未被改寫的語錄 + 本批已通過的新文字。
const seen = new Set(quotes.filter((q) => !editIds.has(q.id)).map((q) => normalize(q.text)));
const rejected = [];
const applied = [];

for (const [key, value] of Object.entries(edits)) {
  const id = Number(key);
  const text = String(value ?? '').trim();
  const chars = Array.from(text).length;
  const simplified = simplifiedChars(text);
  let reason = '';
  if (!byId.has(id)) reason = `id ${id} 不存在`;
  else if (!text) reason = '文字空白';
  else if (!allowed.test(text)) reason = '含白名單以外字元';
  else if (simplified.length) reason = `疑似簡體字 ${simplified.join('')}`;
  else if (chars < 8 || chars > 30) reason = `長度 ${chars} 字超出 8–30`;
  else if (seen.has(normalize(text))) reason = '與其他語錄重複';
  if (reason) {
    rejected.push(`id ${id}：${reason}｜${text}`);
    continue;
  }
  seen.add(normalize(text));
  applied.push({ id, before: byId.get(id).text, after: text });
}

for (const { id, before, after } of applied) {
  console.log(`id ${id}（${byId.get(id).tags.join('、')}）`);
  console.log(`  舊：${before}`);
  console.log(`  新：${after}`);
}
if (rejected.length) {
  console.error(`\n${rejected.length} 筆未過守門，整批中止：`);
  for (const line of rejected) console.error(`  ${line}`);
  process.exit(1);
}
if (dryRun) {
  console.log(`\n--dry-run：${applied.length} 筆全數通過守門，未寫檔。`);
  process.exit(0);
}
for (const { id, after } of applied) byId.get(id).text = after;
const body = quotes.map((q) => `  ${JSON.stringify(q)}`).join(',\n');
fs.writeFileSync(quotesFile, `[\n${body}\n]\n`);
console.log(`\n已改寫 ${applied.length} 筆，共 ${quotes.length} 則。`);
