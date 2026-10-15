import { useMemo, useState } from 'react';
import { ANALYTES, ANALYTE_BY_ID } from '../data/analytes';
import { convert, fmt, unitKey } from '../lib/convert';
import { searchAnalytes } from '../lib/search';
import Evidence from './Evidence';
import UnitSelect, { CUSTOM, resolveUnit } from './UnitSelect';

export default function ConvertTab() {
  const [query, setQuery] = useState('');
  const [analyteId, setAnalyteId] = useState('glucose');
  const analyte = ANALYTE_BY_ID[analyteId];
  const [valueText, setValueText] = useState('100');
  const [fromKey, setFromKey] = useState(unitKey(analyte.units[0]));
  const [toKey, setToKey] = useState(unitKey(analyte.units[1] ?? analyte.units[0]));
  const [fromCustom, setFromCustom] = useState('');
  const [toCustom, setToCustom] = useState('');
  const [copied, setCopied] = useState(false);

  const matches = useMemo(() => searchAnalytes(ANALYTES, query), [query]);

  const pick = (id: string) => {
    const a = ANALYTE_BY_ID[id];
    setAnalyteId(id);
    setFromKey(unitKey(a.units[0]));
    setToKey(unitKey(a.units[1] ?? a.units[0]));
    setFromCustom('');
    setToCustom('');
  };

  const from = resolveUnit(analyte, fromKey, fromCustom);
  const to = resolveUnit(analyte, toKey, toCustom);
  const value = valueText.trim() === '' ? NaN : Number(valueText);
  const result = convert(analyte, value, from, to);

  const swap = () => {
    setFromKey(toKey);
    setToKey(fromKey);
    setFromCustom(toCustom);
    setToCustom(fromCustom);
    if (result.ok) setValueText(fmt(result.value));
  };

  const copy = async () => {
    if (!result.ok) return;
    const text = `${fmt(result.value)} ${to.label}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      window.prompt('복사하세요', text);
    }
  };

  return (
    <div className="panel">
      <div className="search">
        <label className="field">
          <span>분석물 검색 (영문·한글·동의어)</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="예: 혈당, BUN, Cr, 당화혈색소, ACR" />
        </label>
        <ul className="matches">
          {matches.map((a) => (
            <li key={a.id}>
              <button className={a.id === analyteId ? 'chip active' : 'chip'} onClick={() => pick(a.id)}>
                {a.ko} <small>{a.en}</small>
              </button>
            </li>
          ))}
          {matches.length === 0 && <li className="muted">검색 결과 없음</li>}
        </ul>
      </div>

      <h2>
        {analyte.ko} <small>{analyte.en}</small>
      </h2>

      <div className="row">
        <label className="field">
          <span>값</span>
          <input inputMode="decimal" value={valueText} onChange={(e) => setValueText(e.target.value)} />
        </label>
        <UnitSelect analyte={analyte} label="원본 단위" value={fromKey} custom={fromCustom} onChange={setFromKey} onCustom={setFromCustom} />
        <button className="icon" onClick={swap} title="양방향 스왑" aria-label="원본·대상 단위 바꾸기">
          ⇄
        </button>
        <UnitSelect analyte={analyte} label="대상 단위" value={toKey} custom={toCustom} onChange={setToKey} onCustom={setToCustom} />
      </div>

      {result.ok ? (
        <div className="result">
          <div className="big">
            {fmt(result.value)} <span className="unit">{to.label}</span>
          </div>
          <div className="result-actions">
            <span className="muted">
              {Number.isFinite(value) ? fmt(value) : ''} {from.label} →
            </span>
            <button onClick={copy}>{copied ? '복사됨 ✓' : '복사'}</button>
          </div>
        </div>
      ) : (
        <div className="result rejected">
          <div className="big">변환 불가</div>
        </div>
      )}
      <Evidence result={result} />
      {(fromKey === CUSTOM || toKey === CUSTOM) && (
        <p className="muted">직접 입력한 단위는 UCUM 으로 차원을 검사합니다. 질량 단위는 이 분석물의 기본 화학식을 기준으로 합니다.</p>
      )}
    </div>
  );
}
