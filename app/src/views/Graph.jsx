import { useMemo, useState } from 'react';
import EChart from '../components/EChart.jsx';

const AUTHOR_COLORS = {
  小约翰: '#8a4b3a',
  林先生: '#3a5f7a',
  唯唯诺诺的梦: '#6a8a3a',
};
const CATEGORY_COLORS = [
  '#b3402a', '#8a4b3a', '#c0763a', '#a37a2a', '#6a8a3a',
  '#3a7a6a', '#3a5f7a', '#4a4a8a', '#7a4a7a', '#8a5a5a',
];

export default function Graph({ data }) {
  const authors = useMemo(() => [...new Set(data.map((a) => a.author))], [data]);
  const [focusAuthor, setFocusAuthor] = useState('全部');

  const option = useMemo(() => {
    const filtered =
      focusAuthor === '全部' ? data : data.filter((a) => a.author === focusAuthor);

    // 节点：作者 + 分类 + Top 40 问题
    const catList = [...new Set(filtered.map((a) => a.category))];
    const topQs = [...filtered]
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 40);

    const nodes = [];
    const edges = [];
    const catIndex = new Map();
    const authorIndex = new Map();

    if (focusAuthor === '全部') {
      authors.forEach((au, i) => {
        authorIndex.set(au, nodes.length);
        nodes.push({
          id: 'author-' + au,
          name: au,
          symbolSize: 46,
          category: 0,
          itemStyle: { color: AUTHOR_COLORS[au] || '#666' },
        });
        void i;
      });
    } else {
      authorIndex.set(focusAuthor, nodes.length);
      nodes.push({
        id: 'author-' + focusAuthor,
        name: focusAuthor,
        symbolSize: 46,
        category: 0,
        itemStyle: { color: AUTHOR_COLORS[focusAuthor] || '#666' },
      });
    }

    catList.forEach((c, i) => {
      catIndex.set(c, nodes.length);
      nodes.push({
        id: 'cat-' + c,
        name: c,
        symbolSize: 30,
        category: 1,
        itemStyle: { color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] },
      });
    });

    const seen = new Set();
    for (const a of filtered) {
      if (!topQs.includes(a)) continue;
      const qId = 'q-' + a.id;
      nodes.push({
        id: qId,
        name: a.question.length > 22 ? a.question.slice(0, 22) + '…' : a.question,
        symbolSize: 10 + Math.min(26, Math.sqrt(a.votes) * 0.35),
        category: 2,
        value: a.votes,
        title: `${a.question}\n👍 ${a.votes} · ${a.author}`,
        itemStyle: { color: '#b5aea0' },
      });
      const auIdx = authorIndex.get(a.author);
      const cIdx = catIndex.get(a.category);
      if (auIdx !== undefined && !seen.has(qId + '-a')) {
        edges.push({ source: qId, target: 'author-' + a.author, value: 1 });
        seen.add(qId + '-a');
      }
      if (cIdx !== undefined && !seen.has(qId + '-c')) {
        edges.push({ source: qId, target: 'cat-' + a.category, value: 1 });
        seen.add(qId + '-c');
      }
    }

    return {
      tooltip: {
        formatter: (p) =>
          p.dataType === 'edge'
            ? `${p.data.source} → ${p.data.target}`
            : p.data.title || p.data.name || '',
      },
      legend: {
        data: ['作者', '分类', '高赞回答'],
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
          categories: [{ name: '作者' }, { name: '分类' }, { name: '高赞回答' }],
          force: { repulsion: 320, edgeLength: [40, 110], gravity: 0.08 },
          label: { show: true, fontSize: 11, fontFamily: 'inherit', color: '#2b2a28' },
          edgeSymbol: ['none', 'none'],
          lineStyle: { color: '#9a948a', opacity: 0.35, width: 1 },
          emphasis: { focus: 'adjacency', lineStyle: { width: 2, opacity: 0.8 } },
        },
      ],
    };
  }, [data, authors, focusAuthor]);

  return (
    <div>
      <div className="graph-toolbar">
        <div className="legend">
          <span><i className="dot" style={{ background: '#8a4b3a' }} />小约翰</span>
          <span><i className="dot" style={{ background: '#3a5f7a' }} />林先生</span>
          <span><i className="dot" style={{ background: '#6a8a3a' }} />唯唯诺诺的梦</span>
        </div>
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
      </div>
      <p style={{ color: 'var(--color-ink-3)', fontSize: 'var(--text-sm)', margin: '0 0 var(--space-4)' }}>
        节点 = 作者 · 分类 · 高赞回答；边 = 回答归属。拖拽节点可调整布局，点击节点高亮其关联。
      </p>
      <EChart option={option} className="graph-box" />
    </div>
  );
}
