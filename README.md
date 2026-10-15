# silsub — 임상검사 단위 변환 · 참고구간

**사이트:** https://dohanp.github.io/silsub/

React + TypeScript + Vite 정적 사이트. GitHub Actions 로 빌드·테스트 후 GitHub Pages 에 배포합니다.

> 교육·참고용입니다. 진료 판단은 해당 검사실 보고서의 단위와 참고구간을 따르세요.

## 기능

### 1. 변환
- 분석물 검색(영문·한글·동의어) → 값, 원본 단위, 대상 단위 입력 (목록에 없는 단위는 UCUM 코드로 직접 입력)
- 결과를 크게 표시하고 바로 아래에 **계산 근거**(방법, 계수, 수식, 과정, 가정, 출처 링크)
- 양방향 스왑, 결과 복사
- 근거 없는 변환(예: mg/dL → U/L, 알부민 g/dL → mmol/L, IU → 질량)은 이유와 함께 거부

### 2. 참고구간
- 분석물 + 나이 + 성별 + 검체 → 공표된 구간만 그대로 표시 (없는 나이 구간은 외삽하지 않음)
- 결과 값을 넣으면 low / normal / high 판정 (다른 단위로 넣으면 변환 엔진으로 환산 후 판정, 근거 표시)
- 출처·검체·나이 구간 표시, 18세 미만은 CALIPER 안내

## 데이터 출처와 역할

| 역할 | 출처 | 앱 포함 |
|---|---|---|
| 단위 변환 엔진 | UCUM / [`@lhncbc/ucum-lhc`](https://lhncbc.github.io/ucum-lhc/) — 차원 검사, 스케일 변환, `molecularWeight` 옵션으로 질량↔몰 | O |
| 분자량 | [IUPAC CIAAW](https://ciaaw.org/atomic-weights.htm) 원자량으로 화학식에서 계산 (`src/data/atomicWeights.ts`, `src/lib/formula.ts`) | O |
| 당량(mEq) | 이온 전하(`charge`) 로 계산 | O |
| HbA1c NGSP↔IFCC | [NGSP master equation](https://ngsp.org/ifcc.asp): NGSP = 0.09148 × IFCC + 2.152 | O |
| uACR·uPCR mg/g↔mg/mmol | KDIGO 2024, 크레아티닌 분자량으로 분모 환산 | O |
| BUN↔요소 | 요소 1 mol 당 N2 질량 | O |
| 중성지방 | 트리올레인(C57H104O6) 가정 | O |
| 참고구간 | [RCPA Table 6](https://www.rcpa.edu.au/Manuals/RCPA-Manual/General-Information/IG/Table-6-Harmonised-reference-intervals-for-chem) (성인), 소아는 [CALIPER](https://caliperproject.ca/) 안내 | O |
| 교차 검증 | NBME Laboratory Reference Values, Labcorp SI 변환표, CMEinfo 변환표 | **X** (`tests/fixtures` 에서만) |

변환 계수는 코드에 적혀 있지 않습니다. 화학식, 이온 전하, UCUM 단위 코드만 정의하고 계수는 실행할 때 계산합니다.

## 확보하지 못한 자료 / TODO(verify)

개발 환경에서 rcpa.edu.au, ngsp.org, ciaaw.org, kdigo.org, labcorp.com, caliperproject.ca 직접 접속이 차단되어 아래 항목은 웹 검색 발췌로만 확인했거나 확보하지 못했습니다.

| 항목 | 상태 | 이유 |
|---|---|---|
| RCPA Table 6 수록 값 (Na, K, Cl, HCO3, Ca, PO4, Mg, ALP, 크레아티닌, 빌리루빈) | 수록, **TODO(verify)** | 원문 대신 검색 발췌로 확인 |
| 크레아티닌 성인 구간 하한 나이 (18 vs 19세) | 19세로 수록, **TODO(verify)** | 발췌마다 다름 |
| ALT | 미수록 | 18세 이상 구간이 두 줄(5–40, 5–35 U/L)로 나오나 구분 기준(성별 등)을 확인하지 못함 |
| AST, GGT, LD, Lipase, 총단백, 알부민, 요소 참고구간 | 미수록 | 발췌에 값 없음 |
| 혈장 칼륨 구간 | 미수록 | 혈청 구간만 확인 |
| 18세 미만(RCPA 소아, CALIPER) 수치 | 미수록 | 원문 미확보 — CALIPER 링크로 안내만 |
| IUPAC 원자량 | 수록, **TODO(verify)** | ciaaw.org 원문과 직접 대조하지 못함 |
| Labcorp SI 변환표 | 테스트 대조 데이터 비어 있음 (`it.todo`) | 표 본문을 열람하지 못함 |
| CMEinfo 변환표 PDF | 테스트 대조 데이터 비어 있음 (`it.todo`) | PDF 다운로드 불가 |
| NBME 값 (glucose, creatinine, calcium, cholesterol) | 테스트 대조, **TODO(verify)** | 검색 발췌로 확인 |

## 개발

```bash
npm ci
npm run dev     # 로컬 개발 서버
npm test        # Vitest (변환 로직, 검색, 참고구간, 교차 검증)
npm run build   # dist/
```

배포: `main` 에 push 하면 `.github/workflows/deploy.yml` 이 테스트 → 빌드 → Pages 배포를 합니다.
저장소 Settings → Pages → Source 가 **GitHub Actions** 여야 합니다.
