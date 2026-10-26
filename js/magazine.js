(() => {
  "use strict";
  const dialog = document.querySelector(".mag-search");
  const input = dialog?.querySelector("input");
  const results = dialog?.querySelector(".mag-search-results");
  const status = dialog?.querySelector(".mag-search-status");
  let articles = null;
  let searchLoading = null;

  function loadArticles() {
    if (!searchLoading) {
      searchLoading = fetch("/search-index.json").then(response => {
        if (!response.ok) throw new Error("Search index unavailable");
        return response.json();
      }).then(data => { articles = data; return data; }).catch(error => {
        searchLoading = null;
        throw error;
      });
    }
    return searchLoading;
  }

  function renderSearch() {
    if (!articles) return;
    const query = input.value.trim().toLocaleLowerCase();
    const matches = articles.filter(article =>
      `${article.title} ${article.tags.join(" ")}`.toLocaleLowerCase().includes(query));
    results.replaceChildren();
    status.textContent = query ? `找到 ${matches.length} 篇文章` : "从最近的记录开始，也可以搜索标题或标签";
    if (!matches.length) status.textContent = "暂时没找到，试试 React、AI、棒针或手工。";
    matches.forEach(article => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      const date = document.createElement("time");
      const title = document.createElement("strong");
      link.href = article.url;
      date.dateTime = article.date;
      date.textContent = `${article.date} · ${article.category === "handmade" ? "生活与手作" : "技术札记"}`;
      title.textContent = article.title;
      link.append(date, title);
      item.append(link);
      results.append(item);
    });
  }

  async function openSearch() {
    if (!dialog || dialog.open) return;
    dialog.showModal();
    document.body.classList.add("mag-lock-scroll");
    input.focus();
    status.textContent = "正在翻找笔记……";
    try { await loadArticles(); renderSearch(); }
    catch { status.textContent = "笔记暂时没有加载成功，可以先去文章归档逛逛。"; }
  }

  function setupSearch() {
    document.querySelectorAll(".mag-search-open").forEach(button => {
      button.hidden = false;
      button.addEventListener("click", openSearch);
    });
    dialog?.querySelector(".mag-search-close").addEventListener("click", () => dialog.close());
    dialog?.addEventListener("close", () => document.body.classList.remove("mag-lock-scroll"));
    dialog?.addEventListener("click", event => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
    input?.addEventListener("input", renderSearch);
    document.addEventListener("keydown", event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearch();
      }
    });
  }

  function filterArchive() {
    const filters = document.querySelector(".mag-archive-filters");
    if (!filters) return;
    const selected = ["tech", "handmade"].includes(location.hash.slice(1)) ? location.hash.slice(1) : "all";
    filters.querySelectorAll("a").forEach(link =>
      link.setAttribute("aria-current", String(link.hash === `#${selected}`)));
    const currentNav = selected === "tech" ? "/archives/#tech" :
      selected === "handmade" ? "/#life" : "/archives/";
    document.querySelectorAll(".mag-nav-links a").forEach(link => {
      if (link.getAttribute("href") === currentNav) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    let visible = 0;
    document.querySelectorAll(".mag-archive-group").forEach(group => {
      let groupCount = 0;
      group.querySelectorAll(".post-item").forEach(item => {
        item.hidden = selected !== "all" && item.dataset.category !== selected;
        if (!item.hidden) { groupCount++; visible++; }
      });
      group.hidden = groupCount === 0;
    });
    const count = document.querySelector(".mag-archive-count");
    if (count) count.textContent = `${visible} 篇记录`;
  }

  function setupLittleThings() {
    const egg = document.querySelector(".mag-easter-egg");
    const note = document.querySelector(".mag-secret");
    egg?.addEventListener("click", () => {
      note.hidden = !note.hidden;
      egg.setAttribute("aria-expanded", String(!note.hidden));
    });
    const backTop = document.querySelector(".mag-back-top");
    if (!backTop) return;
    const updateScroll = () => { backTop.hidden = window.scrollY < 600; };
    window.addEventListener("scroll", updateScroll, { passive: true });
    updateScroll();
    backTop.addEventListener("click", () => window.scrollTo({ top: 0,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }));
  }

  setupSearch();
  setupLittleThings();
  filterArchive();
  window.addEventListener("hashchange", filterArchive);
})();
