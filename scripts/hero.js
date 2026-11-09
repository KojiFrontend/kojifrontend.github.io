const heroActions = document.querySelector('[data-hero-actions]');
const masthead = document.querySelector('.masthead');
let heroVisible = true;

const syncHeroVisibility = (visible) => {
  heroVisible = visible;
  masthead?.classList.toggle('is-in-view', visible);
  document.dispatchEvent(new Event('hero-visibilitychange'));
};

if (masthead && 'IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => syncHeroVisibility(entry.isIntersecting)).observe(masthead);
} else {
  syncHeroVisibility(true);
}

if (heroActions) {
  const fixedActions = matchMedia('(min-width: 701px)');
  let hidden = null;

  const syncActions = () => {
    const next = fixedActions.matches && window.scrollY > 32;
    if (next === hidden) return;
    hidden = next;
    heroActions.classList.toggle('is-hidden', next);
    heroActions.inert = next;
  };

  window.addEventListener('scroll', syncActions, { passive: true });
  fixedActions.addEventListener('change', syncActions);
  syncActions();
}

const consolePreview = document.querySelector('[data-console]');
const pointerFine = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');

if (consolePreview && masthead) {
  let frame = 0;
  let x = 0;
  let y = 0;

  const trackPointer = (event) => {
    if (!heroVisible || !pointerFine.matches || event.pointerType === 'touch') return;
    x = Math.max(-1, Math.min(1, (2 * event.clientX) / innerWidth - 1));
    y = Math.max(-1, Math.min(1, (2 * event.clientY) / innerHeight - 1));
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      consolePreview.style.setProperty('--console-x', x.toFixed(3));
      consolePreview.style.setProperty('--console-y', y.toFixed(3));
    });
  };

  const resetConsole = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    consolePreview.style.removeProperty('--console-x');
    consolePreview.style.removeProperty('--console-y');
  };

  masthead.addEventListener('pointermove', trackPointer, { passive: true });
  masthead.addEventListener('pointerleave', resetConsole);
  document.addEventListener('hero-visibilitychange', resetConsole);
  window.addEventListener('blur', resetConsole);
  pointerFine.addEventListener('change', resetConsole);
}

const youWord = document.querySelector('.hero__you');

if (youWord) {
  const motion = matchMedia('(prefers-reduced-motion: no-preference)');
  const dwell = 1800;
  const variants = [
    ['is-roboto-condensed', '700 1em "Roboto Condensed"'],
    ['is-redaction', '400 1em "Redaction 50"'],
    ['is-rubik', '600 1em Rubik'],
    ['is-nunito', '800 1em Nunito'],
    ['is-rubik-heavy', '900 1em Rubik'],
    ['is-serif', 'italic 400 1em "Instrument Serif"'],
  ];
  let ready = [];
  let loading;
  let current = 0;
  let timer;

  const show = () => {
    youWord.className = `hero__you ${ready[current]}`;
  };

  const syncRotation = () => {
    clearInterval(timer);
    if (!heroVisible || !motion.matches || document.hidden || ready.length < 2) return;
    timer = setInterval(() => {
      current = (current + 1) % ready.length;
      show();
    }, dwell);
  };

  const prepareRotation = () => {
    if (!motion.matches || loading) return;
    loading = Promise.all(variants.map(async ([variant, font]) => {
      try {
        const faces = await document.fonts.load(font, 'you');
        return faces.length ? variant : null;
      } catch {
        return null;
      }
    })).then((loaded) => {
      ready = loaded.filter(Boolean);
      if (motion.matches && ready.length > 1) show();
      syncRotation();
    });
  };

  motion.addEventListener('change', () => {
    prepareRotation();
    syncRotation();
  });
  document.addEventListener('visibilitychange', syncRotation);
  document.addEventListener('hero-visibilitychange', syncRotation);
  prepareRotation();
}

const floaters = [...document.querySelectorAll('.masthead__floaters img')];

floaters.forEach((img) => {
  const rand = (min, max) => min + Math.random() * (max - min);
  img.style.setProperty('--x', `${rand(-4, 104).toFixed(1)}%`);
  img.style.setProperty('--size', `${Math.round(rand(64, 160))}px`);
  img.style.setProperty('--rot', `${Math.round(rand(-52, 52))}deg`);
  img.style.setProperty('--drift', `${Math.round(rand(-190, 190))}px`);
  img.style.setProperty('--dur', `${rand(14, 32).toFixed(1)}s`);
  img.style.setProperty('--delay', `${(-rand(0, 34)).toFixed(1)}s`);
});
