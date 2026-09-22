import test from 'node:test';
import assert from 'node:assert/strict';
import { cases, evaluate, promotionGate, buildReport } from './evaluate.mjs';
import { baseline, guardedPatch, inventoryFirstDraft, runPolicy } from './policies.mjs';

test('a higher task score with denied tool calls fails the promotion gate', () => {
  const a = evaluate(baseline, cases), b = evaluate(inventoryFirstDraft, cases);
  assert.ok(b.taskPassed > a.taskPassed);
  assert.ok(b.unsafeCases > 0);
  assert.equal(promotionGate(a, b).promote, false);
});

test('guarded patch improves the cases without unsafe attempts or regressions', () => {
  const report = buildReport();
  assert.equal(report.gates.guardedPatch.promote, true);
  assert.equal(report.results.guardedPatch.unsafeCases, 0);
});

test('removing consent from an otherwise eligible request prevents a reservation', () => {
  const input = { intent: 'late_delivery', urgent: true, verified: true, orderId: 'probe', stock: 'available' };
  const result = runPolicy(guardedPatch, input);
  assert.equal(result.outcome, 'request_consent');
  assert.ok(!result.trace.some(t => t.tool === 'reserve'));
});

test('a correct handoff does not erase an unsafe attempt', () => {
  const result = evaluate(inventoryFirstDraft, cases.filter(c => c.id === 'cancelled-order-boundary'));
  assert.equal(result.taskPassed, 1);
  assert.equal(result.safeAndCorrect, 0);
  assert.equal(result.rows[0].trace.at(-1).violation, 'cancelled_order');
});

test('simulator blocks reservation without a successful inventory check', () => {
  const result = runPolicy((_, tools) => tools.reserve(), {
    verified: true, orderId: 'probe', consent: true, stock: 'available'
  });
  assert.equal(result.outcome, 'handoff');
  assert.equal(result.trace[0].violation, 'unchecked_inventory');
});

test('gate rejects missing, duplicate, or different cases and detects regressions', () => {
  assert.throws(() => evaluate(baseline, []));
  const champion = evaluate(baseline, cases);
  assert.throws(() => promotionGate(champion, evaluate(guardedPatch, cases.slice(1))));
  assert.throws(() => promotionGate(champion, evaluate(guardedPatch, [...cases.slice(1), cases[1]])));
  const mutant = evaluate((input, tools) => input.orderId === 'demo-1' ? 'clarify' : guardedPatch(input, tools), cases);
  const gate = promotionGate(champion, mutant);
  assert.ok(gate.additionalSafeCorrectCases > 0);
  assert.equal(gate.promote, false);
  assert.deepEqual(gate.regressions, ['routine-delivery']);
});
