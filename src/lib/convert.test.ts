import { ANALYTE_BY_ID, type UnitOption } from '../data/analytes';
import { convert, findUnit, unitKey, type ConversionResult } from './convert';

const run = (id: string, value: number, from: string, to: string): ConversionResult => {
  const a = ANALYTE_BY_ID[id];
  return convert(a, value, findUnit(a, from), findUnit(a, to));
};
const val = (r: ConversionResult) => {
  if (!r.ok) throw new Error(`rejected: ${r.reason}`);
  return r.value;
};
const custom = (code: string): UnitOption => ({ ucum: code, label: code });

describe('UCUM 스케일 변환', () => {
  it('mg/dL ↔ g/L, U/L ↔ µkat/L, 10³/µL ↔ 10⁹/L', () => {
    expect(val(run('albumin', 4, 'g/dL', 'g/L'))).toBeCloseTo(40, 10);
    expect(val(run('alt', 60, 'U/L', 'ukat/L'))).toBeCloseTo(1, 10);
    expect(val(run('platelet', 250, '10*3/uL', '10*9/L'))).toBeCloseTo(250, 9);
    expect(val(run('wbc', 5, '10*3/uL', '/uL'))).toBeCloseTo(5000, 6);
    expect(val(run('crp', 12, 'mg/L', 'mg/dL'))).toBeCloseTo(1.2, 10);
  });
  it('같은 임의 단위([IU])끼리는 접두어 스케일만 변환', () => {
    expect(val(run('tsh', 2.5, 'm[IU]/L', 'u[IU]/mL'))).toBeCloseTo(2.5, 10);
  });
});

describe('분자량 기반 질량 ↔ 몰', () => {
  it('glucose', () => {
    expect(val(run('glucose', 100, 'mg/dL', 'mmol/L'))).toBeCloseTo(5.5507, 4);
    expect(val(run('glucose', 7, 'mmol/L', 'mg/dL'))).toBeCloseTo(126.11, 2);
  });
  it('creatinine factor ≈ 88.4', () => {
    const r = run('creatinine', 1, 'mg/dL', 'umol/L');
    expect(r.ok && r.factor).toBeCloseTo(88.40, 2);
  });
  it('bilirubin factor ≈ 17.10', () => {
    expect(val(run('bilirubin', 1, 'mg/dL', 'umol/L'))).toBeCloseTo(17.10, 2);
  });
  it('cholesterol factor ≈ 0.02586', () => {
    expect(val(run('cholesterol', 1, 'mg/dL', 'mmol/L'))).toBeCloseTo(0.025863, 5);
  });
  it('triglycerides (triolein) factor ≈ 0.01129', () => {
    const r = run('triglycerides', 150, 'mg/dL', 'mmol/L');
    expect(val(r)).toBeCloseTo(1.694, 3);
    expect(r.ok && r.assumptions.join(' ')).toMatch(/트리올레인/);
  });
  it('계수는 하드코딩이 아니라 IUPAC 원자량에서 나옴 — 근거에 분자량이 표시됨', () => {
    const r = run('glucose', 1, 'mg/dL', 'mmol/L');
    expect(r.ok && r.formula).toMatch(/180\.156/);
    expect(r.ok && r.sources.map((s) => s.id)).toEqual(expect.arrayContaining(['ucum', 'iupac']));
  });
});

describe('이온 전하 (mEq)', () => {
  it('Ca²⁺: 10 mg/dL = 2.495 mmol/L = 4.990 mEq/L', () => {
    expect(val(run('calcium', 10, 'mg/dL', 'mmol/L'))).toBeCloseTo(2.4951, 4);
    expect(val(run('calcium', 10, 'mg/dL', 'meq/L'))).toBeCloseTo(4.9903, 4);
    expect(val(run('calcium', 2.5, 'mmol/L', 'meq/L'))).toBeCloseTo(5, 10);
  });
  it('Na⁺, Cl⁻ : mmol/L = mEq/L', () => {
    expect(val(run('sodium', 140, 'mmol/L', 'meq/L'))).toBeCloseTo(140, 10);
    expect(val(run('chloride', 100, 'meq/L', 'mmol/L'))).toBeCloseTo(100, 10);
  });
  it('인산은 전하가 pH 의존이라 mEq 거부', () => {
    const r = convert(ANALYTE_BY_ID.phosphate, 3, findUnit(ANALYTE_BY_ID.phosphate, 'mg/dL'), custom('meq/L'));
    expect(r.ok).toBe(false);
    expect(!r.ok && r.details.join(' ')).toMatch(/pH/);
  });
});

