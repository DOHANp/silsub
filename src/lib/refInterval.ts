import { REFERENCE_INTERVALS, type ReferenceInterval, type Sex, type Specimen } from '../data/referenceIntervals';

export interface RiQuery {
  analyteId: string;
  ageYears: number;
  sex: Sex;
  specimen: Specimen;
}

export type RiLookup =
  | { found: true; interval: ReferenceInterval }
  | { found: false; reason: string; available: ReferenceInterval[] };

export function lookupInterval(q: RiQuery, table: ReferenceInterval[] = REFERENCE_INTERVALS): RiLookup {
  const forAnalyte = table.filter((r) => r.analyteId === q.analyteId);
  if (forAnalyte.length === 0) return { found: false, reason: '이 분석물의 공표 구간을 확보하지 못했습니다.', available: [] };
  if (!Number.isFinite(q.ageYears) || q.ageYears < 0) {
    return { found: false, reason: '나이를 올바르게 입력하세요.', available: forAnalyte };
  }
  const bySex = forAnalyte.filter((r) => r.sex === 'any' || r.sex === q.sex);
  const byAge = bySex.filter((r) => q.ageYears >= r.ageMin && q.ageYears < r.ageMax);
  if (byAge.length === 0) {
    return {
      found: false,
      reason: `${q.ageYears}세에 해당하는 공표 구간이 없습니다. 인접 나이 구간으로 외삽하지 않습니다.`,
      available: forAnalyte,
    };
  }
  const bySpecimen = byAge.filter((r) => r.specimens.includes(q.specimen));
  if (bySpecimen.length === 0) {
    return {
      found: false,
      reason: `${q.specimen === 'serum' ? '혈청' : '혈장'} 검체에 대한 공표 구간이 없습니다.`,
      available: forAnalyte,
    };
  }
  return { found: true, interval: bySpecimen[0] };
}

export type Flag = 'low' | 'normal' | 'high';

/** 경계값은 구간 안(normal)으로 본다. */
export function judge(value: number, ri: Pick<ReferenceInterval, 'low' | 'high'>): Flag {
  if (value < ri.low) return 'low';
  if (value > ri.high) return 'high';
  return 'normal';
}
