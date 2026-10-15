import type { ConversionResult } from '../lib/convert';

export default function Evidence({ result }: { result: ConversionResult }) {
  if (!result.ok) {
    return (
      <section className="evidence reject">
        <h3>변환 거부</h3>
        <p className="reason">{result.reason}</p>
        {result.details.length > 0 && (
          <ul>
            {result.details.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        )}
        <Sources sources={result.sources} />
      </section>
    );
  }
  return (
    <section className="evidence">
      <h3>계산 근거</h3>
      <dl>
        <dt>방법</dt>
        <dd>{result.method}</dd>
        {result.factor !== undefined && (
          <>
            <dt>계수</dt>
            <dd>
              <code>{result.factor.toPrecision(6)}</code>
            </dd>
          </>
        )}
        {result.affine && (
          <>
            <dt>계수</dt>
            <dd>
              기울기 <code>{result.affine.slope.toPrecision(6)}</code>, 절편 <code>{result.affine.intercept.toPrecision(6)}</code>
            </dd>
          </>
        )}
        <dt>수식</dt>
        <dd>
          <code>{result.formula}</code>
        </dd>
        {result.steps.length > 0 && (
          <>
            <dt>과정</dt>
            <dd>
              <ol>
                {result.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </dd>
          </>
        )}
        {result.assumptions.length > 0 && (
          <>
            <dt>가정</dt>
            <dd>
              <ul>
                {result.assumptions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </dd>
          </>
        )}
      </dl>
      <Sources sources={result.sources} />
    </section>
  );
}

function Sources({ sources }: { sources: { id: string; label: string; url: string; note?: string }[] }) {
  if (sources.length === 0) return null;
  return (
    <div className="sources">
      <strong>출처</strong>
      <ul>
        {sources.map((s) => (
          <li key={s.id}>
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.label}
            </a>
            {s.note && <span className="todo"> — {s.note}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
