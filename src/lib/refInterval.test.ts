import type { ReferenceInterval } from '../data/referenceIntervals';
import { judge, lookupInterval } from './refInterval';

describe('reference interval lookup', () => {
  it('성인 나트륨', () => {
    const r = lookupInterval({ analyteId: 'sodium', ageYears: 40, sex: 'F', specimen: 'plasma' });
    expect(r.found && [r.interval.low, r.interval.high]).toEqual([135, 145]);
  });
  it('나이 구간 밖은 외삽하지 않음', () => {
    expect(lookupInterval({ analyteId: 'sodium', ageYears: 10, sex: 'M', specimen: 'serum' }).found).toBe(false);
    expect(lookupInterval({ analyteId: 'creatinine', ageYears: 70, sex: 'M', specimen: 'serum' }).found).toBe(false);
    expect(lookupInterval({ analyteId: 'alp', ageYears: 20, sex: 'M', specimen: 'serum' }).found).toBe(false);
  });
  it('나이 경계: 하한 포함, 상한 미포함', () => {
    const p19 = lookupInterval({ analyteId: 'phosphate', ageYears: 19.9, sex: 'M', specimen: 'serum' });
    const p20 = lookupInterval({ analyteId: 'phosphate', ageYears: 20, sex: 'M', specimen: 'serum' });
    expect(p19.found && p19.interval.high).toBe(1.65);
    expect(p20.found && p20.interval.high).toBe(1.5);
  });
  it('성별 구간', () => {
    const m = lookupInterval({ analyteId: 'creatinine', ageYears: 30, sex: 'M', specimen: 'serum' });
    const f = lookupInterval({ analyteId: 'creatinine', ageYears: 30, sex: 'F', specimen: 'serum' });
    expect(m.found && m.interval.high).toBe(110);
    expect(f.found && f.interval.high).toBe(90);
  });
  it('검체 불일치(혈장 칼륨)는 없음', () => {
    expect(lookupInterval({ analyteId: 'potassium', ageYears: 30, sex: 'M', specimen: 'plasma' }).found).toBe(false);
    expect(lookupInterval({ analyteId: 'potassium', ageYears: 30, sex: 'M', specimen: 'serum' }).found).toBe(true);
  });
  it('수록되지 않은 분석물', () => {
    expect(lookupInterval({ analyteId: 'glucose', ageYears: 30, sex: 'M', specimen: 'serum' }).found).toBe(false);
  });
  it('주입한 테이블로도 동작', () => {
    const t: ReferenceInterval[] = [
      { analyteId: 'x', rcpaName: 'X', sex: 'any', ageMin: 0, ageMax: 1, specimens: ['serum'], low: 1, high: 2, unit: 'U/L', unitLabel: 'U/L' },
    ];
    expect(lookupInterval({ analyteId: 'x', ageYears: 0.5, sex: 'M', specimen: 'serum' }, t).found).toBe(true);
  });
});

describe('judge', () => {
  const ri = { low: 135, high: 145 };
  it('low/normal/high, 경계 포함', () => {
    expect(judge(134.9, ri)).toBe('low');
    expect(judge(135, ri)).toBe('normal');
    expect(judge(145, ri)).toBe('normal');
    expect(judge(145.1, ri)).toBe('high');
  });
});
