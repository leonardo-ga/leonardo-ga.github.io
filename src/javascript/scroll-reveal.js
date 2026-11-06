const targets = document.querySelectorAll(
  '.career-dev .timeline > h2, .career-dev #projects > h2, .career-dev .project-card'
);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const reveal = element => element.classList.remove('reveal-pending');
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      reveal(entry.target);
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });

  targets.forEach(element => {
    element.classList.add('scroll-reveal');
    // Keep content already visible at page load visible.
    const rect = element.getBoundingClientRect();
    if (rect.top < innerHeight * 0.92 && rect.bottom > 0) return;
    element.classList.add('reveal-pending');
    observer.observe(element);
    element.addEventListener('focusin', () => {
      reveal(element);
      observer.unobserve(element);
    });
  });

  reducedMotion.addEventListener('change', event => {
    if (!event.matches) return;
    observer.disconnect();
    targets.forEach(reveal);
  });
}
