const header = document.querySelector('.site-topbar');
const navigation = header.querySelector('.career-nav');
const appearance = header.querySelector('.appearance-controls');

// Move the existing controls, preserving theme/globe state and their event handlers.
const placeholder = document.createElement('div');
placeholder.className = 'appearance-placeholder';
placeholder.hidden = true;
placeholder.setAttribute('aria-hidden', 'true');
appearance.after(placeholder);

const corner = document.createElement('div');
corner.className = 'corner-controls';
corner.inert = true;
corner.setAttribute('aria-hidden', 'true');
const menuButton = document.createElement('button');
menuButton.className = 'corner-menu-toggle';
menuButton.type = 'button';
menuButton.setAttribute('aria-label', 'Open navigation');
menuButton.setAttribute('aria-expanded', 'false');
menuButton.setAttribute('aria-controls', 'corner-navigation');
menuButton.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
const menu = document.createElement('nav');
menu.id = 'corner-navigation';
menu.className = 'corner-navigation';
menu.hidden = true;
menu.setAttribute('aria-label', 'Compact navigation');
navigation.querySelectorAll('a').forEach(link => {
  const copy = link.cloneNode(true);
  copy.removeAttribute('data-home');
  menu.append(copy);
});
corner.append(menuButton, menu);
document.body.append(corner);

