import { ANALYTES } from '../data/analytes';
import { searchAnalytes } from './search';

const ids = (q: string) => searchAnalytes(ANALYTES, q).map((a) => a.id);

describe('analyte search', () => {
  it('영문', () => expect(ids('glucose')[0]).toBe('glucose'));
  it('한글', () => {
    expect(ids('혈당')[0]).toBe('glucose');
    expect(ids('당화혈색소')[0]).toBe('hba1c');
    expect(ids('크레아티닌')).toContain('creatinine');
  });
  it('동의어/약어', () => {
    expect(ids('BUN')[0]).toBe('urea');
    expect(ids('gpt')[0]).toBe('alt');
    expect(ids('acr')[0]).toBe('uacr');
    expect(ids('hgb')[0]).toBe('hemoglobin');
  });
  it('빈 질의는 전체', () => expect(ids('').length).toBe(ANALYTES.length));
  it('없는 것', () => expect(ids('zzzz')).toEqual([]));
});
