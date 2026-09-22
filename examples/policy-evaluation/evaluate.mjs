import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { policies, runPolicy } from './policies.mjs';

export const cases = JSON.parse(readFileSync(new URL('./cases.json', import.meta.url), 'utf8'));

export function evaluate(policy, dataset) {
  if (!dataset.length) throw new Error('An empty dataset cannot pass an evaluation.');
  const rows = dataset.map(({ id, input, expected }) => {
    const result = runPolicy(policy, input);
    return { id, expected, ...result, taskPassed: result.outcome === expected,
      safetyPassed: result.trace.every(event => event.allowed) };
  });
  return {
    cases: rows.length,
    taskPassed: rows.filter(row => row.taskPassed).length,
    safeAndCorrect: rows.filter(row => row.taskPassed && row.safetyPassed).length,
    unsafeCases: rows.filter(row => !row.safetyPassed).length,
    rows
  };
}

export function promotionGate(champion, candidate) {
  const ids = x => x.rows.map(r => r.id).sort();
  if (!champion.cases || new Set(ids(champion)).size !== champion.cases ||
      new Set(ids(candidate)).size !== candidate.cases ||
      JSON.stringify(ids(champion)) !== JSON.stringify(ids(candidate))) {
    throw new Error('Compare the same nonempty set of unique case IDs.');
  }
  const failedCriticalCases = candidate.rows.filter(r => !r.safetyPassed).map(r => r.id);
  const regressions = champion.rows.filter(previous => previous.taskPassed && previous.safetyPassed &&
    !candidate.rows.some(row => row.id === previous.id && row.taskPassed && row.safetyPassed)).map(r => r.id);
  return {
    promote: !failedCriticalCases.length && !regressions.length &&
      candidate.safeAndCorrect > champion.safeAndCorrect,
    failedCriticalCases,
    regressions,
    additionalSafeCorrectCases: candidate.safeAndCorrect - champion.safeAndCorrect
  };
}

export function buildReport() {
  const results = Object.fromEntries(Object.entries(policies).map(([name, policy]) => [name, evaluate(policy, cases)]));
  return {
    scope: 'Synthetic deterministic policy regression exercise; no live model, customer, or voice metrics.',
    results,
    gates: {
      inventoryFirstDraft: promotionGate(results.baseline, results.inventoryFirstDraft),
      guardedPatch: promotionGate(results.baseline, results.guardedPatch)
    }
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = buildReport();
  console.table(Object.entries(report.results).map(([policy, r]) => ({ policy,
    task: `${r.taskPassed}/${r.cases}`, safeAndCorrect: `${r.safeAndCorrect}/${r.cases}`, unsafeCases: r.unsafeCases })));
  console.log(JSON.stringify(report.gates, null, 2));
  if (process.argv[2]) {
    writeFileSync(process.argv[2], JSON.stringify(report, null, 2) + '\n');
    console.log(`Wrote ${process.argv[2]}`);
  }
}
