(() => {
  'use strict';

  const AGE_KEY = 'verinews-reader-age';
  const UNREVIEWED_KEY = 'verinews-unreviewed';
  const ACK_KEY = 'verinews-unreviewed-ack';
  const MAX_AGE = 18;
  const DESCRIPTOR_LABELS = {
    pl: {
      VIOLENCE: 'przemoc',
      GRAPHIC_VIOLENCE_DESCRIPTION: 'graficzny opis przemocy',
      DEATH: 'śmierć',
      WAR_OR_ARMED_CONFLICT: 'wojna / konflikt zbrojny',
      SEXUAL_CONTENT: 'treści seksualne',
      STRONG_LANGUAGE: 'mocny język',
      DRUGS: 'narkotyki',
      SELF_HARM: 'samookaleczenie',
      DISTURBING_CONTENT: 'treści niepokojące',
    },
    en: {
      VIOLENCE: 'violence',
      GRAPHIC_VIOLENCE_DESCRIPTION: 'graphic description of violence',
      DEATH: 'death',
      WAR_OR_ARMED_CONFLICT: 'war / armed conflict',
      SEXUAL_CONTENT: 'sexual content',
      STRONG_LANGUAGE: 'strong language',
      DRUGS: 'drugs',
      SELF_HARM: 'self-harm',
      DISTURBING_CONTENT: 'disturbing content',
    },
  };

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
          ageClassification: 'Klasyfikacja wieku',
          allAges: 'Dla wszystkich',
          content: 'Treść',
          unreviewed: 'Bez moderacji',
          unreviewedBadge: 'Bez przeglądu moderatora',
          reviewRequiredBadge: 'Wymagany przegląd redakcyjny',
          on: 'WŁ.',
          off: 'WYŁ.',
          unreviewedWarning: 'Materiały bez przeglądu moderatora zostały przygotowane i sprawdzone przez automatyczny system VeriNews, ale nie przeszły dodatkowego przeglądu człowieka. Mogą zawierać błędy lub wymagać korekty. Pokazać je?',
          ageBlocked: 'Treść przekracza ustawiony przez Ciebie poziom wieku.',
          unreviewedBlocked: 'Materiał nie przeszedł jeszcze przeglądu moderatora.',
          combinedBlocked: 'Materiał przekracza ustawiony poziom wieku i nie przeszedł jeszcze przeglądu moderatora.',
          hardTitle: 'Wymagany przegląd redakcyjny',
          hardBlocked: 'Materiał nie został jeszcze dopuszczony do publikacji przez moderatora.',
          reveal: 'Rozumiem, pokaż materiał',
        }
      : {
          age: 'Age',
          ageUnset: 'not set',
          ageClassification: 'Age classification',
          allAges: 'All ages',
          content: 'Content',
          unreviewed: 'Unreviewed',
          unreviewedBadge: 'Not yet moderator-reviewed',
          reviewRequiredBadge: 'Editorial review required',
          on: 'ON',
          off: 'OFF',
          unreviewedWarning: 'Material without moderator review was prepared and evidence-checked by the automated VeriNews system, but has not completed additional human review. It may contain errors or require correction. Show it?',
          ageBlocked: 'This content is above your selected age level.',
          unreviewedBlocked: 'This material has not yet completed moderator review.',
          combinedBlocked: 'This material is above your selected age level and has not yet completed moderator review.',
          hardTitle: 'Editorial review required',
          hardBlocked: 'This material has not yet been approved for publication by a moderator.',
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

  function formatAgeRating(raw, l) {
    return String(raw || 'ALL') === 'ALL' ? l.allAges : String(raw);
  }

  function descriptorLabel(raw) {
    const lang = language();
    return DESCRIPTOR_LABELS[lang]?.[raw]
      || String(raw).toLowerCase().replaceAll('_', ' ');
  }

  function storedDescriptors(gate, detail) {
    if (gate.dataset.presentationDescriptors) {
      try { return JSON.parse(gate.dataset.presentationDescriptors); } catch {}
    }
    const raw = detail?.textContent || '';
    const suffix = raw.split('·').slice(1).join('·').trim();
    const descriptors = suffix ? suffix.split(',').map((value) => value.trim()).filter(Boolean) : [];
    gate.dataset.presentationDescriptors = JSON.stringify(descriptors);
    return descriptors;
  }

  function setMetaLine(node, label, value) {
    if (!node) return;
    node.textContent = '';
    const labelNode = document.createElement('span');
    labelNode.className = 'restriction-meta-label';
    labelNode.textContent = `${label}: `;
    node.append(labelNode, document.createTextNode(value));
  }

  function syncGatePresentation(gate, l) {
    const rating = gate.dataset.ageRating || 'ALL';
    gate.querySelectorAll('.age-pill').forEach((pill) => {
      pill.textContent = formatAgeRating(rating, l);
    });

    gate.querySelectorAll('.moderation-pill').forEach((pill) => {
      pill.textContent = isHardBlocked(gate) ? l.reviewRequiredBadge : l.unreviewedBadge;
    });

    const notice = gate.querySelector('[data-gate-notice]');
    if (!notice) return;
    const detail = notice.querySelector('.restriction-detail');
    const descriptors = storedDescriptors(gate, detail);

    let heading = notice.querySelector('[data-gate-heading]');
    if (isHardBlocked(gate)) {
      if (!heading) {
        heading = document.createElement('p');
        heading.className = 'restriction-heading';
        heading.dataset.gateHeading = 'true';
        notice.insertBefore(heading, notice.firstChild);
      }
      heading.textContent = l.hardTitle;
    } else if (heading) {
      heading.remove();
    }

    setMetaLine(detail, l.ageClassification, formatAgeRating(rating, l));

    let contentDetail = notice.querySelector('[data-gate-content-detail]');
    if (descriptors.length) {
      if (!contentDetail) {
        contentDetail = document.createElement('p');
        contentDetail.className = 'restriction-detail restriction-content-detail';
        contentDetail.dataset.gateContentDetail = 'true';
        detail?.insertAdjacentElement('afterend', contentDetail);
      }
      setMetaLine(contentDetail, l.content, descriptors.map(descriptorLabel).join(', '));
    } else if (contentDetail) {
      contentDetail.remove();
    }
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
    syncGatePresentation(gate, l);
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

  function syncPreviewSource() {
    const source = document.querySelector('meta[name="verinews-source-commit"]')?.content || '';
    if (!/^[0-9a-f]{40}$/.test(source)) return;
    document.querySelectorAll('.site-footer p').forEach((node) => {
      if (/source\s+[0-9a-f]{12}/i.test(node.textContent || '')) {
        node.textContent = (node.textContent || '').replace(/source\s+[0-9a-f]{12}/i, `source ${source.slice(0, 12)}`);
      }
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
    syncPreviewSource();
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
