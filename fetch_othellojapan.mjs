// Fetches today's tsume-Othello problems (beginner and advanced) from Othello! JAPAN
// (https://www.othello.org/) and writes docs/tsume/othellojapan_today.txt.
// Only today's two positions are kept; nothing is archived.
// The pages embed the position as:  var gTurn = "1";  var gBoard = "<64 digits>";
//   board digit 0 = empty, 1 = black, 2 = white (a1 first, row by row); gTurn 1 = black to move.
import { writeFileSync } from 'node:fs';

const SOURCES = [
  { label: '初級編', url: 'https://www.othello.org/egev-easy/' },
  { label: '上級編', url: 'https://www.othello.org/egev/' },
];
const OUT = 'docs/tsume/othellojapan_today.txt';

async function fetchProblem(src) {
  const res = await fetch(src.url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; daily-puzzle-fetch)' } });
  if (!res.ok) throw new Error(`${src.url}: HTTP ${res.status}`);
  // the page is Shift_JIS, but the parts we need are plain ASCII
  const html = Buffer.from(await res.arrayBuffer()).toString('latin1');
  const board = /var\s+gBoard\s*=\s*"([012]{64})"/.exec(html);
  const turn = /var\s+gTurn\s*=\s*"([12])"/.exec(html);
  const date = /var\s+gDate\s*=\s*"(\d{8})"/.exec(html);
  if (!board || !turn) throw new Error(`${src.url}: position not found (page layout changed?)`);
  const cells = board[1].replace(/0/g, '-').replace(/1/g, 'X').replace(/2/g, 'O');
  const d = date ? `${date[1].slice(0, 4)}-${date[1].slice(4, 6)}-${date[1].slice(6, 8)}` : new Date().toISOString().slice(0, 10);
  return `今日の詰めオセロ(OthelloJapan) ${src.label} ${d},${cells},${turn[1] === '1' ? 'X' : 'O'}`;
}

const lines = [];
const errors = [];
for (const src of SOURCES) {
  try {
    lines.push(await fetchProblem(src));
  } catch (e) {
    errors.push(String(e.message || e));
  }
  await new Promise((r) => setTimeout(r, 2000));
}
for (const e of errors) console.error(e);
if (lines.length === 0) {
  console.error('No problem could be fetched; keeping the previous file.');
  process.exit(1);
}
const header = [
  '# 今日の詰めオセロ(OthelloJapan)',
  '# 出典: Othello! JAPAN https://www.othello.org/ (当日分のみ。過去の問題は保存していません)',
  '# 書式: タイトル,盤面64文字(a1から行ごと。X=黒 O=白 -=空き),手番(X=黒 O=白)',
];
writeFileSync(OUT, header.concat(lines).join('\n') + '\n');
console.log(lines.join('\n'));