describe('BUN ↔ 요소', () => {
  it('BUN 14 mg/dL = 5.0 mmol/L urea (factor 0.357)', () => {
    const r = run('urea', 14, 'mg/dL#N2', 'mmol/L');
    expect(val(r)).toBeCloseTo(4.9975, 3);
    expect(r.ok && r.factor).toBeCloseTo(0.357, 3);
  });
  it('BUN → 요소 질량 (×2.14)', () => {
    expect(val(run('urea', 10, 'mg/dL#N2', 'mg/dL'))).toBeCloseTo(21.438, 2);
  });
});

describe('HbA1c NGSP ↔ IFCC', () => {
  it('master equation', () => {
    expect(val(run('hba1c', 6.5, '%', 'mmol/mol'))).toBeCloseTo(47.53, 2);
    expect(val(run('hba1c', 48, 'mmol/mol', '%'))).toBeCloseTo(6.543, 3);
    expect(Math.round(val(run('hba1c', 7, '%', 'mmol/mol')))).toBe(53);
  });
  it('왕복 변환 일관성', () => {
    const ifcc = val(run('hba1c', 8.2, '%', 'mmol/mol'));
    expect(val(run('hba1c', ifcc, 'mmol/mol', '%'))).toBeCloseTo(8.2, 10);
  });
  it('절편이 있으므로 factor 가 아니라 affine 으로 보고', () => {
    const r = run('hba1c', 6.5, '%', 'mmol/mol');
    expect(r.ok && r.factor).toBeUndefined();
    expect(r.ok && r.affine).toBeTruthy();
  });
});

describe('uACR / uPCR (KDIGO)', () => {
  it('30 mg/g ≈ 3.39 mg/mmol (KDIGO 반올림 ≈ 3)', () => {
    expect(val(run('uacr', 30, 'mg/g', 'mg/mmol'))).toBeCloseTo(3.394, 3);
    expect(val(run('uacr', 3, 'mg/mmol', 'mg/g'))).toBeCloseTo(26.52, 2);
  });
  it('uPCR g/g → mg/mmol', () => {
    expect(val(run('upcr', 0.5, 'g/g', 'mg/mmol'))).toBeCloseTo(56.56, 2);
    expect(val(run('upcr', 500, 'mg/g', 'g/g'))).toBeCloseTo(0.5, 10);
  });
});

describe('근거 없는 변환 거부', () => {
  it('mg/dL → U/L 거부 (효소 활성)', () => {
    const a = ANALYTE_BY_ID.alt;
    const r = convert(a, 50, custom('mg/dL'), findUnit(a, 'U/L'));
    expect(r.ok).toBe(false);
    expect(!r.ok && r.details.join(' ')).toMatch(/효소 활성/);
  });
  it('albumin g/dL → mmol/L 거부 (분자량 없음)', () => {
    const a = ANALYTE_BY_ID.albumin;
    const r = convert(a, 4, findUnit(a, 'g/dL'), custom('mmol/L'));
    expect(r.ok).toBe(false);
  });
  it('TSH mIU/L → ng/mL 거부', () => {
    const a = ANALYTE_BY_ID.tsh;
    expect(convert(a, 2, findUnit(a, 'm[IU]/L'), custom('ng/mL')).ok).toBe(false);
  });
  it('세포 수 → 질량 거부', () => {
    const a = ANALYTE_BY_ID.wbc;
    expect(convert(a, 5, findUnit(a, '10*9/L'), custom('mg/dL')).ok).toBe(false);
  });
  it('잘못된 UCUM 코드 거부', () => {
    const a = ANALYTE_BY_ID.glucose;
    expect(convert(a, 5, custom('mg/xyz'), findUnit(a, 'mmol/L')).ok).toBe(false);
    expect(convert(a, 5, custom('banana'), findUnit(a, 'mmol/L')).ok).toBe(false);
  });
  it('HbA1c % → mg/dL 거부', () => {
    const a = ANALYTE_BY_ID.hba1c;
    expect(convert(a, 6, findUnit(a, '%'), custom('mg/dL')).ok).toBe(false);
  });
  it('NaN 거부', () => {
    expect(run('glucose', NaN, 'mg/dL', 'mmol/L').ok).toBe(false);
  });
});

describe('모든 분석물·단위쌍 왕복 일관성 (스왑)', () => {
  for (const a of Object.values(ANALYTE_BY_ID)) {
    for (const f of a.units) {
      for (const t of a.units) {
        it(`${a.id}: ${unitKey(f)} → ${unitKey(t)} → back`, () => {
          const there = convert(a, 3.7, f, t);
          expect(there.ok).toBe(true);
          const back = convert(a, (there as { value: number }).value, t, f);
          expect(back.ok && back.value).toBeCloseTo(3.7, 9);
        });
      }
    }
  }
});
