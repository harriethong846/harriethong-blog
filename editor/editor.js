(() => {
  const STORAGE_KEY = "harriethong-blog-draft-v2";
  let state; let originalState; let currentId; let saveTimer;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const uid = () => `article-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  function current() { return state.articles.find((item) => item.id === currentId) || state.articles[0]; }
  function markDirty() { $("#save-status").textContent = "正在保存…"; clearTimeout(saveTimer); saveTimer = setTimeout(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); $("#save-status").textContent = "已保存"; }, 250); }
  function renderPreview() { SiteRenderer.render(state, { root: $("#canvas-root"), post: current()?.slug }); }
  function update(mutator, rerender = true) { mutator(); markDirty(); if (rerender) renderAll(); }

  function renderAll() { renderArticleList(); renderArticleSelector(); renderPreview(); renderInspector(); syncSiteSettings(); }
  function renderArticleSelector() {
    const select = $("#article-select"); select.replaceChildren();
    state.articles.forEach((item) => { const option = document.createElement("option"); option.value = item.id; option.textContent = item.title || "未命名文章"; option.selected = item.id === currentId; select.append(option); });
  }
  function renderArticleList() {
    const list = $("#article-list"); list.replaceChildren();
    state.articles.forEach((item) => {
      const button = document.createElement("button"); button.className = `editor-article-item${item.id === currentId ? " active" : ""}`; button.dataset.id = item.id;
      const status = item.published ? "已发布" : "草稿";
      button.innerHTML = `<strong>${escapeHtml(item.title || "未命名文章")}</strong><span>${escapeHtml(item.date || "")} · ${status}</span>`; list.append(button);
    });
  }
  function field(labelText, key, value, type = "text") {
    const wrapper = document.createElement("label"); wrapper.className = "inspector-field"; wrapper.textContent = labelText;
    const input = type === "textarea" ? document.createElement("textarea") : document.createElement("input"); input.value = value || ""; if (type !== "textarea") input.type = type;
    input.dataset.field = key; wrapper.append(input); return wrapper;
  }
  function renderInspector() {
    const panel = $("#inspector-content"); panel.replaceChildren(); const item = current();
    if (!item) { panel.append(el("p", "inspector-empty", "还没有文章。点击左侧“新建文章”。")); return; }
    panel.append(el("p", "inspector-kicker", "ARTICLE EDITOR"), el("h2", "inspector-title", "编辑文章"));
    panel.append(field("标题", "title", item.title), field("URL slug", "slug", item.slug), field("日期", "date", item.date, "date"), field("分类", "category", item.category));
    panel.append(field("标签（用逗号分隔）", "tags", (item.tags || []).join(", ")), field("摘要", "excerpt", item.excerpt, "textarea"), field("正文", "body", item.body, "textarea"));
    const toggles = el("div", "inspector-toggles"); toggles.append(toggle("发布文章", "published", item.published), toggle("首页精选", "featured", item.featured)); panel.append(toggles);
    const actions = el("div", "inspector-actions"); const deleteButton = document.createElement("button"); deleteButton.className = "wide-button danger"; deleteButton.textContent = "删除文章"; deleteButton.addEventListener("click", deleteArticle); actions.append(deleteButton); panel.append(actions);
    $$("[data-field]", panel).forEach((input) => { input.addEventListener("input", () => { const target = current(); if (!target) return; target[input.dataset.field] = input.dataset.field === "tags" ? input.value.split(",").map((tag) => tag.trim()).filter(Boolean) : input.value; markDirty(); renderPreview(); renderArticleList(); }); });
    $$("[data-toggle]", panel).forEach((input) => input.addEventListener("change", () => { current()[input.dataset.toggle] = input.checked; markDirty(); renderPreview(); renderArticleList(); }));
  }
  function toggle(labelText, key, checked) { const label = el("label", "toggle-row"); label.append(el("span", "", labelText)); const input = document.createElement("input"); input.type = "checkbox"; input.checked = Boolean(checked); input.dataset.toggle = key; const track = el("i"); label.append(input, track); return label; }
  function el(tag, className, text) { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; }
  function escapeHtml(value) { return String(value).replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" })[char]); }

  function newArticle() {
    const article = { id: uid(), slug: "new-note", title: "未命名文章", date: new Date().toISOString().slice(0, 10), category: "随笔", tags: [], excerpt: "写一句摘要，让读者知道这篇文章在讲什么。", body: "从这里开始写正文。\n\n可以使用空行分隔段落。", featured: false, published: false };
    let base = article.slug; let count = 2; while (state.articles.some((item) => item.slug === article.slug)) article.slug = `${base}-${count++}`;
    state.articles.unshift(article); currentId = article.id; update(() => {}, true);
  }
  function deleteArticle() { if (!current() || !confirm("确定删除这篇文章吗？")) return; state.articles = state.articles.filter((item) => item.id !== currentId); currentId = state.articles[0]?.id; update(() => {}, true); }
  function syncSiteSettings() { $("#site-title").value = state.site.title || ""; $("#site-tagline").value = state.site.tagline || ""; $("#sidebar-intro").value = state.sidebar.intro || ""; $("#color-accent").value = state.site.accent || "#8fd3ff"; $("#color-bg").value = state.site.background || "#0d1117"; $("#color-surface").value = state.site.surface || "#151b23"; $("#color-text").value = state.site.text || "#edf4f8"; }
  function switchTab(tab) { $$(".panel-tab").forEach((button) => button.classList.toggle("active", button.dataset.tab === tab)); $$(".panel-content").forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === tab)); }
  function downloadJson() { const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `harriethong-blog-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url); }
  function utf8Base64(text) { const bytes = new TextEncoder().encode(text); let binary = ""; bytes.forEach((byte) => { binary += String.fromCharCode(byte); }); return btoa(binary); }
  async function publishToGithub() {
    const owner = $("#github-owner").value.trim(); const repo = $("#github-repo").value.trim(); const branch = $("#github-branch").value.trim() || "main"; const token = $("#github-token").value.trim(); const message = $("#publish-message");
    if (!owner || !repo || !token) { message.textContent = "请填写用户名、仓库和访问令牌。"; message.className = "publish-message error"; return; }
    message.textContent = "正在连接 GitHub…"; $("#confirm-publish").disabled = true;
    const api = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/content/site.json`; const headers = { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28" };
    try { const existing = await fetch(`${api}?ref=${encodeURIComponent(branch)}`, { headers }); let sha; if (existing.ok) sha = (await existing.json()).sha; else if (existing.status !== 404) throw new Error(`读取仓库失败（${existing.status}）`); const payload = { message: "Update blog content from visual editor", content: utf8Base64(JSON.stringify(state, null, 2)), branch, ...(sha ? { sha } : {}) }; const response = await fetch(api, { method: "PUT", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(payload) }); if (!response.ok) { const details = await response.json().catch(() => ({})); throw new Error(details.message || `发布失败（${response.status}）`); } message.textContent = "发布成功，GitHub Pages 通常会在 1–3 分钟内更新。"; $("#github-token").value = ""; } catch (error) { message.textContent = error.message; message.className = "publish-message error"; } finally { $("#confirm-publish").disabled = false; }
  }
  function bindUi() {
    $$(".panel-tab").forEach((button) => button.addEventListener("click", () => switchTab(button.dataset.tab)));
    $("#article-select").addEventListener("change", (event) => { currentId = event.target.value; renderAll(); });
    $("#article-list").addEventListener("click", (event) => { const button = event.target.closest("[data-id]"); if (button) { currentId = button.dataset.id; renderAll(); } });
    $("#new-article").addEventListener("click", newArticle); $("#new-article-side").addEventListener("click", newArticle);
    const siteFields = [["#site-title", "title"], ["#site-tagline", "tagline"], ["#color-accent", "accent"], ["#color-bg", "background"], ["#color-surface", "surface"], ["#color-text", "text"]]; siteFields.forEach(([selector, key]) => $(selector).addEventListener("input", (event) => update(() => { state.site[key] = event.target.value; }, true)));
    $("#sidebar-intro").addEventListener("input", (event) => update(() => { state.sidebar.intro = event.target.value; }, true));
    $("#export-json").addEventListener("click", downloadJson);
    $("#import-json").addEventListener("change", async (event) => { const file = event.target.files[0]; if (!file) return; try { const imported = JSON.parse(await file.text()); if (!imported.site || !Array.isArray(imported.articles)) throw new Error("文件格式不正确"); state = imported; currentId = state.articles[0]?.id; markDirty(); renderAll(); } catch (error) { alert(`导入失败：${error.message}`); } event.target.value = ""; });
    $("#reset-site").addEventListener("click", () => { if (!confirm("恢复示例内容？未导出的修改将被替换。")) return; state = clone(originalState); currentId = state.articles[0]?.id; update(() => {}, true); });
    $("#preview-button").addEventListener("click", () => window.open("preview.html", "_blank"));
    $("#publish-button").addEventListener("click", () => { $("#github-owner").value = "harriethong846"; $("#github-repo").value = "harriethong-visual-editor"; $("#github-branch").value = "main"; $("#publish-message").textContent = ""; $("#publish-modal").hidden = false; });
    $$('[data-close-modal]').forEach((button) => button.addEventListener("click", () => { $("#publish-modal").hidden = true; })); $("#confirm-publish").addEventListener("click", publishToGithub);
  }
  async function init() {
    try {
      const response = await fetch("../content/site.json", { cache: "no-store" });
      if (!response.ok) throw new Error("无法载入网站数据");
      originalState = await response.json();
      const saved = localStorage.getItem(STORAGE_KEY);
      let parsed = saved ? JSON.parse(saved) : null;
      // Never render a legacy page-builder draft against the new blog renderer.
      if (!parsed || parsed.version !== originalState.version || parsed.site?.title !== originalState.site?.title || !Array.isArray(parsed.articles)) {
        parsed = clone(originalState);
        localStorage.removeItem(STORAGE_KEY);
      }
      state = parsed;
      currentId = state.articles[0]?.id;
      bindUi();
      renderAll();
    } catch (error) { $(".canvas-area").textContent = error.message; }
  }
  init();
})();
