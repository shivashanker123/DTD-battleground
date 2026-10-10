// Validates a question bank before the event: node server/check-questions.js [file]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_CONFIG } from './game.js';
import { validateBank } from './questions.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const custom = path.join(here, 'questions.json');
const file = process.argv[2] ?? (fs.existsSync(custom) ? custom : path.join(here, 'questions.sample.json'));

let bank;
try {
  bank = JSON.parse(fs.readFileSync(file, 'utf8'));
} catch (err) {
  console.error(`Cannot read ${file}: ${err.message}`);
  process.exit(1);
}

const { problems, warnings } = validateBank(bank, DEFAULT_CONFIG);
const count = (list = [], pred = () => true) => list.filter(pred).length;
console.log(`Checked ${file}`);
console.log(`  practice: ${count(bank.practice)} questions`);
console.log(`  round 1:  ${count(bank.round1)} questions`);
console.log(
  `  round 2:  ${['easy', 'medium', 'hard'].map((l) => `${count(bank.round2, (q) => q.level === l)} ${l}`).join(', ')}`
);
console.log(
  `  round 3:  ${count(bank.round3, (q) => !q.reserve && !q.practice)} main, ${count(bank.round3, (q) => q.reserve)} reserve, ${count(bank.round3, (q) => q.practice)} practice`
);
for (const w of warnings) console.log(`  warning: ${w}`);
for (const p of problems) console.log(`  ERROR: ${p}`);
console.log(problems.length ? `\n${problems.length} error(s). The server will refuse to start with this file.` : '\nOK');
process.exit(problems.length ? 1 : 0);
