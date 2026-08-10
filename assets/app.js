(() => {
  'use strict';

  const BASE = location.pathname.startsWith('/VeriNews.Preview/') ? '/VeriNews.Preview/' : '/';
  const SOURCE_COMMIT = '23a29d67a17f5eb4cc5f10e1c130b59f4dd5f040';
  const STORIES = [
    'openai-astra-cyber-controls',
    'israel-gaza-15-point-document',
    'eclipse-perseids-poland',
  ];
  const CATEGORIES = [
    {id:'poland',pl:'Polska',en:'Poland'},
    {id:'world',pl:'Świat',en:'World'},
    {id:'ai',pl:'AI',en:'AI'},
    {id:'technology',pl:'Technologia',en:'Technology'},
    {id:'science',pl:'Nauka',en:'Science'},
    {id:'cyber',pl:'Cyber',en:'Cyber'},
    {id:'economy',pl:'Gospodarka',en:'Economy'},
  ];
  const CAT = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
  const AGE_MIN = {'ALL':0,'7+':7,'12+':12,'16+':16,'18+':18};

  const T = {
    pl: {
      tag: 'Wiadomości z jawną ścieżką weryfikacji.',
      latest: 'Najnowsze analizy',
      assessment: 'Ocena',
      confidence: 'Poziom wiarygodności',
      status: 'Status',
      updated: 'Stan dowodów',
      read: 'Czytaj materiał',
      analysis: 'Pełna analiza',
      method: 'Poziom wiarygodności opisuje pewność bieżącej oceny dowodów, nie procent prawdy.',
      empty: 'W tej kategorii nie ma jeszcze opublikowanych materiałów.',
      error: 'Nie udało się wczytać podglądu.',
      age: 'Wiek',
      unreviewed: 'Bez przeglądu moderatora',
      reviewRequired: 'Wymagany przegląd',
      ageBlocked: 'Treść przekracza ustawiony przez Ciebie poziom wieku.',
      unreviewedBlocked: 'Materiał nie przeszedł jeszcze przeglądu moderatora.',
      combinedBlocked: 'Materiał przekracza ustawiony poziom wieku i nie przeszedł jeszcze przeglądu moderatora.',
      hardBlocked: 'Materiał oczekuje na wymagany przegląd i nie jest obecnie dostępny do odblokowania.',
      reveal: 'Rozumiem, pokaż materiał',
      aiLine: 'Weryfikacja informacji wspierana przez AI',
      preview: 'M5B.5 public preview',
    },
    en: {
      tag: 'News with a visible verification trail.',
      latest: 'Latest analyses',
      assessment: 'Assessment',
      confidence: 'Confidence level',
      status: 'Status',
      updated: 'Evidence state',
      read: 'Read story',
      analysis: 'Full analysis',
      method: 'Confidence describes certainty in the current evidence assessment, not a percentage of truth.',
      empty: 'There are no published stories in this category yet.',
      error: 'The preview could not be loaded.',
      age: 'Age',
      unreviewed: 'Not yet moderator-reviewed',
      reviewRequired: 'Review required',
      ageBlocked: 'This content is above your selected age level.',
      unreviewedBlocked: 'This material has not yet completed moderator review.',
      combinedBlocked: 'This material is above your selected age level and has not yet completed moderator review.',
      hardBlocked: 'This material is awaiting required review and cannot currently be unlocked.',
      reveal: 'I understand, show this material',
      aiLine: 'AI-assisted news verification',
      preview: 'M5B.5 public preview',
    },
  };

  const ASSESSMENT = {
    pl:{PENDING:'OCZEKUJE',SUPPORTED:'POTWIERDZONE',PARTIALLY_SUPPORTED:'CZĘŚCIOWO POTWIERDZONE',INSUFFICIENT_EVIDENCE:'NIEWYSTARCZAJĄCE DOWODY',DISPUTED:'SPORNE',CONTRADICTED:'OBALONE',NOT_YET_VERIFIABLE:'JESZCZE NIEWERYFIKOWALNE'},
    en:{PENDING:'Pending',SUPPORTED:'Supported',PARTIALLY_SUPPORTED:'Partly supported',INSUFFICIENT_EVIDENCE:'Insufficient evidence',DISPUTED:'Disputed',CONTRADICTED:'Contradicted',NOT_YET_VERIFIABLE:'Not yet verifiable'},
  };
  const STATUS = {
    pl:{DISCOVERED:'ODKRYTE',ANALYZING:'W ANALIZIE',PROVISIONAL:'WSTĘPNA OCENA',VERIFIED:'ZWERYFIKOWANE',DISPUTED:'SPORNE',OUTDATED:'NIEAKTUALNE',RETRACTED:'WYCOFANE'},
    en:{DISCOVERED:'Discovered',ANALYZING:'Analyzing',PROVISIONAL:'Provisional',VERIFIED:'Verified',DISPUTED:'Disputed',OUTDATED:'Outdated',RETRACTED:'Retracted'},
  };
  const BAND = {
    pl:{LOW:'NISKA',LIMITED:'OGRANICZONA',MODERATE:'UMIARKOWANA',HIGH:'WYSOKA',VERY_HIGH:'BARDZO WYSOKA'},
    en:{LOW:'Low',LIMITED:'Limited',MODERATE:'Moderate',HIGH:'High',VERY_HIGH:'Very high'},
  };

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function safeHref(raw) {
    const value = String(raw || '').trim();
    if (/^(\.\.\/|\.\/|\/|#)/.test(value)) return esc(value);
    try {
      const url = new URL(value, location.href);
      return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? esc(value) : '#';
    } catch {
      return '#';
    }
  }

  function inline(value) {
    let text = esc(value);
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => `<a href="${safeHref(url)}">${label}</a>`);
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    return text;
  }

  function cells(line) {
    return line.trim().replace(/^\||\|$/g, '').split('|').map((x) => x.trim());
  }

  function markdown(md) {
    const lines = md.split(/\r?\n/);
    const out = [];
    let i = 0;
    let inCode = false;
    let code = [];
    while (i < lines.length) {
      const line = lines[i];
      const s = line.trim();
      if (s.startsWith('```')) {
        if (inCode) {
          out.push('<pre><code>' + esc(code.join('\n')) + '</code></pre>');
          code = [];
        }
        inCode = !inCode;
        i += 1;
        continue;
      }
      if (inCode) {
        code.push(line);
        i += 1;
        continue;
      }
      if (!s) {
        i += 1;
        continue;
      }
      if (line.includes('|') && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
        const head = cells(line);
        i += 2;
        const rows = [];
        while (i < lines.length && lines[i].trim() && lines[i].includes('|')) {
          rows.push(cells(lines[i]));
          i += 1;
        }
        out.push('<div class="table-wrap"><table><thead><tr>' + head.map((x) => `<th>${inline(x)}</th>`).join('') + '</tr></thead><tbody>' + rows.map((row) => '<tr>' + row.map((x) => `<td>${inline(x)}</td>`).join('') + '</tr>').join('') + '</tbody></table></div>');
        continue;
      }
      const heading = line.match(/^(#{1,6})\s+(.+)$/);
      if (heading) {
        const n = heading[1].length;
        out.push(`<h${n}>${inline(heading[2])}</h${n}>`);
        i += 1;
        continue;
      }
      if (/^\s*-\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^\s*-\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*-\s+/, '').trim());
          i += 1;
        }
        out.push('<ul>' + items.map((x) => `<li>${inline(x)}</li>`).join('') + '</ul>');
        continue;
      }
      const paragraph = [s];
      i += 1;
      while (i < lines.length) {
        const next = lines[i].trim();
        if (!next || next.startsWith('#') || next.startsWith('```') || /^-\s+/.test(next)) break;
        if (lines[i].includes('|') && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) break;
        paragraph.push(next);
        i += 1;
      }
      out.push('<p>' + inline(paragraph.join(' ')) + '</p>');
    }
    if (inCode) out.push('<pre><code>' + esc(code.join('\n')) + '</code></pre>');
    return out.join('\n');
  }

  function parseDoc(text) {
    const match = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
    if (!match) throw new Error('frontmatter');
    const meta = {};
    match[1].split(/\r?\n/).forEach((line) => {
      const p = line.indexOf(':');
      if (p <= 0) return;
      let value = line.slice(p + 1).trim().replace(/^['"]|['"]$/g, '');
      if (/^\d+$/.test(value)) value = Number(value);
      meta[line.slice(0, p).trim()] = value;
    });
    return {meta, body: match[2]};
  }

  function titleSummary(body) {
    const title = (body.match(/^#\s+(.+)$/m) || [])[1] || 'VeriNews';
    const brief = body.match(/^##\s+(?:W skrócie|In brief)\s*$\n+([^\n#]+)/mi);
    const summary = (brief?.[1] || '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*|`/g, '').trim();
    return {title, summary};
  }

  function withoutFirstH1(body) {
    return body.replace(/^#\s+.+?(?:\r?\n+|$)/m, '').trimStart();
  }

  function source(slug, kind, lang) {
    return `${BASE}content/2026/08/10/${slug}/${kind}.${lang}.md`;
  }

  function publicationSource(slug) {
    return `${BASE}content/2026/08/10/${slug}/publication.json`;
  }

  async function load(slug, kind, lang) {
    const response = await fetch(source(slug, kind, lang), {cache:'no-store'});
    if (!response.ok) throw new Error(`${response.status}`);
    return parseDoc(await response.text());
  }

  async function loadPublication(slug) {
    const response = await fetch(publicationSource(slug), {cache:'no-store'});
    if (!response.ok) throw new Error(`publication ${response.status}`);
    return response.json();
  }

  function route() {
    const rel = location.pathname.startsWith(BASE) ? location.pathname.slice(BASE.length) : location.pathname.replace(/^\//, '');
    const parts = rel.split('/').filter(Boolean);
    if (!parts.length) return {redirect:true};
    const lang = ['pl','en'].includes(parts[0]) ? parts[0] : 'pl';
    if (parts[1] === 'category' && CAT[parts[2]]) return {lang, category:parts[2], kind:'category'};
    if (parts[1] === 'news' && STORIES.includes(parts[2])) {
      const analysis = parts[3] === 'analysis';
      return {lang, slug:parts[2], analysis, kind:analysis ? 'analysis' : 'article'};
    }
    return {lang, kind:'home'};
  }

  function paired(r) {
    const other = r.lang === 'pl' ? 'en' : 'pl';
    if (r.category) return `${BASE}${other}/category/${r.category}/`;
    if (r.slug) return `${BASE}${other}/news/${r.slug}/${r.analysis ? 'analysis/' : ''}`;
    return `${BASE}${other}/`;
  }

  function categoryLabel(id, lang) {
    return CAT[id]?.[lang] || id;
  }

  function categoryNav(r) {
    const latest = r.kind === 'home' ? ' active' : '';
    const links = [`<a class="${latest.trim()}" href="${BASE}${r.lang}/">${r.lang === 'pl' ? 'Najnowsze' : 'Latest'}</a>`];
    for (const category of CATEGORIES) {
      const active = r.category === category.id ? ' active' : '';
      links.push(`<a class="${active.trim()}" href="${BASE}${r.lang}/category/${category.id}/">${esc(category[r.lang])}</a>`);
    }
    return `<div class="category-strip"><nav class="category-nav" aria-label="Categories">${links.join('')}</nav></div>`;
  }

  function frame(r, body, title = 'VeriNews') {
    const labels = T[r.lang];
    const other = r.lang === 'pl' ? 'EN' : 'PL';
    document.documentElement.lang = r.lang;
    document.title = `${title} · VeriNews`;
    document.body.className = `${r.kind || 'home'}-page`;
    document.body.innerHTML = `<header class="site-header"><div class="header-inner"><a class="brand" href="${BASE}${r.lang}/">VeriNews</a><nav class="language" aria-label="Language"><span class="active">${r.lang.toUpperCase()}</span><span>/</span><a href="${paired(r)}">${other}</a></nav></div>${categoryNav(r)}</header><main class="shell">${body}</main><footer class="site-footer"><p><strong>Atomovvy &amp; Nova · 2026</strong></p><p>${esc(labels.aiLine)}</p><p>${esc(labels.method)}</p><p>${esc(labels.preview)} · source ${esc(SOURCE_COMMIT.slice(0, 12))}</p></footer>`;
    window.VeriNewsTheme?.mount?.();
    window.VeriNewsReader?.mount?.();
  }

  function display(table, value, lang, technical) {
    return technical ? String(value) : (table[lang]?.[value] || String(value));
  }

  function evidence(meta, lang, technical = false) {
    const labels = T[lang];
    const assessment = display(ASSESSMENT, meta.overall_assessment, lang, technical);
    const status = display(STATUS, meta.status, lang, technical);
    const band = display(BAND, meta.confidence_band, lang, technical);
    return `<section class="evidence-bar" aria-label="Evidence summary"><div><span>${labels.assessment}</span><strong>${esc(assessment)}</strong></div><div><span>${labels.confidence}</span><strong>${esc(meta.confidence_score)}/100 · ${esc(band)}</strong></div><div><span>${labels.status}</span><strong>${esc(status)}</strong></div><div><span>${labels.updated}</span><strong>${esc(meta.updated_at)}</strong></div></section>`;
  }

  function ageMin(publication) {
    return AGE_MIN[publication.age_rating] || 0;
  }

  function hardBlocked(publication) {
    return ['BLOCKED', 'BLOCKED_PENDING_REVIEW'].includes(publication.publication_mode);
  }

  function initiallyLocked(publication) {
    return hardBlocked(publication) || publication.moderation_status === 'UNREVIEWED' || ageMin(publication) > 0;
  }

  function gateReason(lang, publication) {
    const labels = T[lang];
    if (hardBlocked(publication)) return labels.hardBlocked;
    const ageLocked = ageMin(publication) > 0;
    const unreviewed = publication.moderation_status === 'UNREVIEWED';
    if (ageLocked && unreviewed) return labels.combinedBlocked;
    if (ageLocked) return labels.ageBlocked;
    return labels.unreviewedBlocked;
  }

  function titleSpans(lang, title, publication, locked) {
    const safeTitle = publication[`safe_headline_${lang}`] || title;
    return `<span data-gate-safe-title${locked ? '' : ' hidden'}>${esc(safeTitle)}</span><span data-gate-full-title${locked ? ' hidden' : ''}>${esc(title)}</span>`;
  }

  function gateAttrs(publication) {
    return `data-reader-gate data-age-min="${ageMin(publication)}" data-age-rating="${esc(publication.age_rating || 'ALL')}" data-moderation="${esc(publication.moderation_status || '')}" data-publication-mode="${esc(publication.publication_mode || '')}" data-hard-blocked="${hardBlocked(publication) ? 'true' : 'false'}"`;
  }

  function gateNotice(lang, publication, locked) {
    const descriptors = publication.content_descriptors || [];
    let detail = `${T[lang].age}: ${publication.age_rating || 'ALL'}`;
    if (descriptors.length) detail += ' · ' + descriptors.join(', ');
    const button = hardBlocked(publication) ? '' : `<button class="gate-reveal" type="button" data-gate-reveal>${esc(T[lang].reveal)}</button>`;
    return `<div class="restriction-box" data-gate-notice${locked ? '' : ' hidden'}><p class="restriction-reason" data-gate-reason>${esc(gateReason(lang, publication))}</p><p class="restriction-detail">${esc(detail)}</p>${button}</div>`;
  }

  function moderationBadge(lang, publication) {
    if (publication.moderation_status === 'APPROVED') return '';
    const text = publication.moderation_status === 'UNREVIEWED' ? T[lang].unreviewed : T[lang].reviewRequired;
    return `<span class="moderation-pill">${esc(text)}</span>`;
  }

  function card(data, r) {
    const labels = T[r.lang];
    const meta = data.meta;
    const publication = data.publication;
    const category = categoryLabel(meta.category, r.lang);
    const status = display(STATUS, meta.status, r.lang, false);
    const band = display(BAND, meta.confidence_band, r.lang, false);
    const url = `${BASE}${r.lang}/news/${data.slug}/`;
    const locked = initiallyLocked(publication);
    const summaryHtml = hardBlocked(publication) ? '' : `<p>${esc(data.summary)}</p><a class="text-link" href="${url}">${labels.read} →</a>`;
    return `<article class="story-card${locked ? ' is-restricted' : ''}" ${gateAttrs(publication)}><div class="story-meta"><a class="category-pill" href="${BASE}${r.lang}/category/${esc(meta.category)}/">${esc(category)}</a><span class="status-pill">${esc(status)}</span><span class="confidence-pill"><strong>${esc(meta.confidence_score)}/100</strong>&nbsp;·&nbsp;${esc(band)}</span><span class="age-pill">${esc(publication.age_rating || 'ALL')}</span>${moderationBadge(r.lang, publication)}</div><h2><a href="${url}">${titleSpans(r.lang, data.title, publication, locked)}</a></h2>${gateNotice(r.lang, publication, locked)}<div data-gate-content${locked ? ' hidden' : ''}>${summaryHtml}</div></article>`;
  }

  function gatedPageBody(lang, title, content, publication) {
    const locked = initiallyLocked(publication);
    const visibleContent = hardBlocked(publication) ? '' : content;
    return `<section class="reader-gate-page${locked ? ' is-restricted' : ''}" ${gateAttrs(publication)}><h1 class="reader-title">${titleSpans(lang, title, publication, locked)}</h1>${gateNotice(lang, publication, locked)}<div data-gate-content${locked ? ' hidden' : ''}>${visibleContent}</div></section>`;
  }

  async function docs(lang) {
    return Promise.all(STORIES.map(async (slug) => {
      const [doc, publication] = await Promise.all([load(slug, 'article', lang), loadPublication(slug)]);
      return {slug, ...doc, ...titleSummary(doc.body), publication};
    }));
  }

  async function home(r) {
    const labels = T[r.lang];
    const items = await docs(r.lang);
    const cards = items.map((item) => card(item, r)).join('');
    frame(r, `<section class="hero"><p class="eyebrow">VeriNews V0.1 · M5B.5 preview</p><h1>${esc(labels.tag)}</h1><p>${esc(labels.method)}</p></section><section class="story-list"><h2>${esc(labels.latest)}</h2>${cards}</section>`);
  }

  async function category(r) {
    const labels = T[r.lang];
    const label = categoryLabel(r.category, r.lang);
    const items = (await docs(r.lang)).filter((item) => item.meta.category === r.category);
    const cards = items.map((item) => card(item, r)).join('');
    const empty = items.length ? '' : `<p class="empty-state">${esc(labels.empty)}</p>`;
    frame(r, `<section class="category-hero"><p class="eyebrow">${esc(labels.tag)}</p><h1>${esc(label)}</h1></section><section class="story-list">${cards}${empty}</section>`, label);
  }

  async function story(r) {
    const kind = r.analysis ? 'analysis' : 'article';
    const [doc, publication] = await Promise.all([load(r.slug, kind, r.lang), loadPublication(r.slug)]);
    const titleInfo = titleSummary(doc.body);
    let displayBody = r.analysis ? doc.body : doc.body.replace(/\n##\s+(?:Pełna analiza|Full analysis)\s*\n[\s\S]*$/i, '');
    displayBody = withoutFirstH1(displayBody);
    let content = evidence(doc.meta, r.lang, r.analysis) + `<article class="prose ${r.analysis ? 'analysis-prose' : 'reader-prose'}">${markdown(displayBody)}</article>`;
    if (!r.analysis) content += `<p class="analysis-cta"><a href="${BASE}${r.lang}/news/${r.slug}/analysis/">${T[r.lang].analysis} →</a></p>`;
    const title = (r.analysis ? (r.lang === 'pl' ? 'Analiza: ' : 'Analysis: ') : '') + titleInfo.title;
    frame(r, gatedPageBody(r.lang, title, content, publication), title);
  }

  async function main() {
    const r = route();
    if (r.redirect) {
      location.replace(BASE + 'pl/');
      return;
    }
    try {
      if (r.kind === 'category') await category(r);
      else if (r.slug) await story(r);
      else await home(r);
    } catch (error) {
      frame(r, `<section class="hero"><h1>${esc(T[r.lang].error)}</h1><p>${esc(String(error))}</p></section>`, 'VeriNews');
    }
  }

  main();
})();
