import ucumPkg from '@lhncbc/ucum-lhc';

const utils = ucumPkg.UcumLhcUtils.getInstance();

export function isValidUcum(code: string): boolean {
  if (!code.trim()) return false;
  const r = utils.validateUnitString(code);
  // ucumCode 가 원문과 다르면(자동 교정) 엄격하게 무효 처리한다.
  return r.status === 'valid' && r.ucumCode === code;
}

/** UCUM 스케일 변환. 차원이 다르면 null. */
export function ucumConvert(
  from: string,
  value: number,
  to: string,
  molecularWeight?: number,
): number | null {
  const opts = molecularWeight !== undefined ? { molecularWeight } : undefined;
  const r = utils.convertUnitTo(from, value, to, opts);
  return r.status === 'succeeded' && typeof r.toVal === 'number' ? r.toVal : null;
}

export function ucumMessage(from: string, to: string): string {
  const r = utils.convertUnitTo(from, 1, to);
  return r.msg.join(' ');
}

export type UnitKind =
  | 'massConc'
  | 'amountConc'
  | 'eqConc'
  | 'catalyticConc'
  | 'numberConc'
  | 'massRatio'
  | 'massPerAmount'
  | 'fraction'
  | 'arbitrary'
  | 'unknown';

export const KIND_LABEL: Record<UnitKind, string> = {
  massConc: '질량 농도',
  amountConc: '몰(물질량) 농도',
  eqConc: '당량 농도',
  catalyticConc: '촉매(효소) 활성 농도',
  numberConc: '수 농도(개수/부피)',
  massRatio: '질량비',
  massPerAmount: '질량/물질량 비',
  fraction: '무차원 비율',
  arbitrary: '임의 단위(국제단위 등)',
  unknown: '알 수 없음',
};

/** UCUM 차원 검사로 단위 종류를 판별한다. */
export function classifyUnit(code: string): UnitKind {
  if (!isValidUcum(code)) return 'unknown';
  if (code.includes('[IU]') || code.includes('[iU]') || /\[[^\]]*\]/.test(code)) return 'arbitrary';
  // UCUM 에서 eq 는 mol 과 차원이 같으므로 코드에서 먼저 구분한다.
  if (/(^|[^a-z])[munpf]?eq\//.test(code) || /^[munpf]?eq\b/.test(code)) return 'eqConc';
  if (ucumConvert(code, 1, 'U/L') !== null) return 'catalyticConc';
  if (ucumConvert(code, 1, 'g/L') !== null) return 'massConc';
  if (ucumConvert(code, 1, 'mol/L') !== null) return 'amountConc';
  if (ucumConvert(code, 1, '/L') !== null) return 'numberConc';
  if (ucumConvert(code, 1, 'g/mol') !== null) return 'massPerAmount';
  if (ucumConvert(code, 1, 'g/g') !== null) {
    return /g\/[a-z]*g$/.test(code) ? 'massRatio' : 'fraction';
  }
  return 'unknown';
}
