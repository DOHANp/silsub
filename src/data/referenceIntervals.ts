// RCPA Harmonised Reference Intervals — Table 6 (chemical pathology).
// 공표된 구간만 그대로 옮긴다. 나이 구간 밖은 외삽하지 않는다.
//
// TODO(verify): 개발 환경에서 rcpa.edu.au 직접 접속이 차단되어, 아래 값은 RCPA Table 6 페이지의
// 검색 엔진 발췌(snippet)로만 확인했다. 원문 표와 한 줄씩 대조해야 한다.

export type Sex = 'M' | 'F';
export type Specimen = 'serum' | 'plasma';

export interface ReferenceInterval {
  analyteId: string;
  /** RCPA 표기 분석물명 */
  rcpaName: string;
  loinc?: string;
  sex: Sex | 'any';
  /** 나이 하한(년, 포함) */
  ageMin: number;
  /** 나이 상한(년, 미포함) */
  ageMax: number;
  specimens: Specimen[];
  low: number;
  high: number;
  /** analytes.ts 의 unit key (UCUM 코드) */
  unit: string;
  unitLabel: string;
  notes?: string[];
  verify?: string;
}

const SNIPPET = 'TODO(verify): RCPA Table 6 원문 미대조 (검색 발췌로 확인)';
const ADULT = { ageMin: 18, ageMax: 120 } as const;
const SP: Specimen[] = ['serum', 'plasma'];

export const REFERENCE_INTERVALS: ReferenceInterval[] = [
  { analyteId: 'sodium', rcpaName: 'Sodium', loinc: '2951-2', sex: 'any', ...ADULT, specimens: SP, low: 135, high: 145, unit: 'mmol/L', unitLabel: 'mmol/L', verify: SNIPPET },
  {
    analyteId: 'potassium', rcpaName: 'Potassium', loinc: '2823-3', sex: 'any', ...ADULT, specimens: ['serum'], low: 3.5, high: 5.2, unit: 'mmol/L', unitLabel: 'mmol/L',
    notes: ['RCPA 는 혈청과 혈장 칼륨에 다른 구간을 둡니다. 혈장 구간은 확보하지 못해 넣지 않았습니다.'],
    verify: SNIPPET,
  },
  { analyteId: 'chloride', rcpaName: 'Chloride', loinc: '2075-0', sex: 'any', ...ADULT, specimens: SP, low: 95, high: 110, unit: 'mmol/L', unitLabel: 'mmol/L', verify: SNIPPET },
  { analyteId: 'bicarbonate', rcpaName: 'Bicarbonate', loinc: '1963-8', sex: 'any', ...ADULT, specimens: SP, low: 22, high: 32, unit: 'mmol/L', unitLabel: 'mmol/L', verify: SNIPPET },
  {
    analyteId: 'calcium', rcpaName: 'Calcium', loinc: '2000-8', sex: 'any', ...ADULT, specimens: SP, low: 2.1, high: 2.6, unit: 'mmol/L', unitLabel: 'mmol/L',
    notes: ['RCPA 는 알부민 보정 칼슘(LN 29265-6)에도 같은 구간을 제시합니다.'],
    verify: SNIPPET,
  },
  { analyteId: 'phosphate', rcpaName: 'Phosphate', loinc: '14879-1', sex: 'any', ageMin: 18, ageMax: 20, specimens: SP, low: 0.75, high: 1.65, unit: 'mmol/L', unitLabel: 'mmol/L', verify: SNIPPET },
  { analyteId: 'phosphate', rcpaName: 'Phosphate', loinc: '14879-1', sex: 'any', ageMin: 20, ageMax: 120, specimens: SP, low: 0.75, high: 1.5, unit: 'mmol/L', unitLabel: 'mmol/L', verify: SNIPPET },
  { analyteId: 'magnesium', rcpaName: 'Magnesium', loinc: '2601-3', sex: 'any', ...ADULT, specimens: SP, low: 0.7, high: 1.1, unit: 'mmol/L', unitLabel: 'mmol/L', verify: SNIPPET },
  { analyteId: 'alp', rcpaName: 'Alkaline phosphatase', sex: 'any', ageMin: 22, ageMax: 120, specimens: SP, low: 30, high: 110, unit: 'U/L', unitLabel: 'U/L', verify: SNIPPET },
  {
    analyteId: 'creatinine', rcpaName: 'Creatinine', loinc: '14682-9', sex: 'M', ageMin: 19, ageMax: 60, specimens: SP, low: 60, high: 110, unit: 'umol/L', unitLabel: 'µmol/L',
    notes: ['성인 크레아티닌 조화 구간은 60세 미만까지만 제시됩니다. 60세 이상은 검사실 자체 구간을 따릅니다.'],
    verify: `${SNIPPET}. 하한 나이(18세 vs 19세) 불확실`,
  },
  {
    analyteId: 'creatinine', rcpaName: 'Creatinine', loinc: '14682-9', sex: 'F', ageMin: 19, ageMax: 60, specimens: SP, low: 45, high: 90, unit: 'umol/L', unitLabel: 'µmol/L',
    notes: ['성인 크레아티닌 조화 구간은 60세 미만까지만 제시됩니다. 60세 이상은 검사실 자체 구간을 따릅니다.'],
    verify: `${SNIPPET}. 하한 나이(18세 vs 19세) 불확실`,
  },
  { analyteId: 'bilirubin', rcpaName: 'Bilirubin (total)', loinc: '14631-6', sex: 'any', ...ADULT, specimens: SP, low: 1, high: 20, unit: 'umol/L', unitLabel: 'µmol/L', verify: SNIPPET },
];

/** 참고구간 탭에 노출할 분석물 */
export const RI_ANALYTE_IDS = [...new Set(REFERENCE_INTERVALS.map((r) => r.analyteId))];

/**
 * RCPA Table 6 에 있을 것으로 보이나 이번에 값을 확보하지 못한 항목 (앱 UI 에 '데이터 없음' 사유로 표시).
 */
export const RI_GAPS: { name: string; reason: string }[] = [
  { name: 'ALT', reason: 'Table 6 발췌에 18세 이상 구간이 5–40 U/L, 5–35 U/L 두 줄로 나오나 어떤 기준(성별 등)으로 나뉘는지 확인하지 못함' },
  { name: 'AST, GGT, LD, Lipase', reason: 'Table 6 원문 접근 불가, 검색 발췌에 값이 없음' },
  { name: 'Total protein, Albumin, Urea', reason: '검색 발췌에 값이 없음 (일부는 2017년 이후 추가 제안 항목)' },
  { name: '혈장 칼륨', reason: '혈청 구간만 확인됨' },
  { name: '18세 미만 전 항목', reason: 'RCPA 소아 구간 원문 미확보 — CALIPER 를 참조하도록 안내만 함' },
];
