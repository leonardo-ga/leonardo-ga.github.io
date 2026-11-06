// Preserve full-page navigation while animating the name and surrounding content.
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const name = document.querySelector('.shared-name');
const storageKey = 'portfolio-name-transition';
const contentSelector = '.career-page main, .career-header > p, .career-home .career-choices, .landing-header > p';
const surfaces = [...document.querySelectorAll(contentSelector)];
const globeButton = document.querySelector('[data-globe-toggle]');
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

function puffGlobeOut() {
  if (!globeButton || motionPreference.matches) return Promise.resolve();
  return globeButton.animate([
    { opacity: 1, transform: 'scale(1)', filter: 'blur(0)' },
    { opacity: 0, transform: 'scale(1.45)', filter: 'blur(4px)' }
  ], { duration: 180, easing: 'ease-out', fill: 'forwards' }).finished.catch(() => {});
}

let previous;
try {
  previous = JSON.parse(sessionStorage.getItem(storageKey));
  sessionStorage.removeItem(storageKey);
} catch {}

const arriving = previous?.destination === location.pathname &&
  Date.now() - previous.time >= 0 && Date.now() - previous.time < 10000;
const navigation = document.querySelector('.career-nav');
const activeLink = navigation.querySelector('[aria-current="page"]');
const indicator = document.createElement('span');
indicator.className = 'nav-indicator';
indicator.setAttribute('aria-hidden', 'true');
navigation.prepend(indicator);

function positionIndicator() {
  const navRect = navigation.getBoundingClientRect();
  const rect = activeLink.getBoundingClientRect();
  Object.assign(indicator.style, {
    left: `${rect.left - navRect.left}px`,
    top: `${rect.top - navRect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`
  });
  return rect;
}
const activeRect = positionIndicator();
navigation.classList.add('has-indicator');
if (arriving && previous.navigation && activeRect.width > 0 && activeRect.height > 0 &&
  !motionPreference.matches && typeof indicator.animate === 'function') {
  const from = previous.navigation;
  if ([from.left, from.top, from.width, from.height].every(Number.isFinite) && from.width > 0 && from.height > 0) {
    indicator.animate([
      { transform: `translate(${from.left - activeRect.left}px, ${from.top - activeRect.top}px) scale(${from.width / activeRect.width}, ${from.height / activeRect.height})` },
      { transform: 'translate(0, 0) scale(1)' }
    ], { duration: 420, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' });
  }
}
if ('ResizeObserver' in window) new ResizeObserver(positionIndicator).observe(navigation);
else window.addEventListener('resize', positionIndicator);
document.fonts?.ready.then(positionIndicator);

if (name && !motionPreference.matches && typeof name.animate === 'function') {
  if (arriving) {
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
    const navRect = activeLink.getBoundingClientRect();
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({
        destination: destination.pathname,
        time: Date.now(),
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        navigation: navRect.top >= 0 && navRect.bottom <= innerHeight ? {
          left: navRect.left, top: navRect.top, width: navRect.width, height: navRect.height
        } : null
      }));
    } catch {}
    try {
      Promise.all([...animateContent(false), puffGlobeOut()]).then(() => location.assign(destination.href));
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
  indicator.getAnimations().forEach(animation => animation.cancel());
  globeButton?.getAnimations().forEach(animation => animation.cancel());
  positionIndicator();
  delete document.documentElement.dataset.namePending;
});
