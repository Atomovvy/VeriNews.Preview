(() => {
  const body = document.body;
  const themeToggle = document.querySelector('[data-theme-toggle]');
  const compactToggle = document.querySelector('[data-compact-toggle]');
  const readingBar = document.querySelector('[data-reading-bar]');
  const readingFill = document.querySelector('[data-reading-fill]');
  const article = document.querySelector('[data-article]');
  const progressMeta = document.querySelector('[data-progress-meta]');
  const navToggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-nav]');
  const collapseButtons = document.querySelectorAll('[data-collapse-target]');
  const translations = {
    pl: {
      menuOpen: 'Otwórz menu',
      menuClose: 'Zamknij menu',
      compactOn: 'Widok kompaktowy',
      compactOff: 'Widok standardowy',
      themeLight: 'Tryb jasny',
      themeDark: 'Tryb ciemny',
      sourceShow: 'Pokaż źródła',
      sourceHide: 'Ukryj źródła',
      analysisShow: 'Pokaż analizę',
      analysisHide: 'Ukryj analizę',
      reading: 'Przeczytano'
    },
    en: {
      menuOpen: 'Open menu',
      menuClose: 'Close menu',
      compactOn: 'Compact view',
      compactOff: 'Standard view',
      themeLight: 'Light mode',
      themeDark: 'Dark mode',
      sourceShow: 'Show sources',
      sourceHide: 'Hide sources',
      analysisShow: 'Show analysis',
      analysisHide: 'Hide analysis',
      reading: 'Read'
    }
  };

  const lang = document.documentElement.lang === 'pl' ? 'pl' : 'en';
  const t = translations[lang];

  function safeStorageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (_) {
      return null;
    }
  }

  function safeStorageSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (_) {
      // Storage is optional for the static reader.
    }
  }

  function applyTheme(theme) {
    body.dataset.theme = theme;
    if (themeToggle) {
      const dark = theme === 'dark';
      themeToggle.setAttribute('aria-pressed', String(dark));
      themeToggle.textContent = dark ? '☀' : '◐';
      themeToggle.title = dark ? t.themeLight : t.themeDark;
      themeToggle.setAttribute('aria-label', dark ? t.themeLight : t.themeDark);
    }
  }

  const savedTheme = safeStorageGet('verinews-theme');
  const defaultTheme = savedTheme || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(defaultTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = body.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      safeStorageSet('verinews-theme', next);
    });
  }

  function applyCompact(compact) {
    body.classList.toggle('is-compact', compact);
    if (compactToggle) {
      compactToggle.setAttribute('aria-pressed', String(compact));
      compactToggle.textContent = compact ? '▣' : '▤';
      compactToggle.title = compact ? t.compactOff : t.compactOn;
      compactToggle.setAttribute('aria-label', compact ? t.compactOff : t.compactOn);
    }
  }

  const compactSaved = safeStorageGet('verinews-compact') === '1';
  applyCompact(compactSaved);

  if (compactToggle) {
    compactToggle.addEventListener('click', () => {
      const next = !body.classList.contains('is-compact');
      applyCompact(next);
      safeStorageSet('verinews-compact', next ? '1' : '0');
    });
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? t.menuClose : t.menuOpen);
    });
  }

  collapseButtons.forEach((button) => {
    const selector = button.getAttribute('data-collapse-target');
    const target = selector ? document.querySelector(selector) : null;
    if (!target) return;
    const collapsedLabel = button.getAttribute('data-collapsed-label') || t.sourceShow;
    const expandedLabel = button.getAttribute('data-expanded-label') || t.sourceHide;
    const initialHidden = target.hasAttribute('hidden');
    button.setAttribute('aria-expanded', String(!initialHidden));
    button.textContent = initialHidden ? collapsedLabel : expandedLabel;
    button.addEventListener('click', () => {
      const willShow = target.hasAttribute('hidden');
      target.toggleAttribute('hidden', !willShow);
      button.setAttribute('aria-expanded', String(willShow));
      button.textContent = willShow ? expandedLabel : collapsedLabel;
    });
  });

  if (readingBar && readingFill && article) {
    const updateProgress = () => {
      const rect = article.getBoundingClientRect();
      const articleTop = window.scrollY + rect.top;
      const articleHeight = article.offsetHeight;
      const viewport = window.innerHeight;
      const maxScroll = Math.max(articleHeight - viewport * 0.45, 1);
      const scrolled = Math.min(Math.max(window.scrollY - articleTop + viewport * 0.18, 0), maxScroll);
      const ratio = Math.max(0, Math.min(scrolled / maxScroll, 1));
      readingFill.style.width = `${Math.round(ratio * 100)}%`;
      if (progressMeta) {
        progressMeta.textContent = `${t.reading}: ${Math.round(ratio * 100)}%`;
      }
    };
    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
  }
})();
