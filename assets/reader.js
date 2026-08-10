(() => {
  'use strict';

  const AGE_KEY = 'verinews-reader-age';
  const UNREVIEWED_KEY = 'verinews-unreviewed';
  const ACK_KEY = 'verinews-unreviewed-ack';
  const MAX_AGE = 18;

  function language() {
    const pathMatch = location.pathname.match(/\/(pl|en)(?:\/|$)/i);
    if (pathMatch) return pathMatch[1].toLowerCase();
    return (document.documentElement.lang || 'pl').toLowerCase().startsWith('en') ? 'en' : 'pl';
  }

  function labels() {
    return language() === 'pl'
      ? {
          age: 'Wiek',
          ageUnset: 'nie ustawiono',
          unreviewed: 'Bez moderacji',
          on: 'WŁ.',
          off: 'WYŁ.',
          unreviewedWarning: 'Materiały bez przeglądu moderatora zostały przygotowane i sprawdzone przez automatyczny system VeriNews, ale nie przeszły dodatkowego przeglądu człowieka. Mogą zawierać błędy lub wymagać korekty. Pokazać je?',
          ageBlocked: 'Treść przekracza ustawiony przez Ciebie poziom wieku.',
          unreviewedBlocked: 'Materiał nie przeszedł jeszcze przeglądu moderatora.',
          combinedBlocked: 'Materiał przekracza ustawiony poziom wieku i nie przeszedł jeszcze przeglądu moderatora.',
          hardBlocked: 'Materiał oczekuje na wymagany przegląd i nie jest obecnie dostępny do odblokowania.',
          reveal: 'Rozumiem, pokaż materiał',
        }
      : {
          age: 'Age',
          ageUnset: 'not set',
          unreviewed: 'Unreviewed',
          on: 'ON',
          off: 'OFF',
          unreviewedWarning: 'Material without moderator review was prepared and evidence-checked by the automated VeriNews system, but has not completed additional human review. It may contain errors or require correction. Show it?',
          ageBlocked: 'This content is above your selected age level.',
          unreviewedBlocked: 'This material has not yet completed moderator review.',
          combinedBlocked: 'This material is above your selected age level and has not yet completed moderator review.',
          hardBlocked: 'This material is awaiting required review and cannot currently be unlocked.',
          reveal: 'I understand, show this material',
        };
  }

  function readAge() {
    try {
      const raw = localStorage.getItem(AGE_KEY);
      if (raw === null) return 0;
      const value = Number.parseInt(raw, 10);
      return Number.isFinite(value) ? Math.max(0, Math.min(MAX_AGE, value)) : 0;
    } catch {
      return 0;
    }
  }

  function writeAge(value) {
    try { localStorage.setItem(AGE_KEY, String(value)); } catch {}
  }

  function unreviewedEnabled() {
    try { return localStorage.getItem(UNREVIEWED_KEY) === 'on'; } catch { return false; }
  }

  function setUnreviewed(value) {
    try { localStorage.setItem(UNREVIEWED_KEY, value ? 'on' : 'off'); } catch {}
  }

  function acknowledged() {
    try { return localStorage.getItem(ACK_KEY) === '1'; } catch { return false; }
  }

  function acknowledge() {
    try { localStorage.setItem(ACK_KEY, '1'); } catch {}
  }

  function isHardBlocked(gate) {
    return gate.dataset.hardBlocked === 'true';
  }

  function restrictions(gate) {
    const age = readAge();
    const minimumAge = Number.parseInt(gate.dataset.ageMin || '0', 10) || 0;
    const moderation = gate.dataset.moderation || 'APPROVED';
    return {
      age: minimumAge > age,
      unreviewed: moderation === 'UNREVIEWED' && !unreviewedEnabled(),
      hard: isHardBlocked(gate),
    };
  }

  function setTitleState(gate, locked) {
    gate.querySelectorAll('[data-gate-safe-title]').forEach((node) => {
      node.hidden = !locked;
    });
    gate.querySelectorAll('[data-gate-full-title]').forEach((node) => {
      node.hidden = locked;
    });
  }

  function updateGate(gate) {
    const l = labels();
    const state = restrictions(gate);
    const forced = gate.dataset.forceReveal === 'true';
    const locked = state.hard || (!forced && (state.age || state.unreviewed));
    const notice = gate.querySelector('[data-gate-notice]');
    const content = gate.querySelector('[data-gate-content]');
    const reason = gate.querySelector('[data-gate-reason]');
    const button = gate.querySelector('[data-gate-reveal]');

    gate.classList.toggle('is-restricted', locked);
    if (notice) notice.hidden = !locked;
    if (content) content.hidden = locked;
    setTitleState(gate, locked);

    if (!locked) return;
    if (reason) {
      reason.textContent = state.hard
        ? l.hardBlocked
        : state.age && state.unreviewed
          ? l.combinedBlocked
          : state.age
            ? l.ageBlocked
            : l.unreviewedBlocked;
    }
    if (button) {
      button.hidden = state.hard;
      button.textContent = l.reveal;
    }
  }

  function updateAll() {
    document.querySelectorAll('[data-reader-gate]').forEach(updateGate);
    syncControls();
  }

  function revealOne(gate) {
    if (isHardBlocked(gate)) return;
    gate.dataset.forceReveal = 'true';
    updateGate(gate);
  }

  function ensureUtilities() {
    const header = document.querySelector('.header-inner');
    if (!header) return null;
    let utilities = header.querySelector('.header-utilities');
    if (!utilities) {
      utilities = document.createElement('div');
      utilities.className = 'header-utilities';
      const languageNode = header.querySelector('.language');
      if (languageNode) utilities.appendChild(languageNode);
      header.appendChild(utilities);
    }
    return utilities;
  }

  function createAgeControl() {
    const l = labels();
    const wrap = document.createElement('label');
    wrap.className = 'age-control';

    const text = document.createElement('span');
    text.className = 'age-label';

    const input = document.createElement('input');
    input.type = 'range';
    input.min = '0';
    input.max = String(MAX_AGE);
    input.step = '1';
    input.value = String(readAge());
    input.setAttribute('aria-label', l.age);

    function refreshText() {
      const value = Number.parseInt(input.value, 10) || 0;
      text.textContent = `${l.age}: ${value === 0 ? l.ageUnset : value + '+'}`;
    }

    input.addEventListener('input', () => {
      const value = Number.parseInt(input.value, 10) || 0;
      writeAge(value);
      refreshText();
      updateAll();
    });

    refreshText();
    wrap.append(text, input);
    return wrap;
  }

  function createUnreviewedControl() {
    const l = labels();
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'unreviewed-toggle';
    button.dataset.unreviewedToggle = 'true';

    button.addEventListener('click', () => {
      const next = !unreviewedEnabled();
      if (next && !acknowledged()) {
        if (!window.confirm(l.unreviewedWarning)) return;
        acknowledge();
      }
      setUnreviewed(next);
      updateAll();
    });

    return button;
  }

  function syncControls() {
    const l = labels();
    const enabled = unreviewedEnabled();
    document.querySelectorAll('[data-unreviewed-toggle]').forEach((button) => {
      button.textContent = `${l.unreviewed}: ${enabled ? l.on : l.off}`;
      button.classList.toggle('active', enabled);
      button.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    });
    document.querySelectorAll('.age-control input[type="range"]').forEach((input) => {
      const age = readAge();
      if (input.value !== String(age)) input.value = String(age);
      const label = input.closest('.age-control')?.querySelector('.age-label');
      if (label) label.textContent = `${l.age}: ${age === 0 ? l.ageUnset : age + '+'}`;
    });
  }

  function mount() {
    const utilities = ensureUtilities();
    if (utilities && !utilities.querySelector('.reader-controls')) {
      const controls = document.createElement('div');
      controls.className = 'reader-controls';
      controls.append(createAgeControl(), createUnreviewedControl());
      const languageNode = utilities.querySelector('.language');
      utilities.insertBefore(controls, languageNode || utilities.firstChild);
    }

    document.querySelectorAll('[data-gate-reveal]').forEach((button) => {
      if (button.dataset.readerBound === 'true') return;
      button.dataset.readerBound = 'true';
      button.addEventListener('click', () => {
        const gate = button.closest('[data-reader-gate]');
        if (gate) revealOne(gate);
      });
    });

    updateAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }

  window.VeriNewsReader = {
    mount,
    refresh: updateAll,
    age: {
      get: readAge,
      set(value) {
        const age = Math.max(0, Math.min(MAX_AGE, Number.parseInt(value, 10) || 0));
        writeAge(age);
        updateAll();
      },
    },
    unreviewed: {
      get: unreviewedEnabled,
      set(value) {
        setUnreviewed(Boolean(value));
        updateAll();
      },
    },
  };
})();
