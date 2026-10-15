// 분석물 정의. 변환 계수는 여기 적지 않는다 — 화학식(→ IUPAC 원자량으로 분자량 계산),
// 이온 전하, UCUM 단위 코드만 두고 계수는 엔진이 계산한다.

export interface UnitOption {
  /** UCUM case-sensitive 코드 */
  ucum: string;
  /** 화면 표시용 */
  label: string;
  /**
   * 질량 단위가 분석물 전체가 아니라 특정 부분의 질량으로 표시될 때 그 화학식.
   * 예: BUN(혈중 요소 질소)은 요소 1 mol 당 질소 2개의 질량 → "N2".
   */
  massBasisFormula?: string;
  massBasisLabel?: string;
}

export type SpecialKind = 'hba1c' | 'urineRatio';

export interface Analyte {
  id: string;
  en: string;
  ko: string;
  synonyms: string[];
  /** 몰 농도의 기준 물질 화학식. 없으면 질량↔몰 변환을 거부한다. */
  formula?: string;
  formulaLabel?: string;
  /** 이온 전하(부호 포함). 없으면 mEq 변환을 거부한다. */
  charge?: number;
  /** 전하가 없는 이유 등 */
  chargeNote?: string;
  /** 분자량이 없는 이유 */
  formulaNote?: string;
  units: UnitOption[];
  special?: SpecialKind;
  assumptions?: string[];
}

const mgdL: UnitOption = { ucum: 'mg/dL', label: 'mg/dL' };
const mmolL: UnitOption = { ucum: 'mmol/L', label: 'mmol/L' };
const umolL: UnitOption = { ucum: 'umol/L', label: 'µmol/L' };
const meqL: UnitOption = { ucum: 'meq/L', label: 'mEq/L' };
const gdL: UnitOption = { ucum: 'g/dL', label: 'g/dL' };
const gL: UnitOption = { ucum: 'g/L', label: 'g/L' };
const UL: UnitOption = { ucum: 'U/L', label: 'U/L' };
const ukatL: UnitOption = { ucum: 'ukat/L', label: 'µkat/L' };

const PROTEIN_NOTE =
  '단백질 혼합물(또는 이질적 거대분자)이라 단일 화학식으로 분자량을 정할 수 없어 몰 농도 변환을 제공하지 않습니다.';
const ENZYME_UNITS = [UL, ukatL];

