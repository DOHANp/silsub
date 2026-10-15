import type { Analyte } from '../data/analytes';

const norm = (s: string) => s.toLowerCase().normalize('NFKC').replace(/[\s\-_().,/]/g, '');

/** 영문·한글·동의어 검색. 정확히 일치 > 접두 일치 > 부분 일치 순으로 정렬. */
export function searchAnalytes(list: Analyte[], query: string): Analyte[] {
  const q = norm(query);
  if (!q) return list;
  const scored: { a: Analyte; score: number }[] = [];
  for (const a of list) {
    const names = [a.en, a.ko, a.id, ...a.synonyms].map(norm);
    let score = 0;
    for (const n of names) {
      if (n === q) score = Math.max(score, 3);
      else if (n.startsWith(q)) score = Math.max(score, 2);
      else if (n.includes(q)) score = Math.max(score, 1);
    }
    if (score > 0) scored.push({ a, score });
  }
  return scored.sort((x, y) => y.score - x.score).map((s) => s.a);
}
