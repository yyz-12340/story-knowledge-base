export default function About({ data }) {
  const zhihu = data.filter((a) => a.source === 'zhihu').length;
  const youtube = data.filter((a) => a.source === 'youtube').length;

  return (
    <div className="about-section">
      <h2>关于</h2>
      <p>
        个人阅读整理的内容库，收录 {data.length} 篇内容，按主题分类，
        可搜索、可浏览、可阅读。纯静态站点，无任何后端依赖，全部数据离线存储。
      </p>
      <h2>内容构成</h2>
      <div className="author-cards">
        <div className="author-card">
          <h3>问答收录</h3>
          <p>精选问答内容，保留原始赞同、评论、收藏数据。</p>
          <p className="author-count">{zhihu} 篇</p>
        </div>
        <div className="author-card">
          <h3>文字稿</h3>
          <p>视频内容文字整理，便于检索与阅读。</p>
          <p className="author-count">{youtube} 篇</p>
        </div>
      </div>
      <h2>说明</h2>
      <p>
        内容版权归原作者所有，本站点仅作个人阅读整理之用。
      </p>
    </div>
  );
}
