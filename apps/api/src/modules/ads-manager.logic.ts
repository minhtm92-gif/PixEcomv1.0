export type BudgetSourceUnit = 'MAJOR' | 'MINOR';

export function normalizeBudgetToCents(value: number, hintedUnit?: BudgetSourceUnit | null) {
  if (hintedUnit === 'MINOR') return { cents: Math.round(value), unit: 'MINOR' as BudgetSourceUnit };
  if (hintedUnit === 'MAJOR') return { cents: Math.round(value * 100), unit: 'MAJOR' as BudgetSourceUnit };

  const hasDecimals = value % 1 !== 0;
  if (hasDecimals) return { cents: Math.round(value * 100), unit: 'MAJOR' as BudgetSourceUnit };
  if (value <= 500) return { cents: Math.round(value * 100), unit: 'MAJOR' as BudgetSourceUnit };
  return { cents: Math.round(value), unit: 'MINOR' as BudgetSourceUnit };
}

export function validateUniquePlatforms(platformIds: string[]) {
  const unique = new Set(platformIds);
  return {
    uniqueCount: unique.size,
    listSize: platformIds.length,
    hasDuplicates: unique.size !== platformIds.length
  };
}
