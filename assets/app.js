(() => {
  'use strict';
  const BASE = location.pathname.startsWith('/VeriNews.Preview/') ? '/VeriNews.Preview/' : '/';
  const STORIES = ['openai-astra-cyber-controls','israel-gaza-15-point-document','eclipse-perseids-poland'];
  const CATEGORIES = [
    {id:'poland',pl:'Polska',en:'Poland'},
    {id:'world',pl:'Świat',en:'World'},
    {id:'ai',pl:'AI',en:'AI'},
    {id:'technology',pl:'Technologia',en:'Technology'},
    {id:'science',pl:'Nauka',en:'Science'},
    {id:'cyber',pl:'Cyber',en:'Cyber'},
    {id:'economy',pl:'Gospodarka',en:'Economy'}
  ];
  const CAT = Object.fromEntries(CATEGORIES.map(c=>[c.id,c]));
  const T = {
    pl:{tag:'Wiadomości z jawną ścieżką weryfikacji.',latest:'Najnowsze analizy',assessment:'Ocena',confidence:'Poziom wiarygodności',status:'Status',updated:'Stan dowodów',read:'Czytaj materiał',analysis:'Pełna analiza',method:'Poziom wiarygodności opisuje pewność bieżącej oceny dowodów, nie procent prawdy.',empty:'W tej kategorii nie ma jeszcze opublikowanych materiałów.',error:'Nie udało się wczytać podglądu.'},
    en:{tag:'News with a visible verification trail.',latest:'Latest analyses',assessment:'Assessment',confidence:'Confidence level',status:'Status',updated:'Evidence state',read:'Read story',analysis:'Full analysis',method:'Confidence describes certainty in the current evidence assessment, not a percentage of truth.',empty:'There are no published stories in this category yet.',error:'The preview could not be loaded.'}
  };
  const ASSESSMENT = {
    pl:{PENDING:'OCZEKUJE',SUPPORTED:'POTWIERDZONE',PARTIALLY_SUPPORTED:'CZĘŚCIOWO POTWIERDZONE',INSUFFICIENT_EVIDENCE:'NIEWYSTARCZAJĄCE DOWODY',DISPUTED:'SPORNE',CONTRADICTED:'OBALONE',NOT_YET_VERIFIABLE:'JESZCZE NIEWERYFIKOWALNE'},
    en:{PENDING:'Pending',SUPPORTED:'Supported',PARTIALLY_SUPPORTED:'Partly supported',INSUFFICIENT_EVIDENCE:'Insufficient evidence',DISPUTED:'Disputed',CONTRADICTED:'Contradicted',NOT_YET_VERIFIABLE:'Not yet verifiable'}
  };
  const STATUS = {
    pl:{DISCOVERED:'ODKRYTE',ANALYZING:'W ANALIZIE',PROVISIONAL:'WSTĘPNA OCENA',VERIFIED:'ZWERYFIKOWANE',DISPUTED:'SPORNE',OUTDATED:'NIEAKTUALNE',RETRACTED:'WYCOFANE'},
    en:{DISCOVERED:'Discovered',ANALYZING:'Analyzing',PROVISIONAL:'Provisional',VERIFIED:'Verified',DISPUTED:'Disputed',OUTDATED:'Outdated',RETRACTED:'Retracted'}
  };
  const BAND = {
    pl:{LOW:'NISKA',LIMITED:'OGRANICZONA',MODERATE:'UMIARKOWANA',HIGH:'WYSOKA',VERY_HIGH:'BARDZO WYSOKA'},
    en:{LOW:'Low',LIMITED:'Limited',MODERATE:'Moderate',HIGH:'High',VERY_HIGH:'Very high'}
  };
  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function safeHref(raw){
    const s=String(raw||'').trim();
    if (/^(\.\.\/|\.\/|\/|#)/.test(s)) return esc(s);
    try { const u=new URL(s,location.href); return ['http:','https:','mailto:'].includes(u.protocol) ? esc(s) : '#'; }
    catch { return '#'; }
  }
  function inline(s){
    let x=esc(s);
    x=x.replace(/`([^`]+)`/g,'<code>$1</code>');
    x=x.replace(/\[([^\]]+)\]\(([^)]+)\)/g,(_,label,url)=>`<a href="${safeHref(url)}">${label}</a>`);
    x=x.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
    return x;
  }
  function cells(line){ return line.trim().replace(/^\||\|$/g,'').split('|').map(x=>x.trim()); }
  function markdown(md){
    const lines=md.split(/\r?\n/); const out=[]; let i=0, inCode=false, code=[];
    while(i<lines.length){
      const line=lines[i], s=line.trim();
      if(s.startsWith('```')){ if(inCode){ out.push('<pre><code>'+esc(code.join('\n'))+'</code></pre>'); code=[]; } inCode=!inCode; i++; continue; }
      if(inCode){ code.push(line); i++; continue; }
      if(!s){ i++; continue; }
      if(line.includes('|') && i+1<lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i+1])){
        const head=cells(line); i+=2; const rows=[];
        while(i<lines.length && lines[i].trim() && lines[i].includes('|')){ rows.push(cells(lines[i])); i++; }
        out.push('<div class="table-wrap"><table><thead><tr>'+head.map(x=>`<th>${inline(x)}</th>`).join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(x=>`<td>${inline(x)}</td>`).join('')+'</tr>').join('')+'</tbody></table></div>'); continue;
      }
      const h=line.match(/^(#{1,6})\s+(.+)$/); if(h){ const n=h[1].length; out.push(`<h${n}>${inline(h[2])}</h${n}>`); i++; continue; }
      if(/^\s*-\s+/.test(line)){ const items=[]; while(i<lines.length && /^\s*-\s+/.test(lines[i])){ items.push(lines[i].replace(/^\s*-\s+/,'').trim()); i++; } out.push('<ul>'+items.map(x=>`<li>${inline(x)}</li>`).join('')+'</ul>'); continue; }
      const p=[s]; i++; while(i<lines.length){ const n=lines[i].trim(); if(!n || n.startsWith('#') || n.startsWith('```') || /^-\s+/.test(n)) break; if(lines[i].includes('|') && i+1<lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i+1])) break; p.push(n); i++; }
      out.push('<p>'+inline(p.join(' '))+'</p>');
    }
    if(inCode) out.push('<pre><code>'+esc(code.join('\n'))+'</code></pre>');
    return out.join('\n');
  }
  function parseDoc(text){
    const m=text.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/); if(!m) throw new Error('frontmatter');
    const meta={}; m[1].split(/\r?\n/).forEach(line=>{ const p=line.indexOf(':'); if(p>0){ let v=line.slice(p+1).trim().replace(/^['"]|['"]$/g,''); if(/^\d+$/.test(v)) v=Number(v); meta[line.slice(0,p).trim()]=v; }});
    return {meta,body:m[2]};
  }
  function titleSummary(body){
    const title=(body.match(/^#\s+(.+)$/m)||[])[1]||'VeriNews';
    const brief=body.match(/^##\s+(?:W skrócie|In brief)\s*$\n+([^\n#]+)/mi);
    const summary=(brief?.[1]||'').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/\*\*|`/g,'').trim();
    return {title,summary};
  }
  function source(slug,kind,lang){ return `${BASE}content/2026/08/10/${slug}/${kind}.${lang}.md`; }
  async function load(slug,kind,lang){ const r=await fetch(source(slug,kind,lang),{cache:'no-store'}); if(!r.ok) throw new Error(`${r.status}`); return parseDoc(await r.text()); }
  function route(){
    const rel=location.pathname.startsWith(BASE)?location.pathname.slice(BASE.length):location.pathname.replace(/^\//,'');
    const a=rel.split('/').filter(Boolean); if(!a.length) return {redirect:true};
    const lang=['pl','en'].includes(a[0])?a[0]:'pl';
    if(a[1]==='category' && CAT[a[2]]) return {lang,category:a[2],kind:'category'};
    if(a[1]==='news' && STORIES.includes(a[2])) return {lang,slug:a[2],analysis:a[3]==='analysis',kind:a[3]==='analysis'?'analysis':'article'};
    return {lang,kind:'home'};
  }
  function paired(r){
    const o=r.lang==='pl'?'en':'pl';
    if(r.category) return `${BASE}${o}/category/${r.category}/`;
    if(r.slug) return `${BASE}${o}/news/${r.slug}/${r.analysis?'analysis/':''}`;
    return `${BASE}${o}/`;
  }
  function categoryLabel(id,lang){ return CAT[id]?.[lang] || id; }
  function categoryNav(r){
    const latest=r.kind==='home'?' active':'';
    const links=[`<a class="${latest.trim()}" href="${BASE}${r.lang}/">${r.lang==='pl'?'Najnowsze':'Latest'}</a>`];
    for(const c of CATEGORIES){
      const active=r.category===c.id?' active':'';
      links.push(`<a class="${active.trim()}" href="${BASE}${r.lang}/category/${c.id}/">${esc(c[r.lang])}</a>`);
    }
    return `<div class="category-strip"><nav class="category-nav" aria-label="Categories">${links.join('')}</nav></div>`;
  }
  function frame(r,body,title='VeriNews'){
    const x=T[r.lang], other=r.lang==='pl'?'EN':'PL'; document.title=`${title} · VeriNews`;
    document.body.className=`${r.kind||'home'}-page`;
    document.body.innerHTML=`<header class="site-header"><div class="header-inner"><a class="brand" href="${BASE}${r.lang}/">VeriNews</a><nav class="language" aria-label="Language"><span class="active">${r.lang.toUpperCase()}</span><span>/</span><a href="${paired(r)}">${other}</a></nav></div>${categoryNav(r)}</header><main class="shell">${body}</main><footer class="site-footer"><p>${esc(x.method)}</p><p>M4 preview · Git-backed · methodology 1.0</p></footer>`;
  }
  function display(table,value,lang,technical){ return technical ? String(value) : (table[lang]?.[value] || String(value)); }
  function evidence(meta,lang,technical=false){
    const x=T[lang], a=display(ASSESSMENT,meta.overall_assessment,lang,technical), s=display(STATUS,meta.status,lang,technical), b=display(BAND,meta.confidence_band,lang,technical);
    return `<section class="evidence-bar" aria-label="Evidence summary"><div><span>${x.assessment}</span><strong>${esc(a)}</strong></div><div><span>${x.confidence}</span><strong>${esc(meta.confidence_score)}/100 · ${esc(b)}</strong></div><div><span>${x.status}</span><strong>${esc(s)}</strong></div><div><span>${x.updated}</span><strong>${esc(meta.updated_at)}</strong></div></section>`;
  }
  function card(d,r){
    const x=T[r.lang], m=d.meta, cat=categoryLabel(m.category,r.lang), status=display(STATUS,m.status,r.lang,false), band=display(BAND,m.confidence_band,r.lang,false), u=`${BASE}${r.lang}/news/${d.slug}/`;
    return `<article class="story-card"><div class="story-meta"><a class="category-pill" href="${BASE}${r.lang}/category/${esc(m.category)}/">${esc(cat)}</a><span class="status-pill">${esc(status)}</span><span class="confidence-pill"><strong>${esc(m.confidence_score)}/100</strong>&nbsp;·&nbsp;${esc(band)}</span></div><h2><a href="${u}">${esc(d.title)}</a></h2><p>${esc(d.summary)}</p><a class="text-link" href="${u}">${x.read} →</a></article>`;
  }
  async function docs(lang){ return Promise.all(STORIES.map(s=>load(s,'article',lang).then(d=>({slug:s,...d,...titleSummary(d.body)})))); }
  async function home(r){
    const x=T[r.lang], items=await docs(r.lang), cards=items.map(d=>card(d,r)).join('');
    frame(r,`<section class="hero"><p class="eyebrow">VeriNews V0.1 · M4 preview</p><h1>${esc(x.tag)}</h1><p>${esc(x.method)}</p></section><section class="story-list"><h2>${esc(x.latest)}</h2>${cards}</section>`);
  }
  async function category(r){
    const x=T[r.lang], label=categoryLabel(r.category,r.lang), items=(await docs(r.lang)).filter(d=>d.meta.category===r.category), cards=items.map(d=>card(d,r)).join(''), empty=items.length?'':`<p class="empty-state">${esc(x.empty)}</p>`;
    frame(r,`<section class="category-hero"><p class="eyebrow">${esc(x.tag)}</p><h1>${esc(label)}</h1></section><section class="story-list">${cards}${empty}</section>`,label);
  }
  async function story(r){
    const kind=r.analysis?'analysis':'article', d=await load(r.slug,kind,r.lang), ts=titleSummary(d.body);
    const displayBody=r.analysis?d.body:d.body.replace(/\n##\s+(?:Pełna analiza|Full analysis)\s*\n[\s\S]*$/i,'');
    let body=evidence(d.meta,r.lang,r.analysis)+`<article class="prose ${r.analysis?'analysis-prose':'reader-prose'}">${markdown(displayBody)}</article>`;
    if(!r.analysis) body+=`<p class="analysis-cta"><a href="${BASE}${r.lang}/news/${r.slug}/analysis/">${T[r.lang].analysis} →</a></p>`;
    frame(r,body,(r.analysis?(r.lang==='pl'?'Analiza: ':'Analysis: '):'')+ts.title);
  }
  async function main(){
    const r=route(); if(r.redirect){ location.replace(BASE+'pl/'); return; }
    try { if(r.kind==='category') await category(r); else if(r.slug) await story(r); else await home(r); }
    catch(e){ frame(r,`<section class="hero"><h1>${esc(T[r.lang].error)}</h1><p>${esc(String(e))}</p></section>`,'VeriNews'); }
  }
  main();
})();
