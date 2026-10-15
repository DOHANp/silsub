// IUPAC CIAAW abridged standard atomic weights (2021).
// 간격(interval)으로 주어지는 원소는 CIAAW 가 제시한 abridged(관용) 값을 사용한다.
// TODO(verify): ciaaw.org 원문과 직접 대조하지 못했다 (개발 환경 네트워크 차단).
export const ATOMIC_WEIGHTS: Record<string, number> = {
  H: 1.008,
  Li: 6.94,
  B: 10.81,
  C: 12.011,
  N: 14.007,
  O: 15.999,
  Na: 22.99,
  Mg: 24.305,
  P: 30.974,
  S: 32.06,
  Cl: 35.45,
  K: 39.098,
  Ca: 40.078,
  Fe: 55.845,
  Co: 58.933,
  Cu: 63.546,
  Zn: 65.38,
  I: 126.9,
};