export const ANALYTES: Analyte[] = [
  {
    id: 'glucose',
    en: 'Glucose',
    ko: '포도당(혈당)',
    synonyms: ['GLU', 'blood sugar', 'FBS', '공복혈당', '혈당', '글루코스'],
    formula: 'C6H12O6',
    formulaLabel: '포도당 C6H12O6',
    units: [mgdL, mmolL],
  },
  {
    id: 'creatinine',
    en: 'Creatinine',
    ko: '크레아티닌',
    synonyms: ['Cr', 'Cre', 'SCr', '크레아티닌'],
    formula: 'C4H7N3O',
    formulaLabel: '크레아티닌 C4H7N3O',
    units: [mgdL, umolL, mmolL],
  },
  {
    id: 'urea',
    en: 'Urea / Blood urea nitrogen (BUN)',
    ko: '요소 / 혈중요소질소',
    synonyms: ['BUN', 'urea nitrogen', 'SUN', '요소질소', '요소'],
    formula: 'CH4N2O',
    formulaLabel: '요소 CH4N2O',
    units: [
      { ucum: 'mg/dL', label: 'mg/dL (BUN, 요소 질소로 표시)', massBasisFormula: 'N2', massBasisLabel: '요소 1 mol 당 질소 2원자(N2)의 질량' },
      { ucum: 'mg/dL', label: 'mg/dL (요소 자체 질량)' },
      mmolL,
    ],
    assumptions: ['요소 1분자에 질소 2원자가 있으므로 BUN(질소 질량) ↔ 요소 몰수는 N2 의 몰질량으로 환산합니다.'],
  },
  {
    id: 'uricAcid',
    en: 'Uric acid (urate)',
    ko: '요산',
    synonyms: ['UA', 'urate', '요산'],
    formula: 'C5H4N4O3',
    formulaLabel: '요산 C5H4N4O3',
    units: [mgdL, umolL, mmolL],
  },
  {
    id: 'cholesterol',
    en: 'Cholesterol (total / HDL / LDL / non-HDL)',
    ko: '콜레스테롤 (총·HDL·LDL)',
    synonyms: ['TC', 'total cholesterol', 'HDL', 'LDL', 'HDL-C', 'LDL-C', '총콜레스테롤', '고밀도', '저밀도'],
    formula: 'C27H46O',
    formulaLabel: '콜레스테롤 C27H46O',
    units: [mgdL, mmolL],
    assumptions: ['지단백 분획(HDL/LDL)도 그 안의 콜레스테롤 분자 수로 표시하므로 같은 분자량을 씁니다.'],
  },
  {
    id: 'triglycerides',
    en: 'Triglycerides',
    ko: '중성지방',
    synonyms: ['TG', 'triglyceride', 'TAG', '트리글리세라이드', '중성지방'],
    formula: 'C57H104O6',
    formulaLabel: '트리올레인 C57H104O6 (가정)',
    units: [mgdL, mmolL],
    assumptions: [
      '중성지방은 지방산 조성이 다른 혼합물입니다. 관례에 따라 대표 분자를 트리올레인(glyceryl trioleate, C57H104O6)으로 가정해 분자량을 계산합니다.',
    ],
  },
  {
    id: 'calcium',
    en: 'Calcium (total)',
    ko: '칼슘',
    synonyms: ['Ca', 'Ca2+', '총칼슘', '칼슘'],
    formula: 'Ca',
    formulaLabel: 'Ca',
    charge: 2,
    units: [mgdL, mmolL, meqL],
  },
  {
    id: 'magnesium',
    en: 'Magnesium',
    ko: '마그네슘',
    synonyms: ['Mg', 'Mg2+', '마그네슘'],
    formula: 'Mg',
    formulaLabel: 'Mg',
    charge: 2,
    units: [mgdL, mmolL, meqL],
  },
  {
    id: 'phosphate',
    en: 'Phosphate (inorganic phosphorus)',
    ko: '인(무기인산)',
    synonyms: ['P', 'Pi', 'PO4', 'phosphorus', '인', '인산'],
    formula: 'P',
    formulaLabel: '인 원자 P (무기인을 인 질량으로 표시)',
    chargeNote: '혈중 인산은 HPO4²⁻/H2PO4⁻ 비율이 pH에 따라 달라 고정 전하가 없으므로 mEq 변환을 거부합니다.',
    units: [mgdL, mmolL],
  },
  {
    id: 'sodium',
    en: 'Sodium',
    ko: '나트륨',
    synonyms: ['Na', 'Na+', '소디움', '나트륨'],
    formula: 'Na',
    formulaLabel: 'Na',
    charge: 1,
    units: [mmolL, meqL, mgdL],
  },
  {
    id: 'potassium',
    en: 'Potassium',
    ko: '칼륨',
    synonyms: ['K', 'K+', '포타슘', '칼륨'],
    formula: 'K',
    formulaLabel: 'K',
    charge: 1,
    units: [mmolL, meqL, mgdL],
  },
  {
    id: 'chloride',
    en: 'Chloride',
    ko: '염소(클로라이드)',
    synonyms: ['Cl', 'Cl-', '클로라이드', '염소', '염화물'],
    formula: 'Cl',
    formulaLabel: 'Cl',
    charge: -1,
    units: [mmolL, meqL, mgdL],
  },
  {
    id: 'bicarbonate',
    en: 'Bicarbonate (total CO2)',
    ko: '중탄산염',
    synonyms: ['HCO3', 'HCO3-', 'tCO2', 'total CO2', '중탄산', '이산화탄소'],
    formula: 'HCO3',
    formulaLabel: '중탄산 HCO3⁻',
    charge: -1,
    units: [mmolL, meqL],
  },
  {
    id: 'iron',
    en: 'Iron',
    ko: '철(혈청철)',
    synonyms: ['Fe', 'serum iron', '혈청철', '철'],
    formula: 'Fe',
    formulaLabel: 'Fe',
    units: [{ ucum: 'ug/dL', label: 'µg/dL' }, umolL],
  },
  {
    id: 'bilirubin',
    en: 'Bilirubin (total)',
    ko: '빌리루빈(총)',
    synonyms: ['TB', 'T.bil', 'TBil', 'total bilirubin', '총빌리루빈', '빌리루빈'],
    formula: 'C33H36N4O6',
    formulaLabel: '빌리루빈 C33H36N4O6',
    units: [mgdL, umolL],
  },
  {
    id: 'lactate',
    en: 'Lactate',
    ko: '젖산',
    synonyms: ['lactic acid', 'Lac', '락테이트', '젖산'],
    formula: 'C3H6O3',
    formulaLabel: '젖산 C3H6O3 (가정)',
    units: [mgdL, mmolL],
    assumptions: ['질량 표시는 젖산(C3H6O3, 비해리형) 기준이라고 가정합니다. 젖산 이온(C3H5O3⁻)으로 계산하면 약 1 % 차이가 납니다.'],
  },
  {
    id: 'ammonia',
    en: 'Ammonia',
    ko: '암모니아',
    synonyms: ['NH3', 'NH4+', '암모니아'],
    formula: 'NH3',
    formulaLabel: '암모니아 NH3 (가정)',
    units: [{ ucum: 'ug/dL', label: 'µg/dL' }, umolL],
    assumptions: ['µg/dL 질량 표시는 NH3 분자 기준으로 가정합니다(검사실에 따라 NH4⁺ 또는 N 기준일 수 있음).'],
  },
  {
    id: 'lithium',
    en: 'Lithium',
    ko: '리튬',
    synonyms: ['Li', '리튬'],
    formula: 'Li',
    formulaLabel: 'Li',
    charge: 1,
    units: [mmolL, meqL, { ucum: 'mg/L', label: 'mg/L' }],
  },
  {
    id: 'cortisol',
    en: 'Cortisol',
    ko: '코르티솔',
    synonyms: ['hydrocortisone', '코티솔', '코르티솔'],
    formula: 'C21H30O5',
    formulaLabel: '코르티솔 C21H30O5',
    units: [{ ucum: 'ug/dL', label: 'µg/dL' }, { ucum: 'nmol/L', label: 'nmol/L' }],
  },
  {
    id: 'testosterone',
    en: 'Testosterone',
    ko: '테스토스테론',
    synonyms: ['T', '테스토스테론'],
    formula: 'C19H28O2',
    formulaLabel: '테스토스테론 C19H28O2',
    units: [{ ucum: 'ng/dL', label: 'ng/dL' }, { ucum: 'nmol/L', label: 'nmol/L' }],
  },
  {
    id: 'ft4',
    en: 'Free thyroxine (FT4)',
    ko: '유리 티록신',
    synonyms: ['FT4', 'free T4', 'thyroxine', 'T4', '티록신', '갑상선'],
    formula: 'C15H11I4NO4',
    formulaLabel: '티록신 C15H11I4NO4',
    units: [{ ucum: 'ng/dL', label: 'ng/dL' }, { ucum: 'pmol/L', label: 'pmol/L' }],
  },
  {
    id: 'vitd',
    en: '25-hydroxyvitamin D',
    ko: '25-수산화비타민 D',
    synonyms: ['25(OH)D', '25-OH vitamin D', 'calcidiol', 'vitamin D', '비타민D', '비타민 D'],
    formula: 'C27H44O2',
    formulaLabel: '25-OH 비타민 D3 (calcifediol) C27H44O2 (가정)',
    units: [{ ucum: 'ng/mL', label: 'ng/mL' }, { ucum: 'nmol/L', label: 'nmol/L' }],
    assumptions: ['D3 형(calcifediol) 분자량으로 계산합니다. D2 형(C28H44O2)이 섞이면 실제 몰 농도와 약간 다를 수 있습니다.'],
  },
  {
    id: 'b12',
    en: 'Vitamin B12 (cobalamin)',
    ko: '비타민 B12',
    synonyms: ['B12', 'cobalamin', 'cyanocobalamin', '코발라민', '비타민B12'],
    formula: 'C63H88CoN14O14P',
    formulaLabel: '시아노코발라민 C63H88CoN14O14P (가정)',
    units: [{ ucum: 'pg/mL', label: 'pg/mL' }, { ucum: 'pmol/L', label: 'pmol/L' }],
    assumptions: ['시아노코발라민 분자량으로 계산합니다.'],
  },
  {
    id: 'folate',
    en: 'Folate',
    ko: '엽산',
    synonyms: ['folic acid', '엽산', '폴산'],
    formula: 'C19H19N7O6',
    formulaLabel: '엽산(folic acid) C19H19N7O6 (가정)',
    units: [{ ucum: 'ng/mL', label: 'ng/mL' }, { ucum: 'nmol/L', label: 'nmol/L' }],
    assumptions: ['엽산(pteroylglutamic acid) 분자량으로 계산합니다.'],
  },
  {
    id: 'albumin',
    en: 'Albumin',
    ko: '알부민',
    synonyms: ['ALB', 'Alb', '알부민'],
    formulaNote: PROTEIN_NOTE,
    units: [gdL, gL],
  },
  {
    id: 'totalProtein',
    en: 'Total protein',
    ko: '총단백',
    synonyms: ['TP', 'protein', '총단백', '단백'],
    formulaNote: PROTEIN_NOTE,
    units: [gdL, gL],
  },
  {
    id: 'hemoglobin',
    en: 'Hemoglobin',
    ko: '혈색소(헤모글로빈)',
    synonyms: ['Hb', 'Hgb', '헤모글로빈', '혈색소'],
    formulaNote: '헤모글로빈 몰 농도는 단량체/사량체 기준에 따라 4배 달라지는 관례 의존 값이라 제공하지 않습니다.',
    units: [gdL, gL],
  },
  {
    id: 'crp',
    en: 'C-reactive protein',
    ko: 'C-반응성 단백',
    synonyms: ['CRP', 'hsCRP', 'hs-CRP', '씨알피'],
    formulaNote: PROTEIN_NOTE,
    units: [{ ucum: 'mg/L', label: 'mg/L' }, mgdL],
  },
  {
    id: 'ferritin',
    en: 'Ferritin',
    ko: '페리틴',
    synonyms: ['FER', '페리틴'],
    formulaNote: PROTEIN_NOTE,
    units: [{ ucum: 'ng/mL', label: 'ng/mL' }, { ucum: 'ug/L', label: 'µg/L' }],
  },
  {
    id: 'tsh',
    en: 'Thyroid-stimulating hormone',
    ko: '갑상선자극호르몬',
    synonyms: ['TSH', 'thyrotropin', '갑상선'],
    formulaNote: '국제단위(IU)는 표준물질 기준의 임의 단위라 질량·몰 농도로 변환할 수 없습니다.',
    units: [
      { ucum: 'm[IU]/L', label: 'mIU/L' },
      { ucum: 'u[IU]/mL', label: 'µIU/mL' },
    ],
  },
  {
    id: 'alt',
    en: 'Alanine aminotransferase',
    ko: 'ALT(GPT)',
    synonyms: ['ALT', 'GPT', 'SGPT', '알라닌아미노전이효소'],
    units: ENZYME_UNITS,
  },
  {
    id: 'ast',
    en: 'Aspartate aminotransferase',
    ko: 'AST(GOT)',
    synonyms: ['AST', 'GOT', 'SGOT', '아스파르테이트아미노전이효소'],
    units: ENZYME_UNITS,
  },
  {
    id: 'alp',
    en: 'Alkaline phosphatase',
    ko: '알칼리성 인산분해효소',
    synonyms: ['ALP', 'alk phos', '알칼리포스파타제'],
    units: ENZYME_UNITS,
  },
  {
    id: 'ggt',
    en: 'Gamma-glutamyltransferase',
    ko: '감마지티피',
    synonyms: ['GGT', 'γ-GT', 'GGTP', '감마GT', '감마지티피'],
    units: ENZYME_UNITS,
  },
  {
    id: 'wbc',
    en: 'White blood cell count',
    ko: '백혈구 수',
    synonyms: ['WBC', 'leukocyte', '백혈구'],
    units: [
      { ucum: '10*3/uL', label: '×10³/µL' },
      { ucum: '10*9/L', label: '×10⁹/L' },
      { ucum: '/uL', label: '/µL' },
    ],
  },
  {
    id: 'platelet',
    en: 'Platelet count',
    ko: '혈소판 수',
    synonyms: ['PLT', 'platelets', '혈소판'],
    units: [
      { ucum: '10*3/uL', label: '×10³/µL' },
      { ucum: '10*9/L', label: '×10⁹/L' },
    ],
  },
  {
    id: 'hba1c',
    en: 'Hemoglobin A1c',
    ko: '당화혈색소',
    synonyms: ['HbA1c', 'A1c', 'glycated hemoglobin', '당화혈색소', '당화'],
    special: 'hba1c',
    units: [
      { ucum: '%', label: '% (NGSP/DCCT)' },
      { ucum: 'mmol/mol', label: 'mmol/mol (IFCC)' },
    ],
  },
  {
    id: 'uacr',
    en: 'Urine albumin-to-creatinine ratio (uACR)',
    ko: '소변 알부민/크레아티닌 비',
    synonyms: ['ACR', 'UACR', 'albuminuria', 'microalbumin', '미세알부민', '알부민뇨'],
    special: 'urineRatio',
    units: [
      { ucum: 'mg/g', label: 'mg/g (creatinine)' },
      { ucum: 'mg/mmol', label: 'mg/mmol (creatinine)' },
    ],
  },
  {
    id: 'upcr',
    en: 'Urine protein-to-creatinine ratio (uPCR)',
    ko: '소변 단백/크레아티닌 비',
    synonyms: ['PCR', 'UPCR', 'proteinuria', '단백뇨'],
    special: 'urineRatio',
    units: [
      { ucum: 'mg/g', label: 'mg/g (creatinine)' },
      { ucum: 'mg/mmol', label: 'mg/mmol (creatinine)' },
      { ucum: 'g/g', label: 'g/g (creatinine)' },
    ],
  },
];

export const ANALYTE_BY_ID: Record<string, Analyte> = Object.fromEntries(
  ANALYTES.map((a) => [a.id, a]),
);

export const CREATININE_FORMULA = 'C4H7N3O';
