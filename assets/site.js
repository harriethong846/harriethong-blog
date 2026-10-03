const SiteRenderer = (() => {
  const safeUrl = (value = "") => {
    const trimmed = String(value).trim();
    return /^(https?:|mailto:|tel:|\?|#|\/|\.\.?\/|[a-z0-9_-]+\/)/i.test(trimmed) ? trimmed : "#";
  };

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  function applyTheme(site) {
    const root = document.documentElement;
    root.style.setProperty("--accent", site.accent || "#315c4c");
    root.style.setProperty("--bg", site.background || "#f6f3ec");
    root.style.setProperty("--surface", site.surface || "#fffdf8");
    root.style.setProperty("--text", site.text || "#1f2723");
    root.style.setProperty("--max-width", `${site.maxWidth || 1180}px`);
    const fonts = {
      system: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      serif: 'Georgia, "Times New Roman", serif',
      modern: 'Arial, Helvetica, sans-serif'
    };
    root.style.setProperty("--font", fonts[site.font] || fonts.system);
  }

  function renderBlock(block, editable = false) {
    let node;
    if (block.type === "hero") {
      node = el("section", "content-block block-hero");
      node.append(el("p", "eyebrow", block.eyebrow || ""));
      node.append(el("h1", "", block.title || "无标题"));
      node.append(el("p", "body", block.body || ""));
      if (block.buttonLabel) {
        const link = el("a", "button-link", block.buttonLabel);
        link.href = editable ? "#" : safeUrl(block.buttonUrl);
        node.append(link);
      }
    } else if (block.type === "quote") {
      node = el("figure", "content-block block-quote");
      node.append(el("blockquote", "", block.body || "引用文字"));
      node.append(el("figcaption", "", block.caption || ""));
    } else if (block.type === "image") {
      node = el("figure", "content-block block-image");
      const img = el("img");
      img.src = safeUrl(block.url) === "#" ? "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1400&q=80" : block.url;
      img.alt = block.alt || "";
      node.append(img, el("figcaption", "", block.caption || ""));
    } else if (block.type === "divider") {
      node = el("div", "content-block block-divider");
    } else {
      node = el("section", "content-block block-text");
      node.append(el("h2", "", block.title || "新标题"));
      node.append(el("p", "", block.body || "在这里输入内容。"));
    }
    node.dataset.blockId = block.id;
    return node;
  }

  function render(data, options = {}) {
    const root = options.root || document.querySelector("#site-root");
    if (!root) return;
    applyTheme(data.site || {});
    const queryPage = new URLSearchParams(location.search).get("page");
    const slug = options.page || queryPage || data.pages?.[0]?.slug;
    const page = data.pages?.find((item) => item.slug === slug) || data.pages?.[0];
    root.replaceChildren();

    const header = el("header", "site-header");
    const brand = el("a", "brand", data.site?.title || "My Site");
    brand.href = options.editable ? "#" : "?page=home";
    const nav = el("nav", "site-nav");
    (data.navigation || []).forEach((item) => {
      const link = el("a", "", item.label);
      link.href = options.editable ? "#" : `?page=${encodeURIComponent(item.page)}`;
      if (item.page === page?.slug) link.setAttribute("aria-current", "page");
      nav.append(link);
    });
    header.append(brand, nav);

    const shell = el("div", "site-shell");
    const sidebar = data.sidebar || {};
    if (!sidebar.enabled) shell.classList.add("no-sidebar");
    if (sidebar.enabled && sidebar.position === "left") shell.classList.add("sidebar-left");
    const main = el("main", "site-main");
    if (!page?.blocks?.length) main.append(el("div", "empty-state", "这个页面还没有内容。"));
    (page?.blocks || []).forEach((block) => main.append(renderBlock(block, options.editable)));
    shell.append(main);
    if (sidebar.enabled) {
      const aside = el("aside", "sidebar");
      const card = el("div", "sidebar-card");
      card.append(el("h2", "", sidebar.title || "侧边栏"), el("p", "", sidebar.body || ""));
      const links = el("div", "sidebar-links");
      (sidebar.links || []).forEach((item) => {
        const link = el("a", "", item.label);
        link.href = options.editable ? "#" : safeUrl(item.url);
        links.append(link);
      });
      card.append(links);
      aside.append(card);
      shell.append(aside);
    }
    const footer = el("footer", "site-footer", `© ${new Date().getFullYear()} ${data.site?.title || "My Site"}`);
    root.append(header, shell, footer);
    document.title = `${page?.title || "网站"} — ${data.site?.title || "My Site"}`;
  }

  return { render, renderBlock, applyTheme };
})();

window.SiteRenderer = SiteRenderer;

if (document.querySelector("#site-root") && document.body.dataset.manualRender !== "true" && !document.body.classList.contains("editor-body")) {
  fetch("content/site.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error("无法读取网站内容");
      return response.json();
    })
    .then((data) => SiteRenderer.render(data))
    .catch((error) => {
      document.querySelector("#site-root").textContent = `${error.message}。请通过本地服务器或 GitHub Pages 打开。`;
    });
}
