import type { Analyte, UnitOption } from '../data/analytes';
import { CREATININE_FORMULA } from '../data/analytes';
import { SOURCES, type Source } from '../data/sources';
import { molarMass } from './formula';
import { KIND_LABEL, classifyUnit, isValidUcum, ucumConvert, ucumMessage, type UnitKind } from './ucum';

export interface ConversionOk {
  ok: true;
  value: number;
  /** 선형 변환이면 1 원본단위 = factor 대상단위 */
  factor?: number;
  /** 아핀 변환(HbA1c)이면 y = slope·x + intercept */
  affine?: { slope: number; intercept: number };
  method: string;
  formula: string;
  steps: string[];
  assumptions: string[];
  sources: Source[];
}

export interface ConversionError {
  ok: false;
  reason: string;
  details: string[];
  sources: Source[];
}

export type ConversionResult = ConversionOk | ConversionError;

/** 같은 UCUM 코드라도 질량 기준(BUN 등)이 다를 수 있어 키를 따로 쓴다. */
export function unitKey(u: UnitOption): string {
  return u.massBasisFormula ? `${u.ucum}#${u.massBasisFormula}` : u.ucum;
}

export function findUnit(analyte: Analyte, key: string): UnitOption {
  return analyte.units.find((u) => unitKey(u) === key) ?? { ucum: key, label: key };
}

export function fmt(n: number, sig = 6): string {
  if (!Number.isFinite(n)) return String(n);
  if (n === 0) return '0';
  const abs = Math.abs(n);
  if (abs >= 1e-4 && abs < 1e9) return String(Number(n.toPrecision(sig)));
  return n.toExponential(sig - 1);
}

function reject(reason: string, details: string[] = [], sources: Source[] = [SOURCES.ucum]): ConversionError {
  return { ok: false, reason, details, sources };
}

function mwFor(analyte: Analyte, unit: UnitOption): { mw: number; label: string; formula: string } | null {
  const formula = unit.massBasisFormula ?? analyte.formula;
  if (!formula) return null;
  return {
    mw: molarMass(formula),
    formula,
    label: unit.massBasisFormula ? `${unit.massBasisLabel ?? formula}` : analyte.formulaLabel ?? formula,
  };
}

export function convert(analyte: Analyte, value: number, from: UnitOption, to: UnitOption): ConversionResult {
  if (!Number.isFinite(value)) return reject('값이 숫자가 아닙니다.', [], []);
  for (const u of [from, to]) {
    if (!isValidUcum(u.ucum)) {
      return reject(`"${u.ucum}" 은(는) 유효한 UCUM 단위 코드가 아닙니다.`, [
        'UCUM 코드는 대소문자를 구분합니다 (예: mg/dL, umol/L, 10*9/L, ukat/L).',
      ]);
    }
  }

  if (unitKey(from) === unitKey(to)) {
    return {
      ok: true,
      value,
      factor: 1,
      method: '동일 단위',
      formula: `${to.label} = ${from.label} × 1`,
      steps: ['원본과 대상 단위가 같습니다.'],
      assumptions: [],
      sources: [],
    };
  }

  if (analyte.special === 'hba1c') return convertHbA1c(value, from, to);
  if (analyte.special === 'urineRatio') return convertUrineRatio(analyte, value, from, to);

  const fk = classifyUnit(from.ucum);
  const tk = classifyUnit(to.ucum);
  const sameMassBasis = (from.massBasisFormula ?? '') === (to.massBasisFormula ?? '');

  // 1) 같은 차원 → UCUM 스케일 변환
  if (fk === tk && (fk !== 'massConc' || sameMassBasis) && fk !== 'unknown') {
    if (fk === 'arbitrary') return convertArbitrary(analyte, value, from, to);
    const factor = ucumConvert(from.ucum, 1, to.ucum);
    const v = ucumConvert(from.ucum, value, to.ucum);
    if (factor === null || v === null) return reject('UCUM 이 두 단위를 변환하지 못했습니다.', [ucumMessage(from.ucum, to.ucum)]);
    return {
      ok: true,
      value: v,
      factor,
      method: `UCUM 스케일 변환 (${KIND_LABEL[fk]} → ${KIND_LABEL[tk]}, 차원 동일)`,
      formula: `${to.label} = ${from.label} × ${fmt(factor)}`,
      steps: [
        `UCUM 차원 검사: "${from.ucum}" 와 "${to.ucum}" 는 모두 ${KIND_LABEL[fk]} 입니다.`,
        `UCUM 접두어·단위 정의로 계수 ${fmt(factor)} 를 계산했습니다.`,
      ],
      assumptions: fk === 'catalyticConc' ? ['UCUM 정의: 1 U = 1 µmol/min, 1 kat = 1 mol/s → 1 U = 1/60 µkat.'] : [],
      sources: [SOURCES.ucum, SOURCES.ucumLhc],
    };
  }

  // 2) 질량 ↔ 몰 ↔ 당량 (분자량, 전하)
  const chem: UnitKind[] = ['massConc', 'amountConc', 'eqConc'];
  if (chem.includes(fk) && chem.includes(tk)) return convertChemical(analyte, value, from, to, fk, tk);

  // 3) 그 외 → 거부
  return rejectByKind(analyte, from, to, fk, tk);
}

