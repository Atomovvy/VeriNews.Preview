(() => {
  'use strict';

  const THEME_KEY = 'verinews-theme';
  const DENSITY_KEY = 'verinews-view-density';
  const VALID_THEMES = new Set(['light', 'dark']);
  const VALID_DENSITIES = new Set(['standard', 'compact']);
  const root = document.documentElement;

  function storedValue(key, valid) {
    try {
      const value = localStorage.getItem(key);
      return valid.has(value) ? value : null;
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
    return VALID_THEMES.has(root.dataset.theme) ? root.dataset.theme : systemTheme();
  }

  function currentDensity() {
    return VALID_DENSITIES.has(root.dataset.density) ? root.dataset.density : 'standard';
  }

  function currentLanguage() {
    const pathMatch = location.pathname.match(/\/(pl|en)(?:\/|$)/i);
    if (pathMatch) return pathMatch[1].toLowerCase();
    return (root.lang || 'pl').toLowerCase().startsWith('en') ? 'en' : 'pl';
  }

  function labels() {
    return currentLanguage() === 'pl'
      ? {
          themeGroup: 'Motyw',
          light: 'Jasny',
          dark: 'Ciemny',
          densityGroup: 'Widok',
          standard: 'Standardowy',
          compact: 'Kompaktowy',
        }
      : {
          themeGroup: 'Theme',
          light: 'Light',
          dark: 'Dark',
          densityGroup: 'View',
          standard: 'Standard',
          compact: 'Compact',
        };
  }

  function syncControls() {
    const theme = currentTheme();
    document.querySelectorAll('[data-theme-choice]').forEach((button) => {
      const active = button.dataset.themeChoice === theme;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    const density = currentDensity();
    document.querySelectorAll('[data-density-choice]').forEach((button) => {
      const active = button.dataset.densityChoice === density;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function syncBrowserColorScheme(theme) {
    let meta = document.querySelector('meta[name="color-scheme"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'color-scheme';
      document.head?.appendChild(meta);
    }
    if (meta) meta.content = theme;
    root.style.colorScheme = theme === 'light' ? 'only light' : 'dark';
    root.style.backgroundColor = theme === 'light' ? '#ffffff' : '#111310';
  }

  function applyTheme(theme, persist = false) {
    if (!VALID_THEMES.has(theme)) return;
    root.dataset.theme = theme;
    syncBrowserColorScheme(theme);
    if (persist) {
      try { localStorage.setItem(THEME_KEY, theme); } catch {}
    }
    syncControls();
  }

  function applyDensity(density, persist = false) {
    if (!VALID_DENSITIES.has(density)) return;
    root.dataset.density = density;
    if (persist) {
      try { localStorage.setItem(DENSITY_KEY, density); } catch {}
    }
    syncControls();
  }

  function createChoiceControl(className, ariaLabel, values, dataKey, apply) {
    const wrap = document.createElement('div');
    wrap.className = className;
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', ariaLabel);

    for (const [value, text] of values) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = className === 'theme-switch' ? 'theme-choice' : 'density-choice';
      button.dataset[dataKey] = value;
      button.textContent = text;
      button.addEventListener('click', () => apply(value, true));
      wrap.appendChild(button);
    }
    return wrap;
  }

  function createThemeControl() {
    const l = labels();
    return createChoiceControl(
      'theme-switch',
      l.themeGroup,
      [['light', l.light], ['dark', l.dark]],
      'themeChoice',
      applyTheme,
    );
  }

  function createDensityControl() {
    const l = labels();
    return createChoiceControl(
      'density-switch',
      l.densityGroup,
      [['standard', l.standard], ['compact', l.compact]],
      'densityChoice',
      applyDensity,
    );
  }

  function analysisSectionKind(heading) {
    const text = heading.trim().toLowerCase();
    if (/^claim[-\s]?\d+/.test(text) || /^twierdzenie\b/.test(text)) return 'claim';
    if (/(dlaczego taka ocena|ocena całości|overall assessment|why this assessment)/.test(text)) return 'assessment';
    if (/(potwierdzone|confirmed)/.test(text)) return 'confirmed';
    if (/(z zastrzeżeniami|qualified|qualifying|kontrdowody|counter-evidence)/.test(text)) return 'qualified';
    if (/(nieznane|unknown|niepewność|uncertainty)/.test(text)) return 'unknown';
    if (/(źródła|sources|niezależne potwierdzenia|independent corroboration)/.test(text)) return 'sources';
    if (/(historia|history|revision)/.test(text)) return 'history';
    return 'section';
  }

  function markConfidenceBreakdowns(prose) {
    const componentNames = [
      'evidence_directness',
      'independent_corroboration',
      'source_independence_diversity',
      'consistency_counterevidence',
      'temporal_maturity',
      'claim_scope_precision',
    ];
    prose.querySelectorAll('.table-wrap').forEach((wrap) => {
      const text = (wrap.textContent || '').toLowerCase();
      const matches = componentNames.filter((name) => text.includes(name)).length;
      if (matches >= 3) {
        wrap.classList.add('confidence-breakdown');
        wrap.closest('.analysis-section')?.classList.add('has-confidence-breakdown');
      }
    });
  }

  function enhanceAnalysis() {
    document.querySelectorAll('.analysis-prose:not([data-hybrid-v2-enhanced])').forEach((prose) => {
      prose.dataset.hybridV2Enhanced = 'true';
      const children = Array.from(prose.children);
      let section = null;

      for (const node of children) {
        if (node.tagName === 'H2') {
          section = document.createElement('section');
          section.className = `analysis-section analysis-section-${analysisSectionKind(node.textContent || '')}`;
          prose.insertBefore(section, node);
        }
        if (section) section.appendChild(node);
      }

      markConfidenceBreakdowns(prose);
    });
  }

  function mount() {
    const header = document.querySelector('.header-inner');
    if (header) {
      let utilities = header.querySelector('.header-utilities');
      if (!utilities) {
        utilities = document.createElement('div');
        utilities.className = 'header-utilities';
        const language = header.querySelector('.language');
        if (language) utilities.appendChild(language);
        header.appendChild(utilities);
      }

      if (!utilities.querySelector('.theme-switch')) {
        utilities.insertBefore(createThemeControl(), utilities.firstChild);
      }
      if (!utilities.querySelector('.density-switch')) {
        const themeControl = utilities.querySelector('.theme-switch');
        themeControl?.insertAdjacentElement('afterend', createDensityControl());
      }
    }

    enhanceAnalysis();
    syncControls();
  }

  applyTheme(storedValue(THEME_KEY, VALID_THEMES) || systemTheme());
  applyDensity(storedValue(DENSITY_KEY, VALID_DENSITIES) || 'standard');

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }

  window.VeriNewsTheme = {
    get: currentTheme,
    set: (theme) => applyTheme(theme, true),
    density: {
      get: currentDensity,
      set: (density) => applyDensity(density, true),
    },
    mount,
  };
})();
