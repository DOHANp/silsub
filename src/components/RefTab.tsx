import { useState } from 'react';
import { ANALYTE_BY_ID } from '../data/analytes';
import { REFERENCE_INTERVALS, RI_ANALYTE_IDS, RI_GAPS, type ReferenceInterval, type Sex, type Specimen } from '../data/referenceIntervals';
import { SOURCES } from '../data/sources';
import { convert, findUnit, fmt, unitKey } from '../lib/convert';
import { judge, lookupInterval } from '../lib/refInterval';
import Evidence from './Evidence';
import UnitSelect, { resolveUnit } from './UnitSelect';

const SPECIMEN_LABEL: Record<Specimen, string> = { serum: '혈청 (serum)', plasma: '혈장 (plasma)' };
const SEX_LABEL: Record<Sex | 'any', string> = { M: '남', F: '여', any: '공통' };
const FLAG_LABEL = { low: 'LOW (낮음)', normal: 'NORMAL (구간 내)', high: 'HIGH (높음)' } as const;

function describe(r: ReferenceInterval) {
  return `${SEX_LABEL[r.sex]} · ${r.ageMin}세 이상 ${r.ageMax}세 미만 · ${r.specimens.map((s) => SPECIMEN_LABEL[s]).join(', ')} · ${r.low}–${r.high} ${r.unitLabel}`;
}

export default function RefTab() {
  const [analyteId, setAnalyteId] = useState(RI_ANALYTE_IDS[0]);
  const [ageText, setAgeText] = useState('40');
  const [sex, setSex] = useState<Sex>('M');
  const [specimen, setSpecimen] = useState<Specimen>('serum');
  const [valueText, setValueText] = useState('');
  const analyte = ANALYTE_BY_ID[analyteId];
  const [unitKeySel, setUnitKeySel] = useState(unitKey(analyte.units[0]));

  const age = ageText.trim() === '' ? NaN : Number(ageText);
  const lookup = lookupInterval({ analyteId, ageYears: age, sex, specimen });

  const onAnalyte = (id: string) => {
    setAnalyteId(id);
    const ri = REFERENCE_INTERVALS.find((r) => r.analyteId === id)!;
    setUnitKeySel(ri.unit);
    setValueText('');
  };

  let judgement: JSX.Element | null = null;
  if (lookup.found && valueText.trim() !== '') {
    const ri = lookup.interval;
    const v = Number(valueText);
    const from = resolveUnit(analyte, unitKeySel, '');
    const to = findUnit(analyte, ri.unit);
    const conv = convert(analyte, v, from, to);
    if (!conv.ok) {
      judgement = <Evidence result={conv} />;
    } else {
      const flag = judge(conv.value, ri);
      judgement = (
        <div className={`flag ${flag}`}>
          <div className="big">{FLAG_LABEL[flag]}</div>
          <div>
            입력 {fmt(v)} {from.label}
            {unitKey(from) !== ri.unit && ` = ${fmt(conv.value)} ${ri.unitLabel}`} · 구간 {ri.low}–{ri.high} {ri.unitLabel}
          </div>
          {unitKey(from) !== ri.unit && (
            <details>
              <summary>단위 변환 근거</summary>
              <Evidence result={conv} />
            </details>
          )}
        </div>
      );
    }
  }

  return (
    <div className="panel">
      <div className="row">
        <label className="field">
          <span>분석물</span>
          <select value={analyteId} onChange={(e) => onAnalyte(e.target.value)}>
            {RI_ANALYTE_IDS.map((id) => (
              <option key={id} value={id}>
                {ANALYTE_BY_ID[id].ko} ({ANALYTE_BY_ID[id].en})
              </option>
            ))}
          </select>
        </label>
        <label className="field narrow">
          <span>나이 (세)</span>
          <input inputMode="decimal" value={ageText} onChange={(e) => setAgeText(e.target.value)} />
        </label>
        <label className="field narrow">
          <span>성별</span>
          <select value={sex} onChange={(e) => setSex(e.target.value as Sex)}>
            <option value="M">남</option>
            <option value="F">여</option>
          </select>
        </label>
        <label className="field">
          <span>검체</span>
          <select value={specimen} onChange={(e) => setSpecimen(e.target.value as Specimen)}>
            <option value="serum">{SPECIMEN_LABEL.serum}</option>
            <option value="plasma">{SPECIMEN_LABEL.plasma}</option>
          </select>
        </label>
      </div>

      {lookup.found ? (
        <section className="interval">
          <div className="big">
            {lookup.interval.low} – {lookup.interval.high} <span className="unit">{lookup.interval.unitLabel}</span>
          </div>
          <dl>
            <dt>출처</dt>
            <dd>
              <a href={SOURCES.rcpaTable6.url} target="_blank" rel="noreferrer">
                {SOURCES.rcpaTable6.label}
              </a>
              {lookup.interval.loinc && <> · LN-RCPA {lookup.interval.loinc}</>}
            </dd>
            <dt>검체</dt>
            <dd>{lookup.interval.specimens.map((s) => SPECIMEN_LABEL[s]).join(', ')}</dd>
            <dt>나이 구간</dt>
            <dd>
              {lookup.interval.ageMin}세 이상 {lookup.interval.ageMax}세 미만 · {SEX_LABEL[lookup.interval.sex]}
            </dd>
            {lookup.interval.notes?.map((n, i) => (
              <dd key={i} className="muted">
                {n}
              </dd>
            ))}
            {lookup.interval.verify && <dd className="todo">{lookup.interval.verify}</dd>}
          </dl>

          <div className="row">
            <label className="field">
              <span>결과 값</span>
              <input inputMode="decimal" value={valueText} onChange={(e) => setValueText(e.target.value)} placeholder="판정할 값" />
            </label>
            <UnitSelect analyte={analyte} label="단위" value={unitKeySel} custom="" onChange={setUnitKeySel} onCustom={() => {}} allowCustom={false} />
          </div>
          {judgement}
        </section>
      ) : (
        <section className="interval none">
          <div className="big">공표 구간 없음</div>
          <p>{lookup.reason}</p>
          {Number.isFinite(age) && age < 18 && (
            <p>
              소아·청소년 참고구간은{' '}
              <a href={SOURCES.caliper.url} target="_blank" rel="noreferrer">
                CALIPER
              </a>{' '}
              (Canadian Laboratory Initiative on Paediatric Reference Intervals) 데이터베이스를 확인하세요. 이 앱은 CALIPER 수치를 내장하지 않습니다.
            </p>
          )}
          {lookup.available.length > 0 && (
            <>
              <p className="muted">이 분석물의 공표된 구간 (참고용, 다른 조건에 적용하지 마세요):</p>
              <ul>
                {lookup.available.map((r, i) => (
                  <li key={i}>{describe(r)}</li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      <details className="gaps">
        <summary>수록하지 못한 참고구간과 이유</summary>
        <ul>
          {RI_GAPS.map((g) => (
            <li key={g.name}>
              <strong>{g.name}</strong>: {g.reason}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