/**
 * UCUM 은 임의 단위([IU] 등)를 같은 임의 단위끼리만 공약 가능하다고 정의하지만,
 * ucum-lhc 는 임의 단위 변환을 일괄 거부한다. 두 코드의 임의 단위 원자가 같으면
 * 그 원자를 차원 있는 자리표시 단위(mol)로 치환해 접두어·부피 스케일만 UCUM 으로 계산한다.
 */
function convertArbitrary(analyte: Analyte, value: number, from: UnitOption, to: UnitOption): ConversionResult {
  const atoms = (c: string) => [...c.matchAll(/\[[^\]]+\]/g)].map((m) => m[0]).sort().join(',');
  if (atoms(from.ucum) !== atoms(to.ucum)) {
    return reject(`${analyte.en}: ${from.label} 와 ${to.label} 는 서로 다른 임의 단위라 변환할 수 없습니다.`, [
      'UCUM 에서 임의 단위는 같은 임의 단위끼리만 공약 가능합니다.',
    ]);
  }
  const sub = (c: string) => c.replace(/\[[^\]]+\]/g, 'mol');
  const factor = ucumConvert(sub(from.ucum), 1, sub(to.ucum));
  const v = ucumConvert(sub(from.ucum), value, sub(to.ucum));
  if (factor === null || v === null) return reject('UCUM 이 두 단위를 변환하지 못했습니다.');
  return {
    ok: true,
    value: v,
    factor,
    method: 'UCUM 스케일 변환 (같은 임의 단위, 접두어·부피만 환산)',
    formula: `${to.label} = ${from.label} × ${fmt(factor)}`,
    steps: [
      `두 단위 모두 같은 임의 단위 ${atoms(from.ucum)} 를 씁니다.`,
      `ucum-lhc 는 임의 단위 변환을 막아 두므로 ${atoms(from.ucum)} 를 자리표시 단위로 바꿔 접두어·부피 스케일만 계산했습니다.`,
    ],
    assumptions: ['국제단위 자체의 값(표준물질 효력)은 바뀌지 않습니다.'],
    sources: [SOURCES.ucum, SOURCES.ucumLhc],
  };
}

