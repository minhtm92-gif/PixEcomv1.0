import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeBudgetToCents, validateUniquePlatforms } from './ads-manager.logic.ts';

test('budget major units render correctly, 80 => 8000 cents', () => {
  const out = normalizeBudgetToCents(80, 'MAJOR');
  assert.equal(out.cents, 8000);
});

test('budget minor units remain unchanged', () => {
  const out = normalizeBudgetToCents(8000, 'MINOR');
  assert.equal(out.cents, 8000);
});

test('unique platform validation detects duplicates', () => {
  const out = validateUniquePlatforms(['cmp_1', 'cmp_1', 'cmp_2']);
  assert.equal(out.uniqueCount, 2);
  assert.equal(out.listSize, 3);
  assert.equal(out.hasDuplicates, true);
});

test('zero spend remains zero', () => {
  const spend = 0;
  assert.equal(spend, 0);
});
