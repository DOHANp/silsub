import { useState } from 'react';
import ConvertTab from './components/ConvertTab';
import RefTab from './components/RefTab';

type Tab = 'convert' | 'ref';

export default function App() {
  const [tab, setTab] = useState<Tab>('convert');
  return (
    <div className="app">
      <header>
        <h1>임상검사 단위 변환 · 참고구간</h1>
        <p className="sub">
          변환 계수는 표에서 복사하지 않고 UCUM 과 IUPAC 원자량으로 계산합니다. 교육·참고용이며 진료 판단은 검사실 보고서를 따르세요.
        </p>
        <nav className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'convert'} className={tab === 'convert' ? 'active' : ''} onClick={() => setTab('convert')}>
            변환
          </button>
          <button role="tab" aria-selected={tab === 'ref'} className={tab === 'ref' ? 'active' : ''} onClick={() => setTab('ref')}>
            참고구간
          </button>
        </nav>
      </header>
      <main>{tab === 'convert' ? <ConvertTab /> : <RefTab />}</main>
      <footer>
        <a href="https://github.com/dohanp/silsub">GitHub</a> · 단위 엔진: <a href="https://lhncbc.github.io/ucum-lhc/">ucum-lhc</a>
      </footer>
    </div>
  );
}
