// 교차 검증 전용 자료. 앱 번들에 포함하지 않는다 (src/ 밖, 앱 코드에서 import 금지).

export interface RangePair {
  analyteId: string;
  conventional: { unit: string; low?: number; high: number };
  si: { unit: string; low?: number; high: number };
}

/**
 * NBME Laboratory Reference Values (https://www.nbme.org/laboratory-values/)
 * 같은 항목의 관용 단위 구간과 SI 구간을 짝지어 둔다 (둘 다 NBME 가 반올림한 값).
 * TODO(verify): 개발 환경에서 NBME PDF 를 직접 열지 못하고 검색 발췌로만 값을 확인했다.
 */
export const NBME: RangePair[] = [
  { analyteId: 'glucose', conventional: { unit: 'mg/dL', low: 70, high: 100 }, si: { unit: 'mmol/L', low: 3.8, high: 5.6 } },
  { analyteId: 'creatinine', conventional: { unit: 'mg/dL', low: 0.6, high: 1.2 }, si: { unit: 'umol/L', low: 53, high: 106 } },
  { analyteId: 'calcium', conventional: { unit: 'mg/dL', low: 8.4, high: 10.2 }, si: { unit: 'mmol/L', low: 2.1, high: 2.6 } },
  { analyteId: 'cholesterol', conventional: { unit: 'mg/dL', high: 200 }, si: { unit: 'mmol/L', high: 5.2 } },
];

export interface FactorRow {
  analyteId: string;
  from: string;
  to: string;
  factor: number;
}

/**
 * Labcorp SI Unit Conversion Table.
 * TODO(verify): Labcorp 표를 열람하지 못해 비워 둠 (labcorp.com 접속 차단, 검색 결과에 표 본문 없음).
 */
export const LABCORP: FactorRow[] = [];

/**
 * CMEinfo Laboratory Units Conversion Table PDF
 * (https://www.cmeinfo.com/wp-content/uploads/2021/09/0.-Laboratory-Units-Conversion-Table.pdf)
 * TODO(verify): PDF 를 내려받지 못해 비워 둠.
 */
export const CMEINFO: FactorRow[] = [];
