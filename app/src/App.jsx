import { useEffect, useState } from 'react';
import Browse from './views/Browse.jsx';
import Graph from './views/Graph.jsx';
import About from './views/About.jsx';

const VIEWS = [
  { id: 'browse', label: '浏览', icon: '☰' },
  { id: 'graph', label: '图谱', icon: '✧' },
  { id: 'about', label: '关于', icon: '❖' },
];

export default function App() {
  const [view, setView] = useState('browse');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('data/stories-index.json')
      .then((r) => {
        if (!r.ok) throw new Error('数据加载失败 (' + r.status + ')');
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <h1 className="app-title">故事集 <em>·</em> 可视化知识库</h1>
          <span className="app-subtitle">小约翰 · 林先生 · 唯唯诺诺的梦 · 政经鲁社长</span>
        </div>
      </header>

      <main className="app-main">
        {error ? (
          <div className="state-box">
            <div className="big">出错了</div>
            <p>{error}</p>
          </div>
        ) : !data ? (
          <div className="state-box">
            <div className="big">正在载入知识库…</div>
            <p>1921 篇内容，请稍候。</p>
          </div>
        ) : (
          <>
            {view === 'browse' && <Browse data={data} />}
            {view === 'graph' && <Graph data={data} />}
            {view === 'about' && <About data={data} />}
          </>
        )}
      </main>

      <nav className="bottom-nav" aria-label="主导航">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            className={view === v.id ? 'active' : ''}
            onClick={() => setView(v.id)}
          >
            <span className="nav-icon" aria-hidden="true">{v.icon}</span>
            {v.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
