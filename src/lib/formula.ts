import { ATOMIC_WEIGHTS } from '../data/atomicWeights';

/** 화학식(예: "C6H12O6", "CH4N2O")을 원소별 개수로 분해한다. 괄호는 1단계까지 지원. */
export function parseFormula(formula: string): Record<string, number> {
  const counts: Record<string, number> = {};
  const add = (el: string, n: number) => {
    if (!(el in ATOMIC_WEIGHTS)) throw new Error(`알 수 없는 원소: ${el}`);
    counts[el] = (counts[el] ?? 0) + n;
  };
  const re = /\(([^()]+)\)(\d*)|([A-Z][a-z]?)(\d*)/g;
  let consumed = 0;
  for (const m of formula.matchAll(re)) {
    if (m.index !== consumed) throw new Error(`화학식 해석 실패: ${formula}`);
    consumed += m[0].length;
    if (m[1] !== undefined) {
      const mult = m[2] ? Number(m[2]) : 1;
      for (const [el, n] of Object.entries(parseFormula(m[1]))) add(el, n * mult);
    } else {
      add(m[3], m[4] ? Number(m[4]) : 1);
    }
  }
  if (consumed !== formula.length || consumed === 0) throw new Error(`화학식 해석 실패: ${formula}`);
  return counts;
}

/** IUPAC 원자량으로 분자량(g/mol)을 계산한다. */
export function molarMass(formula: string): number {
  return Object.entries(parseFormula(formula)).reduce(
    (sum, [el, n]) => sum + ATOMIC_WEIGHTS[el] * n,
    0,
  );
}
