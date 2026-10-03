(() => {
  const STORAGE_KEY = "harriethong-site-draft-v1";
  let state;
  let originalState;
  let currentPage = "home";
  let selectedBlockId = null;
  let saveTimer;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const uid = (prefix = "block") => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  const blockDefaults = {
    hero: () => ({ id: uid("hero"), type: "hero", eyebrow: "NEW SECTION", title: "输入一个醒目的标题", body: "点击这段文字，直接输入你想表达的内容。", buttonLabel: "了解更多", buttonUrl: "#" }),
    text: () => ({ id: uid("text"), type: "text", title: "新的内容标题", body: "从这里开始写作。你可以输入多段文字，浏览器会自动保存。" }),
    quote: () => ({ id: uid("quote"), type: "quote", body: "在这里放一句你想强调的话。", caption: "— 来源" }),
    image: () => ({ id: uid("image"), type: "image", url: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1400&q=80", alt: "桌面与笔记本", caption: "点击区块后，在右侧更换图片网址。" }),
    divider: () => ({ id: uid("divider"), type: "divider" })
  };

  const templates = {
    personal: {
      theme: { accent: "#315c4c", background: "#f6f3ec", surface: "#fffdf8", text: "#1f2723", font: "system" },
      blocks: [
        { type: "hero", eyebrow: "HELLO", title: "你好，我是 Harriet。", body: "欢迎来到我的个人空间。我在这里记录工作、兴趣和生活中的发现。", buttonLabel: "认识我", buttonUrl: "?page=about" },
        { type: "text", title: "最近在做什么", body: "写下你最近的项目、研究方向，或最希望访客看到的内容。" },
        { type: "quote", body: "保持好奇，也保持耐心。", caption: "— Harriet" }
      ]
    },
    journal: {
      theme: { accent: "#a5553d", background: "#f3ecdf", surface: "#fffaf0", text: "#342e29", font: "serif" },
      blocks: [
        { type: "hero", eyebrow: "NOTES & STORIES", title: "我的手记", body: "关于阅读、观察与正在发生的生活。", buttonLabel: "开始阅读", buttonUrl: "#latest" },
        { type: "text", title: "一篇新文章", body: "在这里写正文。可以先写一个简短的开头，再逐渐补充完整。\n\n你添加的每个文字区块都可以承载一篇独立内容。" },
        { type: "divider" },
        { type: "quote", body: "文字让稍纵即逝的想法有了可以回去的地方。", caption: "手记" }
      ]
    },
    minimal: {
      theme: { accent: "#202523", background: "#eeeeeb", surface: "#ffffff", text: "#171a19", font: "modern" },
      blocks: [
        { type: "hero", eyebrow: "HARRIET HONG", title: "Selected work and thoughts.", body: "一个清晰、克制的个人档案。", buttonLabel: "联系", buttonUrl: "mailto:hello@example.com" },
        { type: "text", title: "简介", body: "用几句话说明你是谁、你的专业，以及你关注的问题。" },
        { type: "text", title: "项目 01", body: "介绍一个项目：背景、你的角色、做法和最终结果。" }
      ]
    }
  };

  function page() {
    return state.pages.find((item) => item.slug === currentPage) || state.pages[0];
  }

  function block() {
    return page()?.blocks.find((item) => item.id === selectedBlockId);
  }

  function markDirty() {
    $("#save-status").textContent = "正在保存…";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      $("#save-status").textContent = "已保存";
    }, 350);
  }

  function updateState(mutator, rerender = true) {
    mutator();
    markDirty();
    if (rerender) renderAll();
  }

  function renderAll() {
    if (!page()) currentPage = state.pages[0]?.slug;
    SiteRenderer.render(state, { root: $("#canvas-root"), page: currentPage, editable: true });
    renderPageControls();
    bindCanvasEditing();
    syncSettings();
    renderInspector();
  }

  function renderPageControls() {
    const select = $("#page-select");
    select.replaceChildren();
    const list = $("#page-list");
    list.replaceChildren();
    state.pages.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.slug;
      option.textContent = item.title;
      option.selected = item.slug === currentPage;
      select.append(option);
      const button = document.createElement("button");
      button.className = `page-item${item.slug === currentPage ? " active" : ""}`;
      button.dataset.page = item.slug;
      button.innerHTML = `<span>${escapeHtml(item.title)}</span><span>›</span>`;
      list.append(button);
    });
  }

  function editable(node, field, item, allowBreaks = false) {
    if (!node) return;
    node.contentEditable = "true";
    node.spellcheck = true;
    node.addEventListener("keydown", (event) => {
      if (!allowBreaks && event.key === "Enter") event.preventDefault();
    });
    node.addEventListener("input", () => {
      item[field] = node.innerText.replace(/\n{3,}/g, "\n\n");
      markDirty();
    });
  }

  function bindCanvasEditing() {
    const root = $("#canvas-root");
    const brand = $(".brand", root);
    editable(brand, "title", state.site);
    brand?.addEventListener("click", (event) => event.preventDefault());

    $$(".site-nav a", root).forEach((node, index) => {
      const item = state.navigation[index];
      if (!item) return;
      editable(node, "label", item);
      node.addEventListener("click", (event) => event.preventDefault());
    });

    const side = state.sidebar;
    editable($(".sidebar-card h2", root), "title", side);
    editable($(".sidebar-card p", root), "body", side, true);

    page().blocks.forEach((item) => {
      const node = root.querySelector(`[data-block-id="${CSS.escape(item.id)}"]`);
      if (!node) return;
      if (item.id === selectedBlockId) node.classList.add("is-selected");
      node.addEventListener("click", (event) => {
        if (event.target.closest(".block-actions")) return;
        selectedBlockId = item.id;
        renderAll();
      });
      if (item.type === "hero") {
        editable($(".eyebrow", node), "eyebrow", item);
        editable($("h1", node), "title", item);
        editable($(".body", node), "body", item, true);
        editable($(".button-link", node), "buttonLabel", item);
        $(".button-link", node)?.addEventListener("click", (event) => event.preventDefault());
      } else if (item.type === "text") {
        editable($("h2", node), "title", item);
        editable($("p", node), "body", item, true);
      } else if (item.type === "quote") {
        editable($("blockquote", node), "body", item, true);
        editable($("figcaption", node), "caption", item);
      } else if (item.type === "image") {
        editable($("figcaption", node), "caption", item);
      }
      if (item.id === selectedBlockId) node.append(createBlockActions(item.id));
    });
  }

  function createBlockActions(id) {
    const actions = document.createElement("div");
    actions.className = "block-actions";
    [["↑", "up", "上移"], ["↓", "down", "下移"], ["×", "delete", "删除"]].forEach(([label, action, title]) => {
      const button = document.createElement("button");
      button.textContent = label;
      button.title = title;
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        moveOrDeleteBlock(id, action);
      });
      actions.append(button);
    });
    return actions;
  }

  function moveOrDeleteBlock(id, action) {
    const blocks = page().blocks;
    const index = blocks.findIndex((item) => item.id === id);
    if (index < 0) return;
    if (action === "delete") {
      if (!confirm("删除这个区块？")) return;
      blocks.splice(index, 1);
      selectedBlockId = null;
    } else {
      const destination = action === "up" ? index - 1 : index + 1;
      if (destination < 0 || destination >= blocks.length) return;
      [blocks[index], blocks[destination]] = [blocks[destination], blocks[index]];
    }
    markDirty();
    renderAll();
  }

  function renderInspector() {
    const selected = block();
    const empty = $("#inspector-empty");
    const panel = $("#inspector-content");
    empty.hidden = Boolean(selected);
    panel.hidden = !selected;
    panel.replaceChildren();
    if (!selected) return;
    const heading = document.createElement("h3");
    heading.textContent = { hero: "大标题设置", text: "文字区块", quote: "引用区块", image: "图片设置", divider: "分隔线" }[selected.type] || "区块设置";
    panel.append(heading);
    if (selected.type === "hero") {
      panel.append(makeField("按钮链接", "buttonUrl", selected.buttonUrl || "", selected), makeTip("文字可以直接在画布中编辑。按钮链接可填写 https://、mailto:、?page=about 或 #锚点。"));
    } else if (selected.type === "image") {
      panel.append(makeField("图片网址", "url", selected.url || "", selected), makeField("图片替代文字", "alt", selected.alt || "", selected), makeTip("建议使用你自己仓库 assets 文件夹中的图片，例如 assets/photo.jpg；也可以粘贴公开图片网址。"));
    } else {
      panel.append(makeTip("直接点击画布中的文字即可编辑。使用区块上方的箭头调整顺序。"));
    }
  }

  function makeField(labelText, field, value, target) {
    const wrapper = document.createElement("div");
    wrapper.className = "inspector-field";
    const label = document.createElement("label");
    label.textContent = labelText;
    const input = document.createElement("input");
    input.value = value;
    input.addEventListener("change", () => {
      target[field] = input.value;
      markDirty();
      renderAll();
    });
    wrapper.append(label, input);
    return wrapper;
  }

  function makeTip(text) {
    const tip = document.createElement("p");
    tip.className = "inspector-tip";
    tip.textContent = text;
    return tip;
  }

  function syncSettings() {
    $("#sidebar-enabled").checked = Boolean(state.sidebar.enabled);
    $$("#sidebar-position button").forEach((button) => button.classList.toggle("active", button.dataset.position === state.sidebar.position));
    $("#site-title").value = state.site.title || "";
    $("#site-tagline").value = state.site.tagline || "";
    $("#color-accent").value = state.site.accent || "#315c4c";
    $("#color-bg").value = state.site.background || "#f6f3ec";
    $("#color-surface").value = state.site.surface || "#fffdf8";
    $("#color-text").value = state.site.text || "#1f2723";
    $("#font-select").value = state.site.font || "system";
    renderSidebarLinks();
  }

  function renderSidebarLinks() {
    const list = $("#sidebar-link-list");
    list.replaceChildren();
    (state.sidebar.links || []).forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "sidebar-link-row";
      const label = document.createElement("input");
      label.value = item.label || "";
      label.placeholder = "链接文字";
      const url = document.createElement("input");
      url.value = item.url || "";
      url.placeholder = "https:// 或 mailto:";
      const remove = document.createElement("button");
      remove.textContent = "×";
      remove.title = "删除链接";
      label.addEventListener("change", () => updateState(() => { item.label = label.value; }));
      url.addEventListener("change", () => updateState(() => { item.url = url.value; }));
      remove.addEventListener("click", () => updateState(() => { state.sidebar.links.splice(index, 1); }));
      row.append(label, url, remove);
      list.append(row);
    });
  }

  function addPage() {
    const name = prompt("新页面叫什么？", "新页面");
    if (!name?.trim()) return;
    const base = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\u4e00-\u9fa5-]/g, "") || `page-${state.pages.length + 1}`;
    let slug = base;
    let count = 2;
    while (state.pages.some((item) => item.slug === slug)) slug = `${base}-${count++}`;
    state.pages.push({ slug, title: name.trim(), blocks: [blockDefaults.text()] });
    state.navigation.push({ label: name.trim(), page: slug });
    currentPage = slug;
    selectedBlockId = null;
    markDirty();
    renderAll();
  }

  function renamePage() {
    const current = page();
    const name = prompt("页面名称", current.title);
    if (!name?.trim()) return;
    current.title = name.trim();
    const nav = state.navigation.find((item) => item.page === current.slug);
    if (nav) nav.label = name.trim();
    markDirty();
    renderAll();
  }

  function applyTemplate(key) {
    const template = templates[key];
    if (!template || !confirm("使用此模板会替换当前页面的内容。继续吗？")) return;
    Object.assign(state.site, template.theme);
    page().blocks = template.blocks.map((item) => ({ ...item, id: uid(item.type) }));
    selectedBlockId = null;
    markDirty();
    renderAll();
    switchTab("blocks");
  }

  function switchTab(tab) {
    $$(".panel-tab").forEach((button) => button.classList.toggle("active", button.dataset.tab === tab));
    $$(".panel-content").forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === tab));
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `harriethong-site-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function utf8Base64(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary);
  }

  async function publishToGithub() {
    const owner = $("#github-owner").value.trim();
    const repo = $("#github-repo").value.trim();
    const branch = $("#github-branch").value.trim() || "main";
    const token = $("#github-token").value.trim();
    const message = $("#publish-message");
    if (!owner || !repo || !token) {
      message.textContent = "请填写用户名、仓库和访问令牌。";
      message.className = "publish-message error";
      return;
    }
    localStorage.setItem("harriethong-github-target", JSON.stringify({ owner, repo, branch }));
    message.textContent = "正在连接 GitHub…";
    message.className = "publish-message";
    $("#confirm-publish").disabled = true;
    const api = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/content/site.json`;
    const headers = { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28" };
    try {
      const existing = await fetch(`${api}?ref=${encodeURIComponent(branch)}`, { headers });
      let sha;
      if (existing.ok) sha = (await existing.json()).sha;
      else if (existing.status !== 404) throw new Error(`读取仓库失败（${existing.status}）`);
      const payload = {
        message: "Update website content from visual editor",
        content: utf8Base64(JSON.stringify(state, null, 2)),
        branch,
        ...(sha ? { sha } : {})
      };
      const response = await fetch(api, { method: "PUT", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) {
        const details = await response.json().catch(() => ({}));
        throw new Error(details.message || `发布失败（${response.status}）`);
      }
      message.textContent = "发布成功。GitHub Pages 通常会在 1–3 分钟内更新。";
      $("#github-token").value = "";
    } catch (error) {
      message.textContent = error.message;
      message.className = "publish-message error";
    } finally {
      $("#confirm-publish").disabled = false;
    }
  }

  function bindUi() {
    $$(".panel-tab").forEach((button) => button.addEventListener("click", () => switchTab(button.dataset.tab)));
    $$("[data-add-block]").forEach((button) => button.addEventListener("click", () => {
      const item = blockDefaults[button.dataset.addBlock]();
      page().blocks.push(item);
      selectedBlockId = item.id;
      markDirty();
      renderAll();
      setTimeout(() => $("#canvas-root [data-block-id]:last-of-type")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
    }));
    $$("[data-template]").forEach((button) => button.addEventListener("click", () => applyTemplate(button.dataset.template)));
    $("#page-select").addEventListener("change", (event) => { currentPage = event.target.value; selectedBlockId = null; renderAll(); });
    $("#page-list").addEventListener("click", (event) => { const button = event.target.closest("[data-page]"); if (button) { currentPage = button.dataset.page; selectedBlockId = null; renderAll(); } });
    $("#add-page").addEventListener("click", addPage);
    $("#rename-page").addEventListener("click", renamePage);
    $("#sidebar-enabled").addEventListener("change", (event) => updateState(() => { state.sidebar.enabled = event.target.checked; }));
    $$("#sidebar-position button").forEach((button) => button.addEventListener("click", () => updateState(() => { state.sidebar.position = button.dataset.position; state.sidebar.enabled = true; })));
    $("#add-sidebar-link").addEventListener("click", () => updateState(() => {
      state.sidebar.links ||= [];
      state.sidebar.links.push({ label: "新链接", url: "https://" });
      state.sidebar.enabled = true;
    }));

    const settings = [
      ["#site-title", "title"], ["#site-tagline", "tagline"], ["#color-accent", "accent"],
      ["#color-bg", "background"], ["#color-surface", "surface"], ["#color-text", "text"], ["#font-select", "font"]
    ];
    settings.forEach(([selector, field]) => $(selector).addEventListener("input", (event) => updateState(() => { state.site[field] = event.target.value; })));
    $("#export-json").addEventListener("click", downloadJson);
    $("#import-json").addEventListener("change", async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      try {
        const imported = JSON.parse(await file.text());
        if (!imported.site || !Array.isArray(imported.pages)) throw new Error("文件格式不正确");
        state = imported;
        currentPage = state.pages[0]?.slug;
        selectedBlockId = null;
        markDirty();
        renderAll();
      } catch (error) { alert(`导入失败：${error.message}`); }
      event.target.value = "";
    });
    $("#reset-site").addEventListener("click", () => {
      if (!confirm("恢复示例内容？当前未导出的修改将被替换。")) return;
      state = clone(originalState);
      currentPage = state.pages[0].slug;
      selectedBlockId = null;
      markDirty();
      renderAll();
    });
    $("#preview-button").addEventListener("click", () => window.open("preview.html", "_blank"));
    $("#publish-button").addEventListener("click", () => {
      const saved = JSON.parse(localStorage.getItem("harriethong-github-target") || "{}");
      $("#github-owner").value = saved.owner || "";
      $("#github-repo").value = saved.repo || "";
      $("#github-branch").value = saved.branch || "main";
      $("#publish-message").textContent = "";
      $("#publish-modal").hidden = false;
    });
    $$('[data-close-modal]').forEach((button) => button.addEventListener("click", () => { $("#publish-modal").hidden = true; }));
    $("#confirm-publish").addEventListener("click", publishToGithub);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);
  }

  async function init() {
    try {
      const response = await fetch("../content/site.json", { cache: "no-store" });
      if (!response.ok) throw new Error("无法载入网站数据");
      originalState = await response.json();
      const saved = localStorage.getItem(STORAGE_KEY);
      state = saved ? JSON.parse(saved) : clone(originalState);
      currentPage = state.pages[0]?.slug || "home";
      bindUi();
      renderAll();
    } catch (error) {
      $(".canvas-area").innerHTML = `<p class="load-error">${escapeHtml(error.message)}。请使用本地服务器打开项目。</p>`;
    }
  }

  init();
})();
