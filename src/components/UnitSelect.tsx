import type { Analyte, UnitOption } from '../data/analytes';
import { unitKey } from '../lib/convert';

export const CUSTOM = '__custom__';

interface Props {
  analyte: Analyte;
  value: string;
  custom: string;
  onChange: (key: string) => void;
  onCustom: (code: string) => void;
  label: string;
  allowCustom?: boolean;
}

export default function UnitSelect({ analyte, value, custom, onChange, onCustom, label, allowCustom = true }: Props) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {analyte.units.map((u) => (
          <option key={unitKey(u)} value={unitKey(u)}>
            {u.label}
          </option>
        ))}
        {allowCustom && <option value={CUSTOM}>기타 (UCUM 코드 직접 입력)…</option>}
      </select>
      {value === CUSTOM && (
        <input
          className="custom"
          placeholder="예: U/L, ug/mL, mol/L"
          value={custom}
          onChange={(e) => onCustom(e.target.value)}
          spellCheck={false}
        />
      )}
    </label>
  );
}

export function resolveUnit(analyte: Analyte, key: string, custom: string): UnitOption {
  if (key === CUSTOM) return { ucum: custom.trim(), label: custom.trim() || '(빈 단위)' };
  return analyte.units.find((u) => unitKey(u) === key) ?? analyte.units[0];
}