function convertChemical(
  analyte: Analyte,
  value: number,
  from: UnitOption,
  to: UnitOption,
  fk: UnitKind,
  tk: UnitKind,
): ConversionResult {
  const needsMass = fk === 'massConc' || tk === 'massConc';
  const needsEq = fk === 'eqConc' || tk === 'eqConc';
  if (needsMass && !analyte.formula) {
    return reject(`${analyte.en}: 질량 농도 ↔ 몰 농도 변환 근거(분자량)가 없습니다.`, [
      analyte.formulaNote ?? '이 분석물에는 정의된 화학식이 없습니다.',
    ]);
  }
  if (needsEq && !analyte.charge) {
    return reject(`${analyte.en}: 당량(mEq) 변환에 필요한 이온 전하가 정의되지 않았습니다.`, [
      analyte.chargeNote ?? '이 분석물은 단일 이온이 아니어서 당량 개념을 적용할 수 없습니다.',
    ]);
  }

  const steps: string[] = [];
  const assumptions = [...(analyte.assumptions ?? [])];
  const sources: Source[] = [SOURCES.ucum, SOURCES.ucumLhc];
  const z = Math.abs(analyte.charge ?? 1);
  const formulaParts: string[] = [];

  const toMmol = (v: number, u: UnitOption, k: UnitKind): number | null => {
    if (k === 'massConc') {
      const m = mwFor(analyte, u)!;
      return ucumConvert(u.ucum, v, 'mmol/L', m.mw);
    }
    if (k === 'amountConc') return ucumConvert(u.ucum, v, 'mmol/L');
    const meq = ucumConvert(u.ucum, v, 'meq/L');
    return meq === null ? null : meq / z;
  };
  const fromMmol = (v: number, u: UnitOption, k: UnitKind): number | null => {
    if (k === 'massConc') {
      const m = mwFor(analyte, u)!;
      return ucumConvert('mmol/L', v, u.ucum, m.mw);
    }
    if (k === 'amountConc') return ucumConvert('mmol/L', v, u.ucum);
    return ucumConvert('meq/L', v * z, u.ucum);
  };

  for (const [u, k, dir] of [
    [from, fk, '원본'],
    [to, tk, '대상'],
  ] as const) {
    if (k === 'massConc') {
      const m = mwFor(analyte, u)!;
      steps.push(
        `${dir} 질량 기준: ${m.label} — 분자량 ${fmt(m.mw)} g/mol (IUPAC 원자량으로 ${m.formula} 계산).`,
      );
      formulaParts.push(`M(${m.formula}) = ${fmt(m.mw)} g/mol`);
      if (!sources.includes(SOURCES.iupac)) sources.push(SOURCES.iupac);
    }
    if (k === 'eqConc') {
      steps.push(`${dir} 당량: |전하| = ${z} → 1 mmol = ${z} mEq.`);
      formulaParts.push(`|z| = ${z}`);
    }
  }

  const factorMmol = toMmol(1, from, fk);
  const factor = factorMmol === null ? null : fromMmol(factorMmol, to, tk);
  const vm = toMmol(value, from, fk);
  const v = vm === null ? null : fromMmol(vm, to, tk);
  if (factor === null || v === null) return reject('UCUM 계산 중 오류가 발생했습니다.', [ucumMessage(from.ucum, to.ucum)]);

  steps.push(`UCUM 으로 원본 → mmol/L → 대상 단위로 환산했습니다 (1 ${from.label} = ${fmt(factor)} ${to.label}).`);

  return {
    ok: true,
    value: v,
    factor,
    method:
      needsMass && needsEq
        ? '분자량 + 이온 전하 변환 (UCUM)'
        : needsMass
          ? '분자량 기반 질량↔몰 변환 (UCUM molecularWeight)'
          : needsEq
            ? '이온 전하 기반 몰↔당량 변환'
            : '몰 농도 변환',
    formula: `${to.label} = ${from.label} × ${fmt(factor)}   [${formulaParts.join(', ')}]`,
    steps,
    assumptions,
    sources,
  };
}

function rejectByKind(analyte: Analyte, from: UnitOption, to: UnitOption, fk: UnitKind, tk: UnitKind): ConversionError {
  const kinds = `${KIND_LABEL[fk]} → ${KIND_LABEL[tk]}`;
  const details = [`UCUM 차원 검사 결과: ${kinds}.`];
  const ucumMsg = ucumMessage(from.ucum, to.ucum);
  if (ucumMsg) details.push(`UCUM: ${ucumMsg}`);
  if (fk === 'catalyticConc' || tk === 'catalyticConc') {
    details.push(
      '효소 활성(U, kat)은 단위 시간당 기질 전환량이며 효소의 양(질량·몰)이 아닙니다. 둘 사이 계수는 효소의 비활성도와 측정 조건(온도, 기질, 보조인자)에 따라 달라 공표된 고정 계수가 없습니다.',
    );
  } else if (fk === 'arbitrary' || tk === 'arbitrary') {
    details.push('국제단위(IU)는 WHO 표준물질 기준의 임의 단위로, 질량·몰 단위와의 고정 관계가 없습니다.');
  } else if (fk === 'numberConc' || tk === 'numberConc') {
    details.push('세포 수(개수/부피)는 질량·몰 농도로 바꿀 근거가 없습니다.');
  } else if (fk === 'massConc' && tk === 'massConc') {
    details.push('질량 기준(예: BUN 의 질소 질량 vs 요소 질량)이 달라 분자량 경유 변환이 필요한데 정의되지 않았습니다.');
  }
  return reject(`${analyte.en}: ${from.label} → ${to.label} 변환은 근거가 없어 거부합니다.`, details);
}

// ---- 특수 변환 -------------------------------------------------------------

/** NGSP master equation: NGSP(%) = 0.09148 × IFCC(mmol/mol) + 2.152 */
export const NGSP_SLOPE = 0.09148;
export const NGSP_INTERCEPT = 2.152;

