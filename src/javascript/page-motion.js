// Preserve full-page navigation while animating the name and surrounding content.
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const name = document.querySelector('.shared-name');
const storageKey = 'portfolio-name-transition';
const contentSelector = '.career-page main, .career-header > p, .career-home .career-choices, .landing-header > p';
const surfaces = [...document.querySelectorAll(contentSelector)];
const siteRoot = new URL(document.querySelector('[data-home]').href);
const pagePaths = new Set(['', 'mathematics/', 'software/'].map(page => new URL(page, siteRoot).pathname));
let navigating = false;

function animateContent(entering) {
  return surfaces.map(element => {
    const animation = element.animate(entering ? [
      { opacity: 0, translate: '0 8px' },
      { opacity: 1, translate: '0 0' }
    ] : [
      { opacity: 1, translate: '0 0' },
      { opacity: 0, translate: '0 -4px' }
    ], {
      duration: entering ? 380 : 160,
      delay: entering ? 70 : 0,
      easing: entering ? 'cubic-bezier(0.2, 0.65, 0.3, 1)' : 'ease-out',
      fill: 'both'
    });
    if (entering) animation.finished.then(() => animation.cancel(), () => {});
    return animation.finished.catch(() => {});
  });
}

let previous;
try {
  previous = JSON.parse(sessionStorage.getItem(storageKey));
  sessionStorage.removeItem(storageKey);
} catch {}

if (name && !motionPreference.matches && typeof name.animate === 'function') {
  if (previous?.destination === location.pathname && Date.now() - previous.time >= 0 && Date.now() - previous.time < 10000) {
    animateContent(true);
    const rect = name.getBoundingClientRect();
    const values = [previous.left, previous.top, previous.width, previous.height];
    if (values.every(Number.isFinite) && previous.width > 0 && previous.height > 0 &&
      previous.top + previous.height > 0 && previous.top < innerHeight && rect.width > 0 && rect.height > 0) {
      const dx = previous.left - rect.left;
      const dy = previous.top - rect.top;
      name.style.willChange = 'transform';
      const animation = name.animate([
        { transform: `translate(${dx}px, ${dy}px) scale(${previous.width / rect.width}, ${previous.height / rect.height})` },
        { transform: 'translate(0, 0) scale(1)' }
      ], {
        duration: 520,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'both'
      });
      const cleanup = () => {
        animation.cancel();
        name.style.willChange = '';
      };
      animation.finished.then(cleanup, cleanup);
    }
  }

  document.addEventListener('click', event => {
    if (motionPreference.matches || event.defaultPrevented || event.button !== 0 ||
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const destination = new URL(link.href, location.href);
    if (destination.origin !== location.origin || destination.pathname === location.pathname ||
      !pagePaths.has(destination.pathname)) return;
    event.preventDefault();
    if (navigating) return;
    navigating = true;
    const rect = name.getBoundingClientRect();
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({
        destination: destination.pathname,
        time: Date.now(),
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      }));
    } catch {}
    try {
      Promise.all(animateContent(false)).then(() => location.assign(destination.href));
    } catch {
      location.assign(destination.href);
    }
  });
}

// The animation's first frame is installed before revealing the name.
delete document.documentElement.dataset.namePending;

// A restored back/forward-cache document must not retain its exit fade.
window.addEventListener('pageshow', event => {
  if (!event.persisted) return;
  navigating = false;
  surfaces.forEach(element => element.getAnimations().forEach(animation => animation.cancel()));
  name?.getAnimations().forEach(animation => animation.cancel());
  delete document.documentElement.dataset.namePending;
});
