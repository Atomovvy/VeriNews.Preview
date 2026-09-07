(() => {
  const body = document.body;
  const stored = (() => {
    try {
      return localStorage.getItem('verinews-theme');
    } catch (_) {
      return null;
    }
  })();
  const dark = stored ? stored === 'dark' : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  body.dataset.theme = dark ? 'dark' : 'light';
})();
