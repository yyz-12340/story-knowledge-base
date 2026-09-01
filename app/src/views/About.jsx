export default function About({ data }) {
  const counts = {};
  for (const a of data) counts[a.author] = (counts[a.author] || 0) + 1;
  const zhihu = data.filter((a) => a.source === 'zhihu').length;
  const youtube = data.filter((a) => a.source === 'youtube').length;

  const authors = [
    { name: '小约翰', desc: '历史与地缘政治作者，擅长把国际关系讲成通辽段子。', src: '知乎回答' },
    { name: '林先生', desc: '职场与人生洞察者，写尽体制内外的人情世故。', src: '知乎回答' },
    { name: '唯唯诺诺的梦', desc: '热点杂谈写手，评点娱乐圈与社会的奇闻异事。', src: '知乎回答' },
    { name: '政经鲁社长', desc: 'YouTube 政经评论作者，解读高层人事与财经内幕。', src: '视频文字稿' },
  ];

  return (
    <div className="about-section">
      <h2>关于这个知识库</h2>
      <p>
        这是一个将四位作者的精选内容整理成可搜索、可浏览、可可视化的个人知识库。
        共收录 {data.length} 篇内容：知乎回答 {zhihu} 篇 + YouTube 视频文字稿 {youtube} 篇，
        已按作者与主题分类。知乎回答保留原始赞同、评论、收藏数据；文字稿为 Whisper 转写 + LLM 校对版本。
      </p>
      <h2>收录作者</h2>
      <div className="author-cards">
        {authors.map((au) => (
          <div className="author-card" key={au.name}>
            <h3>{au.name}</h3>
            <p>{au.desc}</p>
            <p className="author-count">
              收录 {counts[au.name] || 0} 篇 · {au.src}
            </p>
          </div>
        ))}
      </div>
      <h2>数据说明</h2>
      <p>
        内容版权归原作者所有，本知识库仅作个人阅读整理之用。
        全部数据离线存储于本地，无任何后端依赖。
      </p>
    </div>
  );
}
