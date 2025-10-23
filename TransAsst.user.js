// ==UserScript==
// @name         TransAsst
// @namespace    http://www.shuangluo.fun
// @version      1.0.0
// @description  提取当前激活句段的原文和术语，调用DeepSeek API翻译并返回译文
// @match        https://conferences.unite.un.org/eluna/*
// @author       shuangluo
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @connect      api.deepseek.com
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  // ---------- Selectors ----------
  const CONTAINER_SELECTOR = "#searchResultsRow > td > div > div > div.vocabulary.col-md-3";
  const WRAP_CLASS = "TransAsst-wrap";
  const BTN_COPY_CLASS = "TransAsst-copy";
  const BTN_TL_CLASS = "TransAsst-translate";

  // ---------- Utils ----------
  // 限制数值在指定范围内
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  // 页面顶部显示临时提示消息
  function toast(msg, ok = true) {
    try {
      const t = document.createElement("div");
      t.textContent = msg;
      Object.assign(t.style, {
        position: "fixed",
        zIndex: 99999,
        left: "50%",
        top: "15%",
        transform: "translate(-50%, -50%)",
        background: ok ? "#5bb9efff" : "#b02a37",
        color: "#fff",
        padding: "12px 18px",
        borderRadius: "10px",
        boxShadow: "0 4px 16px rgba(0,0,0,.25)",
        fontSize: "14px",
        maxWidth: "70vw",
        textAlign: "center",
        lineHeight: "1.4",
      });
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 2000);
    } catch {}
  }
  // 控制台打印日志（带前缀）
  function log(...a) {
    try {
      console.log("[TransAsst]", ...a);
    } catch {}
  }

  // ---------- Storage (robust) ----------
  // 存储工具，优先使用 GM_*，否则用 localStorage
  const storage = {
    // 获取存储的值
    get(k, d = "") {
      try {
        if (typeof GM_getValue === "function") return GM_getValue(k, d);
      } catch {}
      try {
        const v = localStorage.getItem(k);
        return v === null ? d : v;
      } catch {}
      return d;
    },
    // 设置存储的值
    set(k, v) {
      try {
        if (typeof GM_setValue === "function") return GM_setValue(k, v);
      } catch {}
      try {
        localStorage.setItem(k, v);
      } catch {}
    },
  };

  // ---------- Config keys ----------
  const API_KEY = "TransAsst_ApiKey";
  const MODEL_KEY = "TransAsst_Model";
  const SYS_KEY = "TransAsst_Sys";
  const PRE_KEY = "TransAsst_Pre";
  const TEMP_KEY = "TransAsst_Temp";
  const TOPP_KEY = "TransAsst_TopP";
  const MAXTOK_KEY = "TransAsst_MaxTok";

  // 获取 DeepSeek API key
  function getKey() {
    return (storage.get(API_KEY, "") || "").trim();
  }
  // 设置 DeepSeek API key
  function setKey(v) {
    storage.set(API_KEY, (v || "").trim());
  }
  // 获取 DeepSeek 模型名称
  function getModel() {
    const stored = storage.get(MODEL_KEY, "deepseek-chat");
    const trimmed = (stored || "").trim();
    return trimmed || "deepseek-chat";
  }
  // 设置 DeepSeek 模型名称
  function setModel(v) {
    storage.set(MODEL_KEY, (v || "").trim() || "deepseek-chat");
  }
  // 获取 system prompt
  function getSys() {
    return storage.get(
      SYS_KEY,
      "You are a professional UN Chinese translator. Output only the translation."
    );
  }
  // 设置 system prompt
  function setSys(v) {
    storage.set(SYS_KEY, v || "");
  }
  // 获取用户前置提示
  function getPre() {
    return storage.get(PRE_KEY, "");
  }
  // 设置用户前置提示
  function setPre(v) {
    storage.set(PRE_KEY, v || "");
  }
  // 获取 temperature 设置
  function getTemp() {
    const x = parseFloat(storage.get(TEMP_KEY, "0.2"));
    return clamp(isNaN(x) ? 0.2 : x, 0, 2);
  }
  // 设置 temperature
  function setTemp(v) {
    storage.set(TEMP_KEY, String(v));
  }
  // 获取 top_p 设置
  function getTopP() {
    const x = parseFloat(storage.get(TOPP_KEY, "1"));
    return clamp(isNaN(x) ? 1 : x, 0, 1);
  }
  // 设置 top_p
  function setTopP(v) {
    storage.set(TOPP_KEY, String(v));
  }
  // 获取最大 tokens 设置
  function getMaxTok() {
    const x = parseInt(storage.get(MAXTOK_KEY, "800"), 10);
    return Math.max(1, isNaN(x) ? 800 : x);
  }
  // 设置最大 tokens
  function setMaxTok(v) {
    storage.set(MAXTOK_KEY, String(v));
  }

  // ---------- Config page ----------
  // 打开设置页面
  function openConfigPage() {
    const init = {
      apiKey: getKey(),
      model: getModel(),
      sys: getSys(),
      pre: getPre(),
      temp: getTemp(),
      topp: getTopP(),
      maxtok: getMaxTok(),
    };
    const masked = Object.assign({}, init, {
      apiKey: init.apiKey ? `***${init.apiKey.slice(-4)}` : "",
    });
    log("Opening config page", masked);
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>TransAsst Settings</title>
<style>body{font:14px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial;padding:16px 18px;color:#222}
.wrap{max-width:880px;margin:0 auto}h1{font-size:18px;margin:0 0 12px}
label{display:block;margin:10px 0 4px;color:#444}
input[type=text],input[type=password],input[type=number],textarea,select{width:100%;min-width:0;box-sizing:border-box;display:block;padding:8px;border:1px solid #ddd;border-radius:6px;background:#fff}
#p,#s{resize:vertical}
#s{height:350px;min-height:350px}
#p{height:100px;min-height:100px}
select{height:34px}
.row{display:grid;grid-template-columns:180px 1fr;gap:10px;align-items:center}.grid{display:grid;gap:10px}
.btns{margin-top:14px;display:flex;gap:8px}button{border:0;border-radius:6px;padding:8px 12px;cursor:pointer}
.primary{background:#0d6efd;color:#fff}.muted{background:#eee}.danger{background:#f8d7da;color:#842029}.hint{color:#666;margin-top:8px}
</style></head><body><div class="wrap">
<h1>TransAsst Settings</h1>
<div class="grid">
  <div class="row"><label>DeepSeek API Key</label><input id="k" type="password"/></div>
  <div class="row"><label>Model</label><select id="m"><option value="deepseek-chat" selected>deepseek-chat</option></select></div>
  <div class="row"><label>System Prompt</label><textarea id="s" rows="3"></textarea></div>
  <div class="row"><label>User Prompt</label><textarea id="p" rows="2"></textarea></div>
  <div class="row"><label>Temperature (0–2)</label><input id="t" type="number" min="0" max="2" step="0.1"/></div>
  <div class="row"><label>Top_p (0–1)</label><input id="tp" type="number" min="0" max="1" step="0.05"/></div>
  <div class="row"><label>Max tokens</label><input id="mx" type="number" min="1" step="1"/></div>
</div>
<div class="btns"><button class="primary" id="save">Save</button><button class="danger" id="clear">Clear Key</button><button class="muted" id="close">Close</button></div>
<div class="hint">保存后立即生效。</div>
<script id="init" type="application/json"></script>
<script>
  const initial = JSON.parse(document.getElementById('init').textContent);
  const $ = id => document.getElementById(id);
  $('k').value = initial.apiKey || '';
  $('m').value = initial.model || 'deepseek-chat';
  $('s').value = initial.sys || '';
  $('p').value = initial.pre || '';
  $('t').value = initial.temp;
  $('tp').value = initial.topp;
  $('mx').value = initial.maxtok;
  $('save').onclick = () => {
    const payload = { type:'TransAsstSettings', data:{ apiKey:$('k').value, model:$('m').value, sys:$('s').value, pre:$('p').value, temp:$('t').value, topp:$('tp').value, maxtok:$('mx').value } };
    try{ window.opener && window.opener.postMessage(payload, '*'); alert('Saved!'); }catch(e){ alert('Failed to post settings to parent.'); }
  };
  $('clear').onclick = () => { $('k').value = ''; };
  $('close').onclick = () => { window.close(); };
</script>
</div></body></html>`;
    const w = window.open();
    if (!w) {
      alert("请允许弹窗或关闭拦截");
      log("Failed to open config window");
      return;
    }
    const safe = html.replace(
      '<script id="init" type="application/json"></script>',
      `<script id="init" type="application/json">${JSON.stringify(init).replace(
        /</g,
        "\\u003c"
      )}</script>`
    );
    const blob = new Blob([safe], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    try {
      w.location.href = url;
      log("Config page loaded");
    } catch (e) {
      URL.revokeObjectURL(url);
      log("Config page failed to load", e);
      throw e;
    }
    setTimeout(() => {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    }, 30000);
  }

  window.addEventListener("message", (ev) => {
    const msg = ev && ev.data;
    if (!msg || msg.type !== "TransAsstSettings") return;
    const d = msg.data || {};
    const safe = Object.assign({}, d, {
      apiKey: d.apiKey ? `***${String(d.apiKey).slice(-4)}` : "",
    });
    log("Received settings update", safe);
    setKey(d.apiKey || "");
    setModel(d.model || "deepseek-chat");
    setSys(d.sys || "");
    setPre(d.pre || "");
    setTemp(d.temp || 0.2);
    setTopP(d.topp || 1);
    setMaxTok(d.maxtok || 800);
    toast("TransAsst 设置已更新");
  });

  if (typeof GM_registerMenuCommand === "function") {
    GM_registerMenuCommand("Open TransAsst Settings", openConfigPage);
  }

  // ---------- DeepSeek ----------
  // 调用 DeepSeek API 进行翻译
  async function callDeepSeek(text, termPairs) {
    const key = getKey();
    if (!key) {
      alert("请先在菜单里配置 API Key");
      log("DeepSeek call aborted: missing API key");
      throw new Error("no key");
    }
    const termsBlock =
      termPairs && termPairs.length
        ? termPairs.map((p) => `- ${p.source} => ${p.target || "(未给出)"}`).join("\n")
        : "(无术语)";
    log("Preparing DeepSeek request", {
      model: getModel(),
      textLength: text?.length || 0,
      termsCount: termPairs?.length || 0,
    });
    const payload = {
      model: getModel(),
      messages: [
        { role: "system", content: getSys() },
        {
          role: "user",
          content: [getPre(), "", `请将下面原文翻译为中文：【术语对照】\n${termsBlock}`, "", `【原文】\n${text}`].join(
            "\n"
          ),
        },
      ],
      temperature: getTemp(),
      top_p: getTopP(),
      max_tokens: getMaxTok(),
    };
    return new Promise((resolve, reject) => {
      if (typeof GM_xmlhttpRequest !== "function")
        return reject(new Error("GM_xmlhttpRequest unavailable"));
      GM_xmlhttpRequest({
        method: "POST",
        url: "https://api.deepseek.com/v1/chat/completions",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
        data: JSON.stringify(payload),
        onload: (res) => {
          try {
            const data = JSON.parse(res.responseText);
            log("DeepSeek API responded", {
              status: res.status,
              bodyLength: res.responseText?.length || 0,
            });
            resolve(data?.choices?.[0]?.message?.content?.trim());
          } catch (e) {
            log("DeepSeek API parse error", e);
            reject(e);
          }
        },
        onerror: () => {
          log("DeepSeek API network error");
          reject(new Error("network error"));
        },
        ontimeout: () => {
          log("DeepSeek API timeout");
          reject(new Error("timeout"));
        },
      });
    });
  }

  // ---------- DOM helpers ----------
  // 获取当前激活的表格行
  function getActiveRow() {
    return document.querySelector("tr.activeSegment");
  }
  // 获取指定行的原文
  function getSourceText(row) {
    const el = row?.querySelector("td.original > span.content, td.original .content");
    return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  }

  // 获取术语查询结果
  function getSearhResults() {
    return document.querySelector("#searchResultsRow");
  }
  // 从行中提取术语对

  function extractPairsFromRow(searchResultsRow) {
    const pairs = [];
    if (!searchResultsRow) return pairs;
    const vocab = searchResultsRow.querySelector("div.vocabulary.col-md-3");
    if (!vocab) return pairs;

    const liElements = vocab.querySelectorAll("li");
    for (const li of liElements) {
      const divs = [];
      for (const child of li.children) {
        if (child && child.tagName === "DIV") divs.push(child);
      }
      if (divs.length === 0) continue;

      const anchor = divs[0].querySelector("a");
      const termSource = ((anchor && anchor.textContent) || divs[0].textContent || "")
        .replace(/\s+/g, " ")
        .trim();
      if (!termSource) continue;

      let found = false;
      for (let i = 1; i < divs.length; i++) {
        const zhSpans = divs[i].querySelectorAll('.termField[lang="zh"]');
        for (const span of zhSpans) {
          const zh = (span.textContent || "").replace(/\s+/g, " ").trim();
          if (zh) {
            pairs.push({ source: termSource, target: zh });
            found = true;
          }
        }
      }
      if (!found) pairs.push({ source: termSource, target: "" });
    }
    log("Extracted term pairs", { count: pairs.length });
    return pairs;
  }

  // 将译文写入对应单元格
  function writeTranslation(row, zh) {
    const td = row?.querySelector("td.translation.chinese") || row?.querySelector("td.translation");
    if (!td) return false;
    const label = "";

    // 优先编辑区
    const editable = td.querySelector('div.textarea[contenteditable="true"]');
    if (editable) {
      const has = (editable.textContent || "").trim().length > 0;
      editable.textContent += (has ? "\n\n" : "") + label + zh;
      log("Wrote translation into editable area", {
        addedLength: zh?.length || 0,
        hadExistingContent: has,
      });
      try {
        editable.focus();
        const sel = window.getSelection();
        const r = document.createRange();
        r.selectNodeContents(editable);
        r.collapse(false);
        sel.removeAllRanges();
        sel.addRange(r);
      } catch {}
      return true;
    }

    // 其次 span
    const span = td.querySelector('span.content[lang="zh"]') || td.querySelector("span.content");
    if (span) {
      span.style.display = "";
      const has = (span.textContent || "").trim().length > 0;
      span.textContent += (has ? " " : "") + label + zh;
      log("Wrote translation into span", {
        addedLength: zh?.length || 0,
        hadExistingContent: has,
      });
      return true;
    }
    log("Failed to find translation target element");
    return false;
  }

  // ---------- Buttons ----------
  // 确保按钮包裹容器存在
  function ensureWrap(container) {
    let wrap = container.querySelector("." + WRAP_CLASS);
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = WRAP_CLASS;
      Object.assign(wrap.style, {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "6px",
        marginBottom: "10px",
      });
      container.insertBefore(wrap, container.firstChild);
      log("Created button wrapper");
    }
    return wrap;
  }

  // 添加复制按钮
  function addCopyButton(container) {
    if (!container) return;
    const wrap = ensureWrap(container);
    const baseBg = "rgb(216 237 251)";
    const hoverBg = "rgb(184 219 245)";
    const applyButtonStyle = (btn) =>
      Object.assign(btn.style, {
        width: "70px",
        height: "26px",
        marginTop: "4px",
        marginBottom: "0",
        border: "0",
        borderRadius: "4px",
        background: baseBg,
        color: "rgb(86 181 237)",
        fontWeight: "700",
        fontSize: "small",
        cursor: "pointer",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.15)",
        padding: "0 8px",
      });

    // T: 翻译原文并写入
    let tBtn = wrap.querySelector("." + BTN_TL_CLASS);
    if (!tBtn) {
      tBtn = document.createElement("button");
      tBtn.className = BTN_TL_CLASS;
      tBtn.textContent = "Translate";
      applyButtonStyle(tBtn);
      tBtn.title = "翻译当前激活句段并写入译文";
      tBtn.addEventListener("mouseenter", () => {
        tBtn.style.background = hoverBg;
      });
      tBtn.addEventListener("mouseleave", () => {
        tBtn.style.background = baseBg;
      });
      tBtn.onclick = async () => {
        const activeRow = getActiveRow();
        if (!activeRow) {
          toast("未找到激活句段", false);
          log("Translate button clicked but no active row");
          return;
        }
        const source = getSourceText(activeRow);
        if (!source) {
          toast("原文为空", false);
          log("Translate button clicked but source empty");
          return;
        }
        const searchResultsRow = getSearhResults();
        const pairs = extractPairsFromRow(searchResultsRow);
        toast("翻译中…");
        log("Translate button triggered", {
          sourceLength: source.length,
          termsCount: pairs.length,
        });
        try {
          const zh = await callDeepSeek(source, pairs);
          if (writeTranslation(activeRow, zh)) {
            toast("已写入译文");
            log("Translate button completed", { translationLength: zh?.length || 0 });
          } else {
            toast("写入失败", false);
            log("Translate button write failed");
          }
        } catch (e) {
          toast("翻译失败", false);
          log(e);
        }
      };
      const copyBtn = wrap.querySelector("." + BTN_COPY_CLASS);
      if (copyBtn) {
        wrap.insertBefore(tBtn, copyBtn);
      } else {
        wrap.insertBefore(tBtn, wrap.firstChild);
      }
      log("Translate button added");
    }

    // C: 复制原文+术语
    let cBtn = wrap.querySelector("." + BTN_COPY_CLASS);
    if (!cBtn) {
      cBtn = document.createElement("button");
      cBtn.className = BTN_COPY_CLASS;
      cBtn.textContent = "Copy";
      applyButtonStyle(cBtn);
      cBtn.title = "复制当前激活句段的原文与术语";
      cBtn.addEventListener("mouseenter", () => {
        cBtn.style.background = hoverBg;
      });
      cBtn.addEventListener("mouseleave", () => {
        cBtn.style.background = baseBg;
      });
      cBtn.onclick = async () => {
        const row = getActiveRow();
        if (!row) {
          toast("未找到激活句段", false);
          log("Copy button clicked but no active row");
          return;
        }
        const source = getSourceText(row);
        if (!source) {
          toast("原文为空", false);
          log("Copy button clicked but source empty");
          return;
        }
        const searchResultsRow = getSearhResults();
        const pairs = extractPairsFromRow(searchResultsRow);
        let text = `原文：${source}\n\n术语：\n`;
        text += pairs.length
          ? pairs.map((p) => `${p.source} ${p.target}`).join("\n")
          : "（无术语）";
        try {
          await navigator.clipboard.writeText(text);
          toast("已复制原文和术语至剪贴板");
          log("Copied source and terms", {
            sourceLength: source.length,
            termsCount: pairs.length,
          });
        } catch (e) {
          toast("复制失败", false);
          log(e);
        }
      };
      wrap.appendChild(cBtn);
      log("Copy button added");
    }

    const copyBtnCurrent = wrap.querySelector("." + BTN_COPY_CLASS);
    const translateBtnCurrent = wrap.querySelector("." + BTN_TL_CLASS);
    if (
      copyBtnCurrent &&
      translateBtnCurrent &&
      translateBtnCurrent.nextSibling !== copyBtnCurrent
    ) {
      wrap.insertBefore(translateBtnCurrent, copyBtnCurrent);
    }
  }

  // 扫描页面并添加按钮
  function scan() {
    const containers = document.querySelectorAll(CONTAINER_SELECTOR);
    log("Scanning containers", { count: containers.length });
    containers.forEach(addCopyButton);
  }
  scan();
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
})();
