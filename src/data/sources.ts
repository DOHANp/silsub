// 앱이 인용하는 출처. 교차 검증 전용 자료(Labcorp, CMEinfo, NBME)는 여기 넣지 않고 tests/fixtures 에만 둔다.
export interface Source {
  id: string;
  label: string;
  url: string;
  note?: string;
}

export const SOURCES = {
  ucum: {
    id: 'ucum',
    label: 'UCUM (Unified Code for Units of Measure) · @lhncbc/ucum-lhc',
    url: 'https://ucum.org/ucum',
  },
  ucumLhc: {
    id: 'ucumLhc',
    label: 'NLM LHC ucum-lhc 라이브러리',
    url: 'https://lhncbc.github.io/ucum-lhc/',
  },
  iupac: {
    id: 'iupac',
    label: 'IUPAC CIAAW 표준 원자량 (abridged, 2021)',
    url: 'https://ciaaw.org/atomic-weights.htm',
    // TODO(verify): 개발 환경에서 ciaaw.org 접속이 차단되어 원문 대조를 하지 못함.
    note: '원자량 값은 원문과 직접 대조하지 못함 — TODO(verify)',
  },
  ngsp: {
    id: 'ngsp',
    label: 'NGSP — IFCC Standardization of HbA1c (master equation)',
    url: 'https://ngsp.org/ifcc.asp',
  },
  kdigo2024: {
    id: 'kdigo2024',
    label: 'KDIGO 2024 Clinical Practice Guideline for CKD',
    url: 'https://kdigo.org/guidelines/ckd-evaluation-and-management/',
  },
  rcpaTable6: {
    id: 'rcpaTable6',
    label: 'RCPA Manual — Table 6: Harmonised reference intervals for chemical pathology',
    url: 'https://www.rcpa.edu.au/Manuals/RCPA-Manual/General-Information/IG/Table-6-Harmonised-reference-intervals-for-chem',
  },
  caliper: {
    id: 'caliper',
    label: 'CALIPER (Canadian Laboratory Initiative on Paediatric Reference Intervals)',
    url: 'https://caliperproject.ca/',
  },
} satisfies Record<string, Source>;

export type SourceId = keyof typeof SOURCES;
