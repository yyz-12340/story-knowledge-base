import { useEffect, useMemo, useRef, useState } from 'react';

const fmt = (n) => (n >= 10000 ? (n / 10000).toFixed(1) + '万' : n.toLocaleString());
const PAGE_SIZE = 30;

export default function Browse({ data }) {
  const authors = useMemo(() => [...new Set(data.map((a) => a.author))], [data]);
  const categories = useMemo(() => [...new Set(data.map((a) => a.category))], [data]);

  const [selAuthors, setSelAuthors] = useState(authors);
  const [selCats, setSelCats] = useState([]);
  const [minVotes, setMinVotes] = useState(0);
  const [sortBy, setSortBy] = useState('votes');
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [reading, setReading] = useState(null); // 正在阅读的回答
  const [contentMap, setContentMap] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const timerRef = useRef(null);

  // 搜索防抖
  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  useEffect(() => setLimit(PAGE_SIZE), [selAuthors, selCats, minVotes, sortBy, debounced]);

  const results = useMemo(() => {
    const q = debounced.toLowerCase();
    let list = data.filter((a) => {
      if (selAuthors.length && !selAuthors.includes(a.author)) return false;
      if (selCats.length && !selCats.includes(a.category)) return false;
      if (a.votes < minVotes) return false;
      if (q && !(a.question.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q)))
        return false;
      return true;
    });
    const key =
      sortBy === 'votes' ? (x) => -x.votes
      : sortBy === 'comments' ? (x) => -x.comments
      : sortBy === 'date' ? (x) => -x.date.localeCompare('') : (x) => 0;
    if (sortBy === 'date') list.sort((x, y) => y.date.localeCompare(x.date));
    else list.sort((x, y) => (key(x) - key(y)));
    return list;
  }, [data, selAuthors, selCats, minVotes, sortBy, debounced]);

  const toggle = (list, setList, v) =>
    setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  // 打开阅读器：懒加载全文映射
  const openReader = async (item) => {
    setReading(item);
    if (!contentMap) {
      try {
        const res = await fetch('data/stories-content.json');
        setContentMap(await res.json());
      } catch {
        setContentMap({});
      }
    }
  };

  const fullText = reading && contentMap ? contentMap[reading.id] : '';
  const paragraphs = (fullText || '').split(/\n{2,}/).filter((p) => p.trim());

  return (
    <div className="browse-layout">
      {/* 筛选面板 */}
      <aside className="filter-panel">
        <div className="filter-group">
          <span>作者</span>
          <div className="chip-row">
            {authors.map((au) => (
              <button
                key={au}
                className={'chip' + (selAuthors.includes(au) ? ' on' : '')}
                onClick={() => toggle(selAuthors, setSelAuthors, au)}
              >
                {au}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <span>分类</span>
          <div className="chip-row">
            {categories.map((c) => (
              <button
                key={c}
                className={'chip' + (selCats.includes(c) ? ' on' : '')}
                onClick={() => toggle(selCats, setSelCats, c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <span>最低赞同</span>
          <div className="range-row">
            <input
              type="range"
              min={0}
              max={1000}
              step={50}
              value={minVotes}
              onChange={(e) => setMinVotes(+e.target.value)}
            />
            <span className="range-value">{minVotes >= 1000 ? '1000+' : minVotes} 赞</span>
          </div>
        </div>
        <div className="filter-group">
          <span>排序</span>
          <select
            className="select-input"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="votes">按赞同数</option>
            <option value="comments">按评论数</option>
            <option value="date">按时间</option>
          </select>
        </div>
      </aside>

      {/* 结果区 */}
      <section>
        <div className="result-meta">
          <input
            className="search-input"
            style={{ flex: 1, minWidth: 0 }}
            placeholder="搜索问题或内容…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            className="chip"
            onClick={() => setPanelOpen(!panelOpen)}
            style={{ display: 'none' }}
          >
            筛选
          </button>
        </div>
        <div className="result-meta">
          <span>共 {results.length} 篇</span>
          {selAuthors.length < authors.length && <span>作者已筛选</span>}
          {selCats.length > 0 && <span>分类已筛选</span>}
        </div>

        {results.length === 0 && (
          <div className="state-box">
            <div className="big">没有找到匹配的回答</div>
            <p>试试放宽筛选条件或换一个关键词。</p>
          </div>
        )}

        {results.slice(0, limit).map((a) => (
          <button key={a.id} className="answer-card" onClick={() => openReader(a)}>
            <h4>{a.question}</h4>
            <p className="excerpt">{a.excerpt || '（无摘要）'}</p>
            <div className="result-meta" style={{ margin: 'var(--space-3) 0 0' }}>
              <span className="tag author">{a.author}</span>
              <span className="tag">{a.category}</span>
              <span>👍 {fmt(a.votes)}</span>
              <span>💬 {fmt(a.comments)}</span>
              <span>⭐ {fmt(a.favorites)}</span>
              <span>{a.date}</span>
            </div>
          </button>
        ))}

        {results.length > limit && (
          <button className="load-more" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
            加载更多（{results.length - limit} 篇）
          </button>
        )}
      </section>

      {/* 阅读器 */}
      {reading && (
        <div className="reader-overlay" onClick={(e) => e.target === e.currentTarget && setReading(null)}>
          <button className="reader-close" onClick={() => setReading(null)} aria-label="关闭">
            ×
          </button>
          <article className="reader">
            <h1>{reading.question}</h1>
            <div className="result-meta">
              <span className="tag author">{reading.author}</span>
              <span className="tag">{reading.category}</span>
              <span>👍 {fmt(reading.votes)} 赞</span>
              <span>💬 {fmt(reading.comments)} 评论</span>
              <span>⭐ {fmt(reading.favorites)} 收藏</span>
              <span>{reading.date}</span>
            </div>
            <div className="reader-body">
              {!contentMap ? (
                <p className="state-box">正在加载全文…</p>
              ) : paragraphs.length === 0 ? (
                <p>（该回答暂无可用全文）</p>
              ) : (
                paragraphs.map((p, i) => (
                  <p key={i} className={i === 0 ? 'lead' : ''}>
                    {p}
                  </p>
                ))
              )}
            </div>
            {reading.url && (
              <p className="reader-origin">
                原文链接：{' '}
                <a href={reading.url} target="_blank" rel="noreferrer">
                  {reading.url}
                </a>
              </p>
            )}
          </article>
        </div>
      )}
    </div>
  );
}
