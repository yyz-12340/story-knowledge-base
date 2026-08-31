export default function About({ data }) {
  const counts = {};
  for (const a of data) counts[a.author] = (counts[a.author] || 0) + 1;

  const authors = [
    { name: '小约翰', desc: '历史与地缘政治作者，擅长把国际关系讲成通辽段子。' },
    { name: '林先生', desc: '职场与人生洞察者，写尽体制内外的人情世故。' },
    { name: '唯唯诺诺的梦', desc: '热点杂谈写手，评点娱乐圈与社会的奇闻异事。' },
  ];

  return (
    <div className="about-section">
      <h2>关于这个知识库</h2>
      <p>
        这是一个将知乎三位作者的精选回答整理成可搜索、可浏览、可可视化的个人知识库。
        数据来自知乎公开回答，共 {data.length} 篇，已按作者与主题分类，并保留原始赞同、评论、收藏数据。
      </p>
      <h2>收录作者</h2>
      <div className="author-cards">
        {authors.map((au) => (
          <div className="author-card" key={au.name}>
            <h3>{au.name}</h3>
            <p>{au.desc}</p>
            <p className="author-count">收录 {counts[au.name] || 0} 篇</p>
          </div>
        ))}
      </div>
      <h2>数据说明</h2>
      <p>
        回答内容版权归原作者所有，本知识库仅作个人阅读整理之用。
        全部数据离线存储于本地，无任何后端依赖。
      </p>
    </div>
  );
}
