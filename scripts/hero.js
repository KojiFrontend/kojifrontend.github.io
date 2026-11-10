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
  const fixedActions = matchMedia('(width > 940px)');
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

if (masthead) {
  const fullBleed = matchMedia('(max-width: 940px)');
  const portraitPhone = matchMedia('(max-width: 560px) and (orientation: portrait) and (pointer: coarse)');
  const page = document.documentElement;
  const roundAt = 12;
  const expandAt = 4;
  let rounded = false;
  let frame = 0;

  const syncScreenHeight = () => {
    if (portraitPhone.matches) {
      masthead.style.setProperty('--hero-screen-height', `${screen.height}px`);
    } else {
      masthead.style.removeProperty('--hero-screen-height');
    }
  };

  const syncFrame = () => {
    frame = 0;
    // Separate the thresholds so small scroll reversals don't restart the animation.
    const nextRounded = fullBleed.matches && (rounded ? scrollY > expandAt : scrollY >= roundAt);
    if (nextRounded === rounded) return;
    rounded = nextRounded;
    page.classList.toggle('hero-is-rounded', rounded);
  };

  window.addEventListener('scroll', () => {
    if (fullBleed.matches && !frame) frame = requestAnimationFrame(syncFrame);
  }, { passive: true });
  fullBleed.addEventListener('change', syncFrame);
  portraitPhone.addEventListener('change', syncScreenHeight);
  syncScreenHeight();
  syncFrame();
}

const consolePreview = document.querySelector('[data-console]');
const pointerFine = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');

if (consolePreview && masthead) {
  const devices = [...consolePreview.querySelectorAll('.hero__device')].map((el) => {
    const style = getComputedStyle(el);
    return {
      el,
      pullX: Number.parseFloat(style.getPropertyValue('--pull-x')) || 0,
      pullY: Number.parseFloat(style.getPropertyValue('--pull-y')) || 0,
      x: null,
      y: null
    };
  });
  let frame = 0;
  let x = 0;
  let y = 0;

  const paint = () => {
    frame = 0;
    devices.forEach((device) => {
      if (device.x === x && device.y === y) return;
      device.x = x;
      device.y = y;
      device.el.style.transform = `translate3d(${(x * device.pullX).toFixed(2)}px, ${(y * device.pullY).toFixed(2)}px, 0)`;
    });
  };

  const trackPointer = (event) => {
    if (!heroVisible || !pointerFine.matches || event.pointerType === 'touch') return;
    x = Math.max(-1, Math.min(1, (2 * event.clientX) / innerWidth - 1));
    y = Math.max(-1, Math.min(1, (2 * event.clientY) / innerHeight - 1));
    if (!frame) frame = requestAnimationFrame(paint);
  };

  const resetConsole = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    x = 0;
    y = 0;
    devices.forEach((device) => {
      device.x = null;
      device.y = null;
      device.el.style.removeProperty('transform');
    });
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
