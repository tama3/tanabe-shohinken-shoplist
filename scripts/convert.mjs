// CSV → data.js converter
// Usage: node scripts/convert.mjs

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const csvFile = readdirSync(ROOT).find(f => f.endsWith('.csv'));
if (!csvFile) {
  console.error('No CSV file found in project root.');
  process.exit(1);
}

const csv = readFileSync(join(ROOT, csvFile), 'utf-8').replace(/^﻿/, '');
const lines = csv.split(/\r?\n/).filter(l => l.trim().length > 0);
const [, ...rows] = lines;

const smallKana = { 'ぁ':'あ','ぃ':'い','ぅ':'う','ぇ':'え','ぉ':'お','っ':'つ','ゃ':'や','ゅ':'ゆ','ょ':'よ','ゎ':'わ' };

function normalize(s) {
  if (!s) return '';
  return s
    .toLowerCase()
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .replace(/[ァ-ヶ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60))
    .replace(/[ぁぃぅぇぉっゃゅょゎ]/g, ch => smallKana[ch])
    .replace(/[ー\-‐-―－\s　・･（）()\[\]【】「」『』.,。、！!？?／/&＆'']/g, '');
}

const data = rows.map(row => {
  const cols = row.split(',');
  if (cols.length < 5) return null;
  const [name, area, place, category, items] = cols.map(s => s.trim());
  return {
    name, area, place, category, items,
    _s: normalize([name, area, place, category, items].join(' '))
  };
}).filter(Boolean);

const out = `// Auto-generated from ${csvFile}\n// Do not edit by hand. Run: node scripts/convert.mjs\nwindow.STORES = ${JSON.stringify(data)};\n`;
writeFileSync(join(ROOT, 'data.js'), out);

const areas = [...new Set(data.map(d => d.area))];
const cats = [...new Set(data.map(d => d.category))];
console.log(`Generated data.js with ${data.length} stores`);
console.log(`  Areas (${areas.length}): ${areas.join(', ')}`);
console.log(`  Categories (${cats.length}): ${cats.join(', ')}`);