function closeMenu(restoreFocus = false) {
  menu.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open navigation');
  if (restoreFocus) menuButton.focus({ preventScroll: true });
}
menuButton.addEventListener('click', () => {
  if (!menu.hidden) return closeMenu();
  menu.hidden = false;
  menuButton.setAttribute('aria-expanded', 'true');
  menuButton.setAttribute('aria-label', 'Close navigation');
  menu.querySelector('a').focus({ preventScroll: true });
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !menu.hidden) closeMenu(true);
});
document.addEventListener('click', event => {
  if (!menu.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
});
corner.addEventListener('focusout', event => {
  if (!corner.contains(event.relatedTarget)) closeMenu();
});

let compact = false;
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let generation = 0;
let animations = [];
let ghosts = [];
let animatedButtons = [];
let targets = [];

function moveControls(toCorner) {
  if (toCorner) {
    placeholder.hidden = false;
    corner.insertBefore(appearance, menu);
  } else {
    placeholder.before(appearance);
    placeholder.hidden = true;
  }
}
function setHeaderState(inCorner) {
  navigation.inert = inCorner;
  navigation.setAttribute('aria-hidden', String(inCorner));
  header.classList.toggle('has-corner-controls', inCorner);
  corner.classList.toggle('is-visible', inCorner);
  corner.setAttribute('aria-hidden', String(!inCorner));
  corner.inert = !inCorner;
}
function clearAnimation() {
  generation++;
  animations.forEach(animation => animation.cancel());
  animations = [];
  ghosts.forEach(ghost => ghost.remove());
  ghosts = [];
  corner.classList.remove('is-arranging');
}
function settle() {
  clearAnimation();
  moveControls(compact);
  setHeaderState(compact);
  window.dispatchEvent(new Event('headerchange'));
}

const relative = (from, to) => `translate(${from.left - to.left}px, ${from.top - to.top}px)`;
function sourceGeometry() {
  const links = [...navigation.querySelectorAll('a')].map(link => ({ link, rect: link.getBoundingClientRect() }));
  const slot = placeholder.hidden ? appearance.getBoundingClientRect() : placeholder.getBoundingClientRect();
  const buttons = new Map([...appearance.querySelectorAll('button')].map(button => [button, {
    left: slot.left + (button.hasAttribute('data-theme-toggle') ? 46 : 0),
    top: slot.top
  }]));
  return { links, buttons };
}
function frameSpecs(source) {
  const row = targets.map((rect, index) => ({ left: targets[0].left - (animatedButtons.length - 1 - index) * 46, top: targets[0].top }));
  const lastLink = source.links[source.links.length - 1].rect;
  const collapse = { left: Math.min(lastLink.right + 8, row[0].left), top: targets[0].top };
  const words = source.links.map(({ link, rect }, index) => {
    const ghost = ghosts[index];
    Object.assign(ghost.style, {
      left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`,
      font: getComputedStyle(link).font, color: getComputedStyle(link).color
    });
    const collapsed = { opacity: 0, transform: `translate(${collapse.left + 19 - rect.left - rect.width / 2}px, ${collapse.top - rect.top}px) scale(0.1)`, filter: 'blur(3px)' };
    return [
      { offset: 0, opacity: 1, transform: 'translate(0, 0) scale(1)', filter: 'blur(0)' },
      { offset: 0.3, ...collapsed },
      { offset: 1, ...collapsed }
    ];
  });
  const controls = animatedButtons.map((button, index) => {
    const from = index === 0 ? collapse : source.buttons.get(button);
    return [
      { offset: 0, transform: relative(from, targets[index]), opacity: index === 0 ? 0 : 1 },
      { offset: 0.3, transform: relative(from, targets[index]), opacity: 1 },
      { offset: 0.65, transform: relative(row[index], targets[index]), opacity: 1 },
      { offset: 1, transform: 'translate(0, 0)', opacity: 1 }
    ];
  });
  return [...words, ...controls];
}
function runHandoff(source, restoreFocus) {
  const id = ++generation;
  corner.classList.add('is-arranging');
  corner.inert = true;
  if (!animations.length) {
    moveControls(true);
    setHeaderState(true);
    corner.inert = true;
    // Disable the page-entry puff permanently after the first handoff.
    appearance.classList.add('has-handed-off');
    animatedButtons = [menuButton, ...appearance.querySelectorAll('[data-globe-toggle]'), ...appearance.querySelectorAll('[data-theme-toggle]')];
    targets = animatedButtons.map(button => button.getBoundingClientRect());
    ghosts = source.links.map(({ link }) => {
      const ghost = document.createElement('span');
      ghost.className = 'nav-word-ghost';
      ghost.textContent = link.textContent;
      ghost.setAttribute('aria-hidden', 'true');
      document.body.append(ghost);
      return ghost;
    });
    const elements = [...ghosts, ...animatedButtons];
    animations = frameSpecs(source).map((frames, index) => elements[index].animate(frames, {
      duration: 620, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'both'
    }));
  } else {
    const specs = frameSpecs(source);
    animations.forEach((animation, index) => {
      animation.effect.setKeyframes(specs[index]);
      if ((animation.playbackRate > 0) !== compact) animation.reverse();
    });
  }
  Promise.all(animations.map(animation => animation.finished.catch(() => {}))).then(() => {
    if (id !== generation) return;
    if (compact) {
      corner.classList.remove('is-arranging');
      corner.inert = false;
      // Hold the final frames so scrolling back can play the same timeline in reverse.
    } else {
      settle();
    }
    restoreFocus?.focus({ preventScroll: true });
    window.dispatchEvent(new Event('headerchange'));
  });
}

function syncHeader() {
  const rect = header.getBoundingClientRect();
  const next = rect.top < -4;
  if (next === compact) return;
  const focusedControl = appearance.contains(document.activeElement) ? document.activeElement : null;
  const focusedNavigation = navigation.contains(document.activeElement);
  const focusedCorner = corner.contains(document.activeElement);
  const source = sourceGeometry();
  compact = next;
  closeMenu();
  const focusTarget = focusedControl || (compact && focusedNavigation ? menuButton : !compact && focusedCorner ? navigation.querySelector('[aria-current="page"]') : null);
  const animate = !motionPreference.matches && typeof menuButton.animate === 'function' && (animations.length || (compact && rect.bottom > 0));
  if (animate) runHandoff(source, focusTarget);
  else {
    settle();
    focusTarget?.focus({ preventScroll: true });
  }
}
if ('IntersectionObserver' in window) {
  new IntersectionObserver(syncHeader, { threshold: [0, 0.9, 1] }).observe(header);
} else {
  window.addEventListener('scroll', syncHeader, { passive: true });
}
window.addEventListener('resize', () => { settle(); syncHeader(); });
window.addEventListener('pagehide', settle);
motionPreference.addEventListener('change', settle);
window.addEventListener('pageshow', syncHeader);
syncHeader();
