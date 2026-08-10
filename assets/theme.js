(() => {
  'use strict';

  const KEY = 'verinews-theme';
  const VALID = new Set(['light', 'dark']);
  const root = document.documentElement;

  function storedTheme() {
    try {
      const value = localStorage.getItem(KEY);
      return VALID.has(value) ? value : null;
    } catch {
      return null;
    }
  }

  function systemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  function currentTheme() {
    return VALID.has(root.dataset.theme) ? root.dataset.theme : systemTheme();
  }

  function currentLanguage() {
    const pathMatch = location.pathname.match(/\/(pl|en)(?:\/|$)/i);
    if (pathMatch) return pathMatch[1].toLowerCase();
    return (root.lang || 'pl').toLowerCase().startsWith('en') ? 'en' : 'pl';
  }

  function labels() {
    return currentLanguage() === 'pl'
      ? { group: 'Motyw', light: 'Jasny', dark: 'Ciemny' }
      : { group: 'Theme', light: 'Light', dark: 'Dark' };
  }

  function syncControls() {
    const theme = currentTheme();
    document.querySelectorAll('[data-theme-choice]').forEach((button) => {
      const active = button.dataset.themeChoice === theme;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function apply(theme, persist = false) {
    if (!VALID.has(theme)) return;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    if (persist) {
      try { localStorage.setItem(KEY, theme); } catch {}
    }
    syncControls();
  }

  function createControl() {
    const l = labels();
    const wrap = document.createElement('div');
    wrap.className = 'theme-switch';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', l.group);

    for (const [value, text] of [['light', l.light], ['dark', l.dark]]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'theme-choice';
      button.dataset.themeChoice = value;
      button.textContent = text;
      button.addEventListener('click', () => apply(value, true));
      wrap.appendChild(button);
    }
    return wrap;
  }

  function mount() {
    const header = document.querySelector('.header-inner');
    if (!header) return;

    let utilities = header.querySelector('.header-utilities');
    if (!utilities) {
      utilities = document.createElement('div');
      utilities.className = 'header-utilities';
      const language = header.querySelector('.language');
      if (language) utilities.appendChild(language);
      header.appendChild(utilities);
    }

    if (!utilities.querySelector('.theme-switch')) {
      utilities.insertBefore(createControl(), utilities.firstChild);
    }
    syncControls();
  }

  apply(storedTheme() || systemTheme());

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }

  window.VeriNewsTheme = {
    get: currentTheme,
    set: (theme) => apply(theme, true),
    mount,
  };
})();
