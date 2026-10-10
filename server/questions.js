// Loads and validates the question bank. Answers live only on the server and are never sent to teams.
import fs from 'node:fs';
import path from 'node:path';

const LEVELS = ['easy', 'medium', 'hard'];

function validateQuestion(q, where, problems) {
  if (!q.id) problems.push(`${where}: missing id`);
  if (!q.prompt) problems.push(`${where} (${q.id}): missing prompt`);
  if (q.type === 'mcq') {
    if (!Array.isArray(q.options) || q.options.length < 2) problems.push(`${where} (${q.id}): mcq needs 2+ options`);
    else if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) {
      problems.push(`${where} (${q.id}): mcq answer must be an option index (0-based)`);
    }
  } else if (q.type === 'numeric') {
    if (typeof q.answer !== 'number') problems.push(`${where} (${q.id}): numeric answer must be a number`);
  } else {
    problems.push(`${where} (${q.id}): type must be "mcq" or "numeric" (all answers are MCQ or numeric)`);
  }
}

export function validateBank(bank, config) {
  const problems = [];
  const warnings = [];
  for (const round of ['round1', 'round2', 'round3']) {
    if (!Array.isArray(bank[round])) problems.push(`${round} must be a list`);
  }
  if (bank.practice !== undefined && !Array.isArray(bank.practice)) problems.push('practice must be a list');
  if (problems.length) return { problems, warnings };

  const ids = new Set();
  for (const round of ['practice', 'round1', 'round2', 'round3']) {
    if (!bank[round]) continue;
    bank[round].forEach((q, i) => {
      validateQuestion(q, `${round}[${i}]`, problems);
      if (ids.has(q.id)) problems.push(`duplicate id ${q.id}`);
      ids.add(q.id);
      if (round === 'round2' && !LEVELS.includes(q.level)) problems.push(`round2 (${q.id}): level must be easy, medium or hard`);
      if (round === 'round2' && !q.domain) problems.push(`round2 (${q.id}): domain is shown in the market and is required`);
    });
  }

  if (bank.round1.length !== 25) warnings.push(`round1 has ${bank.round1.length} questions; the plan calls for 25`);
  for (const level of LEVELS) {
    const have = bank.round2.filter((q) => q.level === level).length;
    const max = config.r2.levels[level].max;
    if (have < max) warnings.push(`round2 has ${have} ${level} questions but teams may buy up to ${max}`);
  }
  const main = bank.round3.filter((q) => !q.reserve && !q.practice).length;
  if (main < 15) warnings.push(`round3 has ${main} main questions; the plan calls for 15`);
  if (!bank.round3.some((q) => q.reserve)) warnings.push('round3 has no reserve questions for voided buzzes');
  if (!bank.practice?.length) warnings.push('no practice questions: the practice round will be empty');
  if (!bank.round3.some((q) => q.practice)) warnings.push('round3 has no practice questions for buzzer practice');
  return { problems, warnings };
}

export function loadQuestions(dir, config) {
  const custom = path.join(dir, 'questions.json');
  const file = process.env.QUESTIONS_FILE || (fs.existsSync(custom) ? custom : path.join(dir, 'questions.sample.json'));
  const bank = JSON.parse(fs.readFileSync(file, 'utf8'));
  const { problems, warnings } = validateBank(bank, config);
  if (problems.length) {
    throw new Error(`Question bank ${file} is invalid:\n  - ${problems.join('\n  - ')}`);
  }
  return { bank, file, warnings, isSample: file.endsWith('questions.sample.json') };
}
