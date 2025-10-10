// ==UserScript==
// @name         CopyAsst
// @namespace    http://www.shuangluo.fun
// @version      1.0.0
// @description  This is a userscript for Tampermonkey. It extract the active source text segment and its terminology pairs, and copy them to clipboard.
// @match        https://conferences.unite.un.org/eluna/*
// @author       shuangluo
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const CONTAINER_SELECTOR = '#searchResultsRow > td > div > div > div.arrows.col-md-1';
  const BTN_CLASS = 'CopyAsst-tbtn';

  window.CopyAsstTerms = [];
  window.CopyAsstSourceText = '';

  function createClipboardIcon() {
    // 使用简洁的“剪贴板”SVG图标
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '18');
    svg.setAttribute('height', '18');
    svg.setAttribute('aria-hidden', 'true');

    // 背板
    const path1 = document.createElementNS(svgNS, 'path');
    path1.setAttribute('d', 'M8 4h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z');
    path1.setAttribute('fill', 'currentColor');
    path1.setAttribute('opacity', '0.2');

    // 夹子
    const path2 = document.createElementNS(svgNS, 'path');
    path2.setAttribute('d', 'M9 4a3 3 0 0 1 6 0h2a1 1 0 0 1 1 1v2h-2V6a1 1 0 0 0-1-1h-1a3 3 0 0 1-6 0H7a1 1 0 0 0-1 1v1H4V5a1 1 0 0 1 1-1h4zM12 5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z');
    path2.setAttribute('fill', 'currentColor');

    // 三条“文本线”
    const line1 = document.createElementNS(svgNS, 'rect');
    line1.setAttribute('x', '9'); line1.setAttribute('y', '10');
    line1.setAttribute('width', '6'); line1.setAttribute('height', '1.6');
    line1.setAttribute('fill', 'currentColor');

    const line2 = document.createElementNS(svgNS, 'rect');
    line2.setAttribute('x', '9'); line2.setAttribute('y', '13');
    line2.setAttribute('width', '6'); line2.setAttribute('height', '1.6');
    line2.setAttribute('fill', 'currentColor');

    const line3 = document.createElementNS(svgNS, 'rect');
    line3.setAttribute('x', '9'); line3.setAttribute('y', '16');
    line3.setAttribute('width', '6'); line3.setAttribute('height', '1.6');
    line3.setAttribute('fill', 'currentColor');

    svg.appendChild(path1);
    svg.appendChild(path2);
    svg.appendChild(line1);
    svg.appendChild(line2);
    svg.appendChild(line3);
    return svg;
  }

  function addButton(container) {
    if (!container || container.querySelector('.' + BTN_CLASS)) return;

    // 使用 <button> 语义更清晰，可聚焦，不依赖站点 CSS
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'CopyAsst – extract & copy');
    btn.className = BTN_CLASS;
    btn.title = 'Extract & copy (CopyAsst)';
    btn.appendChild(createClipboardIcon());

    // 尽量贴合现有箭头按钮的尺寸与间距
    Object.assign(btn.style, {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '30px',
      height: '30px',
      marginLeft: '5px',
      padding: '0',
      border: '0px solid #c8c8c8',
      borderRadius: '0px',
      background: '#d8edfb',
      color: '#57b5ed',
      lineHeight: '1',
      cursor: 'pointer',
      userSelect: 'none',
      outline: 'none'
    });

    // 悬停/聚焦态
    btn.addEventListener('mouseenter', () => { btn.style.background = '#b7def9'; });
    btn.addEventListener('mouseleave', () => { btn.style.background = '#d8edfb'; });
    btn.addEventListener('focus', () => { btn.style.boxShadow = '0 0 0 2px rgba(0, 120, 212, 0.3)'; });
    btn.addEventListener('blur', () => { btn.style.boxShadow = 'none'; });

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      // ========== 1) 抽取术语 ==========
      const row = container.closest('#searchResultsRow');
      let pairs = [];
      if (row) {
        const vocabDiv = row.querySelector('div.vocabulary.col-md-3');
        if (vocabDiv) {
          const liElements = vocabDiv.querySelectorAll('li');
          liElements.forEach((li) => {
            const divs = Array.from(li.children).filter(n => n.tagName === 'DIV');
            if (divs.length === 0) return;

            const anchor = divs[0].querySelector('a');
            const termSource = (anchor?.textContent || divs[0].textContent || '')
              .replace(/\s+/g, ' ')
              .trim();
            if (!termSource) return;

            let found = false;
            for (let i = 1; i < divs.length; i++) {
              const zhSpans = divs[i].querySelectorAll('.termField[lang="zh"]');
              zhSpans.forEach(span => {
                const zh = (span.textContent || '').replace(/\s+/g, ' ').trim();
                if (zh) {
                  pairs.push({ source: termSource, target: zh });
                  found = true;
                }
              });
            }
            if (!found) pairs.push({ source: termSource, target: '' });
          });
        }
      }
      window.CopyAsstTerms = pairs;
      console.log(`[CopyAsst] 已找到${pairs.length}条术语`);

      // ========== 2) 获取当前激活句段原文 ==========
      const activeRow =
        document.querySelector('tr.activeSegment') ||
        (document.querySelector('.activeSegment') && document.querySelector('.activeSegment').closest('tr'));

      let sourceText = '';
      if (activeRow) {
        const contentEl =
          activeRow.querySelector('td.original > span.content') ||
          activeRow.querySelector('td.original .content');
        if (contentEl) {
          sourceText = contentEl.textContent.replace(/\s+/g, ' ').trim();
        }
      }
      window.CopyAsstSourceText = sourceText;
      console.log(`[CopyAsst] 已找到原文：${sourceText}`);

      // ========== 3) 拼接并复制到剪贴板 ==========
      let textToCopy = `原文：${sourceText}\n\n术语：\n`;
      if (pairs.length > 0) {
        textToCopy += pairs.map(p => `${p.source} ${p.target}`).join('\n');
      } else {
        textToCopy += '（无术语）';
      }

      try {
        await navigator.clipboard.writeText(textToCopy);
        console.log('[CopyAsst] 已复制到剪贴板');
      } catch (err) {
        console.error('[CopyAsst] 写入剪贴板失败：', err);
      }
    });

    container.appendChild(btn);
  }

  function scanAndInsert() {
    document.querySelectorAll(CONTAINER_SELECTOR).forEach(addButton);
  }

  scanAndInsert();

  const mo = new MutationObserver(() => scanAndInsert());
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();
