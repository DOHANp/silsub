import { ANALYTE_BY_ID } from '../src/data/analytes';
import { convert, findUnit } from '../src/lib/convert';
import { CMEINFO, LABCORP, NBME, type FactorRow } from './fixtures/crossReference';

const conv = (id: string, v: number, from: string, to: string) => {
  const a = ANALYTE_BY_ID[id];
  const r = convert(a, v, findUnit(a, from), findUnit(a, to));
  if (!r.ok) throw new Error(r.reason);
  return r.value;
};

// NBME 는 SI 값을 2~3 유효숫자로 반올림·절사해 표기하므로 3 % 이내 일치를 요구한다.
const REL_TOL = 0.03;
const near = (actual: number, expected: number) => Math.abs(actual - expected) / expected <= REL_TOL;

describe('교차 검증: NBME Laboratory Reference Values', () => {
  for (const row of NBME) {
    it(`${row.analyteId}: ${row.conventional.unit} 구간을 계산 변환하면 NBME SI 구간과 일치`, () => {
      const hi = conv(row.analyteId, row.conventional.high, row.conventional.unit, row.si.unit);
      expect(near(hi, row.si.high), `high ${hi} vs ${row.si.high}`).toBe(true);
      if (row.conventional.low !== undefined && row.si.low !== undefined) {
        const lo = conv(row.analyteId, row.conventional.low, row.conventional.unit, row.si.unit);
        expect(near(lo, row.si.low), `low ${lo} vs ${row.si.low}`).toBe(true);
      }
    });
  }
});

const factorSuite = (name: string, rows: FactorRow[]) =>
  describe(`교차 검증: ${name}`, () => {
    if (rows.length === 0) {
      it.todo(`TODO(verify): ${name} 원문을 확보하지 못해 대조 데이터가 없음`);
      return;
    }
    for (const r of rows) {
      it(`${r.analyteId} ${r.from}→${r.to} ≈ ${r.factor}`, () => {
        expect(near(conv(r.analyteId, 1, r.from, r.to), r.factor)).toBe(true);
      });
    }
  });

factorSuite('Labcorp SI Unit Conversion Table', LABCORP);
factorSuite('CMEinfo Laboratory Units Conversion Table', CMEINFO);
