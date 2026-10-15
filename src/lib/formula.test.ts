import { molarMass, parseFormula } from './formula';

describe('formula / molar mass (IUPAC 원자량으로 계산)', () => {
  it('parses formulas', () => {
    expect(parseFormula('C6H12O6')).toEqual({ C: 6, H: 12, O: 6 });
    expect(parseFormula('Ca(OH)2')).toEqual({ Ca: 1, O: 2, H: 2 });
    expect(parseFormula('C63H88CoN14O14P')).toMatchObject({ Co: 1, N: 14, P: 1 });
  });
  it('rejects unknown elements and garbage', () => {
    expect(() => parseFormula('Xx2')).toThrow();
    expect(() => parseFormula('c6h12')).toThrow();
    expect(() => parseFormula('')).toThrow();
  });
  it('computes molar masses', () => {
    expect(molarMass('C6H12O6')).toBeCloseTo(180.156, 3);
    expect(molarMass('C4H7N3O')).toBeCloseTo(113.12, 2);
    expect(molarMass('CH4N2O')).toBeCloseTo(60.056, 3);
    expect(molarMass('C27H46O')).toBeCloseTo(386.66, 1);
    expect(molarMass('C33H36N4O6')).toBeCloseTo(584.67, 1);
  });
});
