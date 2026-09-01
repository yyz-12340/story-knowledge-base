#!/usr/bin/env node
/**
 * build-data.js — 合并知乎回答 + YouTube 文字稿，生成知识库数据
 * 数据源:
 *   1) 知乎: 产出/知乎故事集/{小约翰,林先生,唯唯诺诺的梦}/*.json   (source=zhihu)
 *   2) YouTube: 产出/政经鲁社长_YouTube文字稿/校对版/政经鲁社长/*.md (source=youtube)
 * 输出: public/data/stories-index.json (元数据) + stories-content.json (全文映射)
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'data');
const WS = '/Users/Admin/Desktop/文件储存地/deepseek harness';

const ZHIHU_SOURCES = [
  { file: 'zhihu_xiaoyuehan.json', author: '小约翰' },
  { file: 'zhihu_lin.json', author: '林先生' },
  { file: 'zhihu_weiwei.json', author: '唯唯诺诺的梦' },
];
const YT_DIR = path.join(WS, '产出', '政经鲁社长_YouTube文字稿', '校对版', '政经鲁社长');

const CATEGORY_RULES = {
  '小约翰': [
    ['中东与伊朗', ['伊朗', '中东', '以色列', '巴勒斯坦', '哈梅内伊', '波斯', '沙特', '也门', '叙利亚', '伊拉克']],
    ['二战与欧洲', ['二战', '德国', '希特勒', '苏联', '俄罗斯', '乌克兰', '北约', '纳粹', '斯大林']],
    ['美国与西方', ['美国', '特朗普', '拜登', '欧洲', '英国', '法国', '日本', '韩国']],
    ['中国历史', ['中国', '汉', '唐', '宋', '明', '清', '三国', '曹魏', '蜀汉', '东汉', '唐朝', '宋朝', '明朝', '清朝']],
    ['经济与科技', ['经济', '科技', '芯片', '半导体', 'AI', '人工智能', '互联网', '金融']],
    ['地缘政治', ['战争', '军事', '地缘', '外交', '制裁', '核武', '导弹']],
  ],
  '林先生': [
    ['职场与创业', ['工作', '创业', '公司', '老板', '领导', '职场', '银行', '体制', '辞职', '跳槽', '升职', '工资', '收入', '副业']],
    ['人际关系', ['朋友', '社交', '同学', '聚会', '人脉', '关系', '同事', '相处', '亲戚', '家族']],
    ['人生感悟', ['人生', '成长', '努力', '奋斗', '年轻人', '中年', '选择', '命运', '读书', '学习', '认知']],
    ['财富与投资', ['钱', '财富', '投资', '理财', '赚钱', '买房', '资产', '经济', '金融', '股市']],
    ['婚姻家庭', ['婚姻', '结婚', '离婚', '家庭', '孩子', '教育', '父母', '婆媳', '恋爱', '感情', '爱情']],
    ['社会观察', ['社会', '阶层', '阶级', '贫富', '穷人', '富人', '内卷', '躺平', '焦虑']],
  ],
  '唯唯诺诺的梦': [
    ['娱乐圈', ['明星', '演员', '导演', '娱乐圈', '综艺', '电影', '影视', '偶像', '饭圈', '网红', '景甜', '孙宇晨']],
    ['体育竞技', ['体育', '奥运', '足球', '篮球', 'NBA', '世界杯', '运动员', '冠军', '刘翔']],
    ['社会热点', ['如何看待', '如何评价', '热点', '事件', '新闻', '热搜', '争议']],
    ['财富阶层', ['有钱', '富豪', '老板', '身价', '财富', '阶层', '穷人', '富人', '收入', '年薪', '亿']],
    ['两性情感', ['恋爱', '婚姻', '男女', '分手', '出轨', '相亲', '对象', '爱情']],
    ['职场商业', ['公司', '创业', '工作', '老板', '员工', '职场', '商业', '企业', '行业', '市场']],
  ],
  '政经鲁社长': [
    ['政治局与人事', ['政治局', '常委', '委员', '中央', '书记', '部长', '人事', '接班', '选举', '二十一大', '二十大', '中办', '组织部', '主席', '升任', '上位', '候选人']],
    ['财经与商业', ['财经', '经济', '金融', '银行', '公司', '企业', '商业', '腾讯', '阿里', '马云', '马化腾', '许家印', '王健林', '恒大', '万达', '万科', '股市', '基金', '投资', '海航', '富豪', '身价']],
    ['反腐与司法', ['反腐', '落马', '调查', '纪委', '腐败', '案件', '处分', '起诉', '刑', '狱']],
    ['军队与国防', ['军队', '军委', '将军', '军权', '部队', '阅兵', '国防', '军']],
    ['外交与国际', ['外交', '美国', '特朗普', '中美', '国际', '关税', '谈判', '香港', '台湾']],
    ['人物与家族', ['习近平', '江泽民', '胡锦涛', '温家宝', '薄熙来', '家族', '白手套', '太子党', '派系', '红二代', '元老']],
  ],
};

function categorize(author, text) {
  const rules = CATEGORY_RULES[author] || [];
  for (const [cat, kws] of rules) {
    if (kws.some(kw => text.includes(kw))) return cat;
  }
  return '其他';
}

function fmtDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function hashId(str) {
  return 'yt-' + crypto.createHash('md5').update(str).digest('hex').slice(0, 14);
}

const index = [];
const content = {};

// ===== 知乎数据 =====
for (const { file, author } of ZHIHU_SOURCES) {
  const src = path.join(WS, '产出', '知乎故事集', author, file);
  const raw = JSON.parse(fs.readFileSync(src, 'utf8'));
  let added = 0;
  for (const a of raw) {
    if (!a.id || content[a.id]) continue;
    const category = categorize(author, (a.question || '') + (a.content || ''));
    index.push({
      id: a.id,
      source: 'zhihu',
      author,
      question: a.question || '(无题)',
      category,
      votes: a.voteup_count || 0,
      comments: a.comment_count || 0,
      favorites: a.favorites || 0,
      date: fmtDate(a.created_time * 1000),
      url: a.url || '',
      contentLen: (a.content || '').length,
      excerpt: (a.content || '').replace(/\s+/g, ' ').slice(0, 120),
    });
    content[a.id] = a.content || '';
    added++;
  }
  console.log(`[知乎] ${author}: ${raw.length} 条 → 新增 ${added}`);
}

// ===== YouTube 文字稿 =====
if (fs.existsSync(YT_DIR)) {
  const mds = fs.readdirSync(YT_DIR).filter(f => f.endsWith('.md') && !f.includes('索引'));
  let added = 0;
  for (const f of mds) {
    const filePath = path.join(YT_DIR, f);
    const raw = fs.readFileSync(filePath, 'utf8');
    const lines = raw.split('\n');
    let title = '';
    const bodyParts = [];
    for (const ln of lines) {
      if (ln.startsWith('# ') && !title) title = ln.slice(2).trim();
      else bodyParts.push(ln);
    }
    const body = bodyParts.join('\n').trim();
    if (!body) continue;
    const id = hashId(title + f);
    if (content[id]) continue;
    const category = categorize('政经鲁社长', title + body);
    const mtime = fs.statSync(filePath).mtimeMs;
    index.push({
      id,
      source: 'youtube',
      author: '政经鲁社长',
      question: title || f.replace(/\.md$/, ''),
      category,
      votes: 0,
      comments: 0,
      favorites: 0,
      date: fmtDate(mtime),
      url: '',
      contentLen: body.length,
      excerpt: body.replace(/\s+/g, ' ').slice(0, 120),
    });
    content[id] = body;
    added++;
  }
  console.log(`[YouTube] 政经鲁社长: ${mds.length} 篇文字稿 → 新增 ${added}`);
} else {
  console.warn(`⚠ 未找到文字稿目录: ${YT_DIR}`);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'stories-index.json'), JSON.stringify(index), 'utf8');
fs.writeFileSync(path.join(OUT_DIR, 'stories-content.json'), JSON.stringify(content), 'utf8');

console.log(`\n汇总: ${index.length} 条（知乎 ${index.filter(i => i.source === 'zhihu').length} + 文字稿 ${index.filter(i => i.source === 'youtube').length}）`);
console.log(`元数据: ${(fs.statSync(path.join(OUT_DIR, 'stories-index.json')).size / 1024).toFixed(0)} KB`);
console.log(`全文映射: ${(fs.statSync(path.join(OUT_DIR, 'stories-content.json')).size / 1024).toFixed(0)} KB`);
