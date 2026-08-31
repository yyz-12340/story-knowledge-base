import { useMemo } from 'react';
import EChart from '../components/EChart.jsx';

const fmt = (n) => (n >= 10000 ? (n / 10000).toFixed(1) + '万' : n.toLocaleString());

const AUTHOR_COLORS = {
  小约翰: '#8a4b3a',
  林先生: '#3a5f7a',
  唯唯诺诺的梦: '#6a8a3a',
};

export default function Overview({ data }) {
  const stats = useMemo(() => {
    const total = data.length;
    const votes = data.reduce((s, a) => s + a.votes, 0);
    const favs = data.reduce((s, a) => s + a.favorites, 0);
    const authors = [...new Set(data.map((a) => a.author))].length;
    return { total, votes, favs, authors };
  }, [data]);

  const authorChart = useMemo(() => {
    const authors = [...new Set(data.map((a) => a.author))];
    const counts = authors.map((au) => data.filter((a) => a.author === au).length);
    const votes = authors.map((au) =>
      data.filter((a) => a.author === au).reduce((s, a) => s + a.votes, 0)
    );
    return {
      color: authors.map((au) => AUTHOR_COLORS[au] || '#666'),
      tooltip: { trigger: 'axis' },
      legend: { data: ['回答数', '总赞数'], bottom: 0, textStyle: { fontFamily: 'inherit' } },
      grid: { left: 48, right: 16, top: 24, bottom: 48 },
      xAxis: {
        type: 'category',
        data: authors,
        axisLine: { lineStyle: { color: '#9a948a' } },
        axisLabel: { fontFamily: 'inherit' },
      },
      yAxis: [
        { type: 'value', name: '回答数', axisLabel: { fontFamily: 'inherit' } },
        { type: 'value', name: '赞数', axisLabel: { fontFamily: 'inherit' } },
      ],
      series: [
        {
          name: '回答数',
          type: 'bar',
          data: counts,
          barWidth: 36,
          itemStyle: { borderRadius: [3, 3, 0, 0] },
        },
        {
          name: '总赞数',
          type: 'bar',
          yAxisIndex: 1,
          data: votes,
          barWidth: 36,
          itemStyle: { borderRadius: [3, 3, 0, 0], opacity: 0.55 },
        },
      ],
    };
  }, [data]);

  const categoryChart = useMemo(() => {
    const map = {};
    for (const a of data) map[a.category] = (map[a.category] || 0) + 1;
    const items = Object.entries(map)
      .sort((x, y) => y[1] - x[1])
      .map(([name, value]) => ({ name, value }));
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} 篇 ({d}%)' },
      legend: { type: 'scroll', bottom: 0, textStyle: { fontFamily: 'inherit' } },
      series: [
        {
          name: '分类',
          type: 'pie',
          radius: ['42%', '68%'],
          center: ['50%', '44%'],
          itemStyle: { borderColor: '#f7f4ee', borderWidth: 2, borderRadius: 3 },
          label: { show: false },
          data: items,
        },
      ],
    };
  }, [data]);

  const yearChart = useMemo(() => {
    const byYear = {};
    for (const a of data) {
      const y = a.date.slice(0, 4);
      if (!byYear[y]) byYear[y] = {};
      byYear[y][a.author] = (byYear[y][a.author] || 0) + 1;
    }
    const years = Object.keys(byYear).sort();
    const authors = [...new Set(data.map((a) => a.author))];
    const series = authors.map((au) => ({
      name: au,
      type: 'line',
      stack: 'total',
      smooth: true,
      areaStyle: { opacity: 0.35 },
      lineStyle: { width: 2 },
      emphasis: { focus: 'series' },
      data: years.map((y) => byYear[y][au] || 0),
    }));
    return {
      color: authors.map((au) => AUTHOR_COLORS[au] || '#666'),
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0, textStyle: { fontFamily: 'inherit' } },
      grid: { left: 40, right: 16, top: 24, bottom: 48 },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: years,
        axisLine: { lineStyle: { color: '#9a948a' } },
        axisLabel: { fontFamily: 'inherit' },
      },
      yAxis: { type: 'value', axisLabel: { fontFamily: 'inherit' } },
      series,
    };
  }, [data]);

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">收录回答</span>
          <span className="stat-value">{fmt(stats.total)} <small>篇</small></span>
        </div>
        <div className="stat-card">
          <span className="stat-label">累计赞同</span>
          <span className="stat-value">{fmt(stats.votes)} <small>次</small></span>
        </div>
        <div className="stat-card">
          <span className="stat-label">累计收藏</span>
          <span className="stat-value">{fmt(stats.favs)} <small>次</small></span>
        </div>
        <div className="stat-card">
          <span className="stat-label">收录作者</span>
          <span className="stat-value">{stats.authors} <small>位</small></span>
        </div>
      </div>

      <div className="chart-row">
        <div className="chart-card">
          <h3>作者规模</h3>
          <EChart option={authorChart} className="chart-box" />
        </div>
        <div className="chart-card">
          <h3>主题分类</h3>
          <EChart option={categoryChart} className="chart-box" />
        </div>
      </div>

      <div className="chart-card">
        <h3>年度创作轨迹</h3>
        <EChart option={yearChart} className="chart-box" />
      </div>
    </div>
  );
}