function convertHbA1c(value: number, from: UnitOption, to: UnitOption): ConversionResult {
  const src = [SOURCES.ngsp];
  const base = {
    method: 'HbA1c NGSP ↔ IFCC master equation (선형 회귀식, 비례 아님)',
    assumptions: [
      '두 표준화 체계의 측정 특이도 차이로 절편이 존재합니다. 단순 곱셈 계수가 아닙니다.',
      'IFCC 결과로부터 NGSP 를 유도하는 방향이 원 회귀식의 방향입니다.',
    ],
    sources: src,
  };
  if (from.ucum === '%' && to.ucum === 'mmol/mol') {
    const slope = 1 / NGSP_SLOPE;
    const intercept = -NGSP_INTERCEPT / NGSP_SLOPE;
    return {
      ok: true,
      value: (value - NGSP_INTERCEPT) / NGSP_SLOPE,
      affine: { slope, intercept },
      formula: `IFCC (mmol/mol) = (NGSP % − ${NGSP_INTERCEPT}) ÷ ${NGSP_SLOPE}  ≈ ${fmt(slope, 5)} × NGSP − ${fmt(-intercept, 5)}`,
      steps: [`NGSP master equation: NGSP = ${NGSP_SLOPE} × IFCC + ${NGSP_INTERCEPT} 를 IFCC 에 대해 풀었습니다.`],
      ...base,
    };
  }
  if (from.ucum === 'mmol/mol' && to.ucum === '%') {
    return {
      ok: true,
      value: NGSP_SLOPE * value + NGSP_INTERCEPT,
      affine: { slope: NGSP_SLOPE, intercept: NGSP_INTERCEPT },
      formula: `NGSP (%) = ${NGSP_SLOPE} × IFCC (mmol/mol) + ${NGSP_INTERCEPT}`,
      steps: ['NGSP master equation 을 그대로 적용했습니다.'],
      ...base,
    };
  }
  return reject(`HbA1c: ${from.label} → ${to.label} 변환은 지원하지 않습니다.`, [
    'HbA1c 는 NGSP(%) 와 IFCC(mmol/mol) 사이 master equation 만 근거가 있습니다.',
    '평균 혈당(eAG) 추정식 등은 단위 변환이 아니라 회귀 추정이므로 제외했습니다.',
  ], src);
}

function convertUrineRatio(analyte: Analyte, value: number, from: UnitOption, to: UnitOption): ConversionResult {
  const fk = classifyUnit(from.ucum);
  const tk = classifyUnit(to.ucum);
  const sources = [SOURCES.kdigo2024, SOURCES.ucum, SOURCES.iupac];
  const allowed: UnitKind[] = ['massRatio', 'massPerAmount'];
  if (!allowed.includes(fk) || !allowed.includes(tk)) {
    return reject(`${analyte.en}: ${from.label} → ${to.label} 변환 근거가 없습니다.`, [
      '소변 비율 검사는 (분석물 질량)/(크레아티닌 질량 또는 물질량) 형태만 변환합니다.',
    ], sources);
  }
  const mw = molarMass(CREATININE_FORMULA);
  // 기준 형태 mg/mmol 로 통일
  const toMgPerMmol = (v: number, u: UnitOption, k: UnitKind): number | null => {
    if (k === 'massPerAmount') return ucumConvert(u.ucum, v, 'mg/mmol');
    const mgPerG = ucumConvert(u.ucum, v, 'mg/g');
    const mmolPerG = ucumConvert('g', 1, 'mmol', mw); // 크레아티닌 1 g 의 mmol
    return mgPerG === null || mmolPerG === null ? null : mgPerG / mmolPerG;
  };
  const fromMgPerMmol = (v: number, u: UnitOption, k: UnitKind): number | null => {
    if (k === 'massPerAmount') return ucumConvert('mg/mmol', v, u.ucum);
    const mmolPerG = ucumConvert('g', 1, 'mmol', mw);
    return mmolPerG === null ? null : ucumConvert('mg/g', v * mmolPerG, u.ucum);
  };
  const a = toMgPerMmol(1, from, fk);
  const factor = a === null ? null : fromMgPerMmol(a, to, tk);
  const b = toMgPerMmol(value, from, fk);
  const v = b === null ? null : fromMgPerMmol(b, to, tk);
  if (factor === null || v === null) return reject('UCUM 계산 실패', [ucumMessage(from.ucum, to.ucum)], sources);
  const steps = [
    `크레아티닌(C4H7N3O) 분자량 ${fmt(mw)} g/mol 을 IUPAC 원자량으로 계산 → 크레아티닌 1 g = ${fmt(1000 / mw)} mmol.`,
  ];
  if (fk !== tk) steps.push('분모의 크레아티닌 질량(g) ↔ 물질량(mmol) 만 분자량으로 바꿉니다. 분자(알부민/단백)는 질량 그대로입니다.');
  return {
    ok: true,
    value: v,
    factor,
    method: fk === tk ? 'UCUM 스케일 변환' : '크레아티닌 분자량 기반 분모 변환',
    formula: `${to.label} = ${from.label} × ${fmt(factor)}`,
    steps,
    assumptions: [
      'KDIGO 는 범주 경계를 30 mg/g ≈ 3 mg/mmol, 300 mg/g ≈ 30 mg/mmol 로 반올림해 제시합니다. 여기서는 반올림하지 않은 계산값을 보여줍니다 (30 mg/g = 3.39 mg/mmol).',
    ],
    sources,
  };
}
