# 故事集 · 可视化知识库

将知乎三位作者（小约翰 / 林先生 / 唯唯诺诺的梦）的 1836 篇回答整理成可视化知识库：
概览统计、全文搜索、纸本阅读、知识图谱。**纯静态，无后端**，部署到 GitHub Pages 免费访问。

## 仓库结构

```
story-knowledge-base/
├── app/                  # Web 应用（Vite + React + ECharts）
│   ├── public/data/      # 数据（stories-index.json 元数据 + stories-content.json 全文）
│   └── src/              # 源码
├── stories/              # 故事集 Markdown（可在编辑器里直接阅读/编辑）
│   ├── 小约翰故事集.md
│   ├── 林先生故事集.md
│   └── 唯唯诺诺的梦故事集.md
└── .github/workflows/    # GitHub Pages 自动部署
```

## 本地运行

```bash
cd app
npm install
npm run build          # 构建到 dist/
node serve.js 4173     # 本地预览 http://127.0.0.1:4173
```

## 更新数据

数据由爬虫脚本（`web-access/scrape-zhihu.js`）抓取知乎生成，经
`app/scripts/build-data.js` 合并打标后写入 `app/public/data/`。重新生成：

```bash
cd app
node scripts/build-data.js
npm run build
```

## 部署

推送到 main 分支后，GitHub Actions 自动构建并部署到 Pages。
仓库设置 → Pages → Source 选择 **GitHub Actions**。

站点地址：`https://<用户名>.github.io/story-knowledge-base/`

## 说明

- 回答内容版权归原作者所有，本项目仅作个人阅读整理
- 全部数据离线存储，无任何后端依赖
