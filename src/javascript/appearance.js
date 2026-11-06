(() => {
  const root = document.documentElement;
  const systemTheme = matchMedia('(prefers-color-scheme: dark)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const save = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
  let theme = read('portfolio-theme');
  if (!['light', 'dark'].includes(theme)) theme = null;
  root.dataset.theme = theme || (systemTheme.matches ? 'dark' : 'light');
  systemTheme.addEventListener('change', () => {
    if (!theme) root.dataset.theme = systemTheme.matches ? 'dark' : 'light';
  });

  document.addEventListener('DOMContentLoaded', () => {
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('appearance-ready')));
    const icons = {
      globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>'
    };
    const setIcon = (button, icon, label) => {
      button.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[icon]}</svg>`;
      button.setAttribute('aria-label', label);
      button.title = label;
    };
    const themeButton = document.querySelector('[data-theme-toggle]');
    const updateThemeButton = () => {
      const dark = root.dataset.theme === 'dark';
      const label = dark ? 'Switch to light mode' : 'Switch to dark mode';
      themeButton.setAttribute('aria-label', label);
      themeButton.title = label;
    };
    updateThemeButton();
    systemTheme.addEventListener('change', updateThemeButton);
    themeButton.addEventListener('click', () => {
      const applyTheme = () => {
        theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
        root.dataset.theme = theme;
        save('portfolio-theme', theme);
        updateThemeButton();
      };
      if (document.startViewTransition && !reducedMotion.matches) {
        const transition = document.startViewTransition(applyTheme);
        // Snapshot creation can be skipped when the tab is hidden or a transition overlaps.
        transition.ready.catch(() => {});
      } else {
        applyTheme();
      }
    });

    const globeButton = document.querySelector('[data-globe-toggle]');
    if (!globeButton) return;
    let enabled = read('portfolio-globe') === 'on';
    let loading;
    let failed = false;
    const globeTip = document.querySelector('#globe-tip');
    let tipSeen = false;
    let hintReady = false;
    let hintTimer;
    let hideTimer;
    const hideTip = () => {
      clearTimeout(hintTimer);
      clearTimeout(hideTimer);
      hintTimer = undefined;
      globeTip.hidden = true;
      globeButton.removeAttribute('aria-describedby');
    };
    const showTip = () => {
      const position = globeButton.getBoundingClientRect();
      if (document.hidden || enabled || failed || tipSeen || position.top < 0 || position.bottom > innerHeight) return;
      globeTip.hidden = false;
      globeButton.setAttribute('aria-describedby', 'globe-tip');
      tipSeen = true;
      hideTimer = setTimeout(hideTip, 8000);
    };
    const scheduleTip = () => {
      if (hintTimer || document.hidden || enabled || failed || tipSeen) return;
      if (hintReady) return showTip();
      hintTimer = setTimeout(() => {
        hintTimer = undefined;
        hintReady = true;
        showTip();
      }, 5000);
    };
    const updateGlobe = () => {
      root.dataset.globe = enabled ? 'on' : 'off';
      globeButton.setAttribute('aria-pressed', String(enabled));
      setIcon(globeButton, 'globe', enabled ? 'Turn globe off' : 'Turn globe on');
      window.dispatchEvent(new Event('globechange'));
      if (enabled && !loading && !failed) {
        loading = import('./webgl-background-script.js').catch(() => {
          failed = true;
          enabled = false;
          root.classList.remove('globe-ready');
          updateGlobe();
          setIcon(globeButton, 'globe', 'Globe unavailable');
          globeButton.disabled = true;
        });
      }
    };
    globeButton.addEventListener('click', () => {
      hideTip();
      tipSeen = true;
      enabled = !enabled;
      save('portfolio-globe', enabled ? 'on' : 'off');
      updateGlobe();
    });
    updateGlobe();
    scheduleTip();
    document.addEventListener('visibilitychange', () => {
      hideTip();
      scheduleTip();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') hideTip();
    });
    document.addEventListener('click', () => {
      if (!globeTip.hidden) hideTip();
    });
    window.addEventListener('scroll', scheduleTip, { passive: true });
    window.addEventListener('headerchange', scheduleTip);
    window.addEventListener('pagehide', hideTip);
    window.addEventListener('pageshow', scheduleTip);
  });
})();
