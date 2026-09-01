/* Hallmark · component: Reader · genre: editorial · tone: paper-reading · anchor hue: 朱砂 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const FONT_SIZES = [15, 16, 17, 18, 19, 20, 22, 24];
const LS_KEYS = {
  fontSize: 'kb-reader-fontsize',
  dark: 'kb-reader-dark',
  serif: 'kb-reader-serif',
  pos: (id) => 'kb-reader-pos-' + id,
};

function loadLS(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}
function saveLS(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* ignore */
  }
}

// 智能分节：识别标题行
function splitSections(paragraphs) {
  const strong = (p) =>
    /^[一二三四五六七八九十百]+[、．.]/.test(p) ||
    /^第[一二三四五六七八九十百]+[章节篇]/.test(p) ||
    /^\d+[、．.]/.test(p) ||
    /^[【\[（(]/.test(p);
  const weak = (p) =>
    p.length < 30 &&
    !/[。，、；：！？）"」』】]/.test(p) &&
    !/^[\dA-Za-z]/.test(p) &&
    !p.includes('的');

  if (paragraphs.length <= 8) {
    // 短文不切分，整篇作为一个区块
    return [{ title: null, paragraphs }];
  }

  const result = [];
  let current = { title: null, paragraphs: [] };
  let pendingTitle = null;

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    if (strong(p)) {
      if (current.paragraphs.length > 0) result.push(current);
      current = { title: p, paragraphs: [] };
    } else if (weak(p) && i > 0 && i < paragraphs.length - 2) {
      // 弱标题：保存为待定标题，若后续段落出现则前一个区块结束
      pendingTitle = p;
    } else {
      if (pendingTitle) {
        if (current.paragraphs.length > 0) result.push(current);
        current = { title: pendingTitle, paragraphs: [] };
        pendingTitle = null;
      }
      current.paragraphs.push(p);
    }
  }
  if (pendingTitle && current.paragraphs.length === 0) current.title = pendingTitle;
  if (current.paragraphs.length > 0 || current.title) result.push(current);
  return result;
}

export default function Reader({ item, contentMap, onClose, prevItem, nextItem, onNextItem, onPrevItem }) {
  const [fontSizeIdx, setSizeIdx] = useState(() => loadLS(LS_KEYS.fontSize, 3));
  const [darkMode, setDarkMode] = useState(() => loadLS(LS_KEYS.dark, false));
  const [serifMode, setSerifMode] = useState(() => loadLS(LS_KEYS.serif, false));
  const [showToc, setShowToc] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const overlayRef = useRef(null);
  const restoredRef = useRef(null);

  const fullText = contentMap ? contentMap[item.id] || '' : '';
  const paragraphs = useMemo(() => fullText.split(/\n{2,}/).filter((p) => p.trim()), [fullText]);
  const sections = useMemo(() => splitSections(paragraphs), [paragraphs]);
  const isSections = sections.length > 1;

  // 持久化偏好
  useEffect(() => saveLS(LS_KEYS.fontSize, fontSizeIdx), [fontSizeIdx]);
  useEffect(() => saveLS(LS_KEYS.dark, darkMode), [darkMode]);
  useEffect(() => saveLS(LS_KEYS.serif, serifMode), [serifMode]);

  // 滚动：进度 + 当前章节高亮 + 保存阅读位置
  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    let saveTimer = null;
    let lastPct = 0;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      lastPct = scrollHeight <= clientHeight ? 0 : scrollTop / (scrollHeight - clientHeight);
      const v = Math.min(1, Math.max(0, lastPct));
      setScrollProgress(v);
      if (isSections) {
        const secs = el.querySelectorAll('.reader-section');
        let cur = 0;
        for (let i = 0; i < secs.length; i++) {
          if (secs[i].offsetTop - 100 <= el.scrollTop) cur = i;
        }
        setActiveSection(cur);
      }
      if (!saveTimer) {
        saveTimer = setTimeout(() => {
          saveTimer = null;
          saveLS(LS_KEYS.pos(item.id), lastPct);
        }, 400);
      }
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (saveTimer) clearTimeout(saveTimer);
      saveLS(LS_KEYS.pos(item.id), lastPct);
    };
  }, [isSections, item.id]);

  // 阻止背景滚动
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // 打开时恢复阅读位置（等全文渲染后）
  useEffect(() => {
    if (!contentMap || !overlayRef.current) return;
    const id = item.id;
    const saved = loadLS(LS_KEYS.pos(id), null);
    if (saved === null || restoredRef.current === id) return;
    restoredRef.current = id;
    requestAnimationFrame(() => {
      const el = overlayRef.current;
      if (el && el.scrollHeight > el.clientHeight) {
        el.scrollTop = saved * (el.scrollHeight - el.clientHeight);
      }
    });
  }, [item.id, contentMap]);

  // 键盘快捷键
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowDown' || e.key === 'j' || e.key === ' ') {
        e.preventDefault();
        overlayRef.current?.scrollBy({ top: window.innerHeight * 0.7, behavior: 'smooth' });
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        overlayRef.current?.scrollBy({ top: -window.innerHeight * 0.7, behavior: 'smooth' });
      } else if (e.key === 'ArrowRight' || e.key === 'l') onNextItem?.();
      else if (e.key === 'ArrowLeft' || e.key === 'h') onPrevItem?.();
      else if (e.key === 'd') setDarkMode((v) => !v);
      else if (e.key === 't') setShowToc((v) => !v);
      else if (e.key === 'f') setSerifMode((v) => !v);
      else if (e.key === '+' || e.key === '=') setSizeIdx((i) => Math.min(FONT_SIZES.length - 1, i + 1));
      else if (e.key === '-') setSizeIdx((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onNextItem, onPrevItem]);

  const fontSize = FONT_SIZES[fontSizeIdx];
  const scrollToTop = () => {
    overlayRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const scrollToSection = (i) => {
    const el = overlayRef.current?.querySelector(`[data-sec="${i}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setShowToc(false);
  };

  const overlay = (
    <div
      ref={overlayRef}
      className={'reader-overlay' + (darkMode ? ' dark' : '')}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: darkMode ? '#141414' : '#f7f4ee',
        color: darkMode ? '#ddd9d0' : '#2b2a28',
        overflowY: 'auto',
        overflowX: 'hidden',
        overscrollBehavior: 'contain',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* 顶部工具栏 */}
      <div className="reader-toolbar visible">
        <button className="reader-toolbar-btn" onClick={onClose} aria-label="关闭" title="返回 (Esc)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="reader-toolbar-center">
          <span className="reader-toolbar-title">
            {item.author} · {item.source === 'youtube' ? '文字稿' : '问答'}
          </span>
        </div>
        <div className="reader-toolbar-actions">
          {isSections && (
            <button
              className="reader-toolbar-btn"
              onClick={() => setShowToc((v) => !v)}
              aria-label="目录"
              title="目录 (T)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <button
            className="reader-toolbar-btn"
            onClick={() => setSerifMode((v) => !v)}
            aria-label="字体切换"
            title="衬线/无衬线 (F)"
          >
            <span style={{ fontSize: 14, fontWeight: 600, fontFamily: serifMode ? 'var(--font-display)' : 'inherit' }}>
              {serifMode ? '宋' : '黑'}
            </span>
          </button>
          <button
            className="reader-toolbar-btn"
            onClick={() => setDarkMode((v) => !v)}
            aria-label="夜间模式"
            title="夜间模式 (D)"
          >
            {darkMode ? '☀' : '☾'}
          </button>
          <div className="reader-font-size-control">
            <button
              className="reader-toolbar-btn"
              onClick={() => setSizeIdx((i) => Math.max(0, i - 1))}
              disabled={fontSizeIdx === 0}
              aria-label="减小字号"
            >
              <span style={{ fontSize: 13, fontWeight: 600 }}>A−</span>
            </button>
            <span className="reader-font-size-label">{FONT_SIZES[fontSizeIdx]}px</span>
            <button
              className="reader-toolbar-btn"
              onClick={() => setSizeIdx((i) => Math.min(FONT_SIZES.length - 1, i + 1))}
              disabled={fontSizeIdx === FONT_SIZES.length - 1}
              aria-label="增大字号"
            >
              <span style={{ fontSize: 19, fontWeight: 600 }}>A+</span>
            </button>
          </div>
        </div>
      </div>

      {/* 顶部进度条 */}
      <div className="reader-progress-track">
        <div className="reader-progress-bar" style={{ width: `${scrollProgress * 100}%` }} />
      </div>

      {/* 目录 */}
      {showToc && isSections && (
        <div className="reader-toc-overlay" onClick={() => setShowToc(false)}>
          <nav className="reader-toc" onClick={(e) => e.stopPropagation()}>
            <h3>目录</h3>
            <ul>
              {sections.map((sec, i) => (
                <li key={i} className={activeSection === i ? 'active' : ''}>
                  <button onClick={() => scrollToSection(i)}>
                    {sec.title || `第 ${i + 1} 节`}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}

      {/* 正文 */}
      <article
        className="reader-article"
        style={{
          fontSize: `${fontSize}px`,
          fontFamily: serifMode ? 'var(--font-display)' : undefined,
        }}
      >
        <header className="reader-header">
          <h1>{item.question}</h1>
          <div className="reader-meta">
            <span className="tag author">{item.author}</span>
            <span className="tag">{item.source === 'youtube' ? '🎬 文字稿' : '问答'}</span>
            <span className="tag">{item.category}</span>
            {item.source === 'zhihu' ? (
              <>
                <span>👍 {fmt(item.votes)}</span>
                <span>💬 {fmt(item.comments)}</span>
                <span>⭐ {fmt(item.favorites)}</span>
              </>
            ) : (
              <span>📄 {fmt(item.contentLen || 0)} 字</span>
            )}
            <span>{item.date}</span>
          </div>
        </header>

        <div className="reader-body">
          {!contentMap ? (
            <div className="reader-loading">
              <div className="reader-loading-spinner" />
              <p>正在加载全文…</p>
            </div>
          ) : paragraphs.length === 0 ? (
            <div className="reader-empty">（该内容暂无可用全文）</div>
          ) : isSections ? (
            sections.map((sec, i) => (
              <section key={i} data-sec={i} className="reader-section">
                {sec.title && <h2 className="reader-section-title">{sec.title}</h2>}
                {sec.paragraphs.map((p, j) => (
                  <p key={j} className={j === 0 && i === 0 ? 'lead' : ''}>
                    {p}
                  </p>
                ))}
              </section>
            ))
          ) : (
            paragraphs.map((p, i) => (
              <p key={i} className={i === 0 ? 'lead' : ''}>
                {p}
              </p>
            ))
          )}
        </div>

        {item.url && (
          <footer className="reader-footer">
            <a href={item.url} target="_blank" rel="noreferrer">
              查看原文 ↗
            </a>
          </footer>
        )}
      </article>

      {/* 回到顶部 */}
      {scrollProgress > 0.25 && (
        <button className="reader-top-btn" onClick={scrollToTop} aria-label="回到顶部">
          ↑
        </button>
      )}

      {/* 底部导航 */}
      <div className="reader-nav visible">
        <button
          className="reader-nav-btn"
          onClick={onPrevItem}
          disabled={!prevItem}
          title={prevItem ? prevItem.question.slice(0, 30) : '已经是第一篇'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span>上一篇</span>
        </button>
        <span className="reader-nav-hint">{Math.round(scrollProgress * 100)}%</span>
        <button
          className="reader-nav-btn"
          onClick={onNextItem}
          disabled={!nextItem}
          title={nextItem ? nextItem.question.slice(0, 30) : '已经是最后一篇'}
        >
          <span>下一篇</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}

function fmt(n) {
  return n >= 10000 ? (n / 10000).toFixed(1) + '万' : n.toLocaleString();
}
