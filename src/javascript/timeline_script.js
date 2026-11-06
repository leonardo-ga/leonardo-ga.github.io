const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');

document.querySelectorAll('.timeline-progress').forEach(progressLine => {
  const container = progressLine.parentElement;
  const items = [...container.querySelectorAll('.timeline-item')];
  let revealedIndex = -1;
  let observer;

  const updateLine = () => {
    const item = items[revealedIndex];
    const height = item ? Math.min(item.offsetTop + item.offsetHeight - 8, container.clientHeight - 8) : 0;
    progressLine.style.height = `${Math.max(0, height)}px`;
  };
  const reveal = (item, index) => {
    item.classList.remove('reveal-pending');
    revealedIndex = Math.max(revealedIndex, index);
    updateLine();
    observer?.unobserve(item);
  };
  const revealAll = () => {
    observer?.disconnect();
    items.forEach(reveal);
  };

  if (motionPreference.matches || !('IntersectionObserver' in window)) {
    revealAll();
  } else {
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) reveal(entry.target, items.indexOf(entry.target));
      });
    }, { rootMargin: '0px 0px -15% 0px', threshold: 0 });

    let visibleOrder = 0;
    items.forEach((item, index) => {
      item.classList.add('scroll-reveal', 'reveal-pending');
      const rect = item.getBoundingClientRect();
      if (rect.top < innerHeight * 0.85 && rect.bottom > 0) {
        item.style.setProperty('--reveal-delay', `${0.4 + visibleOrder++ * 0.12}s`);
        requestAnimationFrame(() => requestAnimationFrame(() => reveal(item, index)));
      } else {
        observer.observe(item);
      }
      item.addEventListener('focusin', () => {
        item.style.setProperty('--reveal-delay', '0s');
        reveal(item, index);
      });
    });
  }

  motionPreference.addEventListener('change', event => {
    if (event.matches) revealAll();
  });
  if ('ResizeObserver' in window) new ResizeObserver(updateLine).observe(container);
  else window.addEventListener('resize', updateLine);
  document.fonts?.ready.then(updateLine);
});
