const portraits = [...document.querySelectorAll('[data-motion-src]')];

if (portraits.length && 'IntersectionObserver' in window) {
  const motion = matchMedia('(prefers-reduced-motion: no-preference)');
  const stills = new Map(portraits.map((portrait) => [portrait, portrait.getAttribute('src')]));
  const visible = new Set();
  let timer = 0;

  const show = (portrait, animated) => {
    const src = animated ? portrait.dataset.motionSrc : stills.get(portrait);
    if (portrait.getAttribute('src') !== src) portrait.src = src;
  };

  const schedule = () => {
    clearTimeout(timer);
    timer = 0;
    if (!motion.matches || document.hidden || !visible.size) return;
    timer = setTimeout(() => {
      timer = 0;
      visible.forEach((portrait) => show(portrait, true));
    }, 160);
  };

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
        visible.add(entry.target);
      } else {
        visible.delete(entry.target);
        show(entry.target, false);
      }
    }
    schedule();
  }, { threshold: 0.2 });

  const sync = () => {
    if (!motion.matches || document.hidden) visible.forEach((portrait) => show(portrait, false));
    schedule();
  };

  window.addEventListener('scroll', () => {
    if (timer) schedule();
  }, { passive: true });
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
  portraits.forEach((portrait) => observer.observe(portrait));
}
