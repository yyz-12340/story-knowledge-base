import { useMemo, useState } from 'react';
import EChart from '../components/EChart.jsx';

const AUTHOR_COLORS = {
  小约翰: '#8a4b3a',
  林先生: '#3a5f7a',
  唯唯诺诺的梦: '#6a8a3a',
  政经鲁社长: '#7a4a8a',
};
const CATEGORY_COLORS = [
  '#b3402a', '#c0763a', '#a37a2a', '#6a8a3a', '#3a7a6a',
  '#3a5f7a', '#4a4a8a', '#7a4a7a', '#8a5a5a', '#8a7a3a',
  '#5a7a8a', '#8a4a6a',
];
const fmt = (n) => (n >= 10000 ? (n / 10000).toFixed(1) + '万' : n.toLocaleString());

export default function Graph({ data }) {
  const authors = useMemo(() => [...new Set(data.map((a) => a.author))], [data]);
  const [focusAuthor, setFocusAuthor] = useState('全部');
  const [focusCat, setFocusCat] = useState('全部');

  const option = useMemo(() => {
    const filtered = data.filter(
      (a) =>
        (focusAuthor === '全部' || a.author === focusAuthor) &&
        (focusCat === '全部' || a.category === focusCat)
    );
    if (filtered.length === 0) return {};

    // 作者-分类 产出统计（用于作者↔分类的粗边）
    const authorCatCount = {};
    for (const a of filtered) {
      const k = a.author + '|' + a.category;
      authorCatCount[k] = (authorCatCount[k] || 0) + 1;
    }

    // 内容节点：知乎按赞数 Top 30 + 文字稿按字数 Top 12
    const zhihuTop = filtered
      .filter((a) => a.source === 'zhihu')
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 30);
    const ytTop = filtered
      .filter((a) => a.source === 'youtube')
      .sort((a, b) => b.contentLen - a.contentLen)
      .slice(0, 12);
    const items = [...zhihuTop, ...ytTop];

    const nodes = [];
    const edges = [];
    const catIndex = {};
    const authorIndex = {};

    // 作者节点
    const showAuthors = focusAuthor === '全部' ? authors : [focusAuthor];
    for (const au of showAuthors) {
      authorIndex[au] = nodes.length;
      nodes.push({
        id: 'author-' + au,
        name: au,
        symbolSize: 52,
        category: 0,
        itemStyle: { color: AUTHOR_COLORS[au] || '#666' },
        label: { fontSize: 14, fontWeight: 'bold' },
      });
    }

    // 分类节点（只显示有内容的分类）
    const activeCats = [...new Set(filtered.map((a) => a.category))];
    activeCats.forEach((c, i) => {
      catIndex[c] = nodes.length;
      nodes.push({
        id: 'cat-' + c,
        name: c,
        symbolSize: 26,
        category: 1,
        itemStyle: { color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] },
      });
    });

    // 内容节点
    for (const a of items) {
      const qId = 'q-' + a.id;
      const isYt = a.source === 'youtube';
      const size = isYt
        ? 12 + Math.min(22, Math.sqrt(a.contentLen) * 0.08)
        : 10 + Math.min(26, Math.sqrt(a.votes) * 0.35);
      nodes.push({
        id: qId,
        name: a.question.length > 20 ? a.question.slice(0, 20) + '…' : a.question,
        symbolSize: size,
        category: 2,
        value: isYt ? a.contentLen : a.votes,
        title: `${a.question}\n${a.author} · ${a.category} · ${
          isYt ? `📄${fmt(a.contentLen)}字` : `👍${fmt(a.votes)}赞`
        }`,
        itemStyle: { color: isYt ? '#a89f91' : '#c4bdb0' },
      });
    }

    // 边：内容→作者 / 内容→分类
    const seen = new Set();
    for (const a of items) {
      const qId = 'q-' + a.id;
      const ak = qId + '->' + a.author;
      if (!seen.has(ak)) {
        edges.push({ source: qId, target: 'author-' + a.author, value: 1 });
        seen.add(ak);
      }
      const ck = qId + '->' + a.category;
      if (!seen.has(ck)) {
        edges.push({ source: qId, target: 'cat-' + a.category, value: 1 });
        seen.add(ck);
      }
    }

    // 边：作者→分类（按产出数量加权，体现主题倾向）
    const acSeen = new Set();
    for (const [k, count] of Object.entries(authorCatCount)) {
      const [au, cat] = k.split('|');
      if (!authorIndex[au] || !catIndex[cat]) continue;
      const eKey = au + '|' + cat;
      if (acSeen.has(eKey)) continue;
      acSeen.add(eKey);
      edges.push({
        source: 'author-' + au,
        target: 'cat-' + cat,
        value: Math.min(count, 30),
        lineStyle: { width: Math.min(4, 1 + count * 0.3), opacity: 0.7 },
      });
    }

    return {
      tooltip: {
        formatter: (p) =>
          p.dataType === 'edge'
            ? `${String(p.data.source).replace(/^(author|cat|q)-/, '')} ↔ ${String(p.data.target).replace(/^(author|cat|q)-/, '')}`
            : p.data.title || p.data.name || '',
        confine: true,
      },
      legend: {
        data: ['作者', '分类', '精选内容'],
        bottom: 8,
        textStyle: { fontFamily: 'inherit', color: '#6b665e' },
      },
      series: [
        {
          type: 'graph',
          layout: 'force',
          data: nodes,
          edges,
          roam: true,
          draggable: true,
          categories: [{ name: '作者' }, { name: '分类' }, { name: '精选内容' }],
          force: { repulsion: 380, edgeLength: [50, 130], gravity: 0.06 },
          label: { show: true, fontSize: 11, fontFamily: 'inherit', color: '#2b2a28' },
          edgeSymbol: ['none', 'none'],
          lineStyle: { color: '#9a948a', opacity: 0.3, width: 1 },
          emphasis: { focus: 'adjacency', lineStyle: { width: 2.5, opacity: 0.9 } },
        },
      ],
    };
  }, [data, authors, focusAuthor, focusCat]);

  return (
    <div>
      <div className="graph-toolbar">
        <div className="legend">
          {authors.map((au) => (
            <span key={au}>
              <i className="dot" style={{ background: AUTHOR_COLORS[au] }} />
              {au}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <select
            className="select-input"
            style={{ width: 'auto' }}
            value={focusAuthor}
            onChange={(e) => setFocusAuthor(e.target.value)}
          >
            <option value="全部">全部作者</option>
            {authors.map((au) => (
              <option key={au} value={au}>{au}</option>
            ))}
          </select>
          <select
            className="select-input"
            style={{ width: 'auto' }}
            value={focusCat}
            onChange={(e) => setFocusCat(e.target.value)}
          >
            <option value="全部">全部分类</option>
            {[...new Set(data.map((a) => a.category))].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <p style={{ color: 'var(--color-ink-3)', fontSize: 'var(--text-sm)', margin: '0 0 var(--space-4)' }}>
        节点 = 作者 · 主题分类 · 精选内容（高赞回答 + 长文字稿）；粗边 = 作者在某分类的产出强度。
        拖拽节点调整布局，点击节点高亮其关联。
      </p>
      <EChart option={option} className="graph-box" />
    </div>
  );
}
