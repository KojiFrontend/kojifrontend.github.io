const heroActions = document.querySelector('[data-hero-actions]');

if (heroActions) {
  let hidden = null;

  const syncActions = () => {
    const next = window.scrollY > 32;
    if (next === hidden) return;
    hidden = next;
    heroActions.classList.toggle('is-hidden', next);
  };

  window.addEventListener('scroll', syncActions, { passive: true });
  syncActions();
}

const consolePreview = document.querySelector('[data-console]');
const pointerFine = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');

if (consolePreview) {

  const trackPointer = (event) => {
    if (!pointerFine.matches || event.pointerType === 'touch') return;
    const x = Math.max(-1, Math.min(1, (2 * event.clientX) / innerWidth - 1));
    const y = Math.max(-1, Math.min(1, (2 * event.clientY) / innerHeight - 1));
    consolePreview.style.setProperty('--console-x', x.toFixed(3));
    consolePreview.style.setProperty('--console-y', y.toFixed(3));
  };

  const resetConsole = () => {
    consolePreview.style.removeProperty('--console-x');
    consolePreview.style.removeProperty('--console-y');
  };

  window.addEventListener('pointermove', trackPointer, { passive: true });
  window.addEventListener('blur', resetConsole);
  pointerFine.addEventListener('change', resetConsole);
}

const youWord = document.querySelector('.hero__you');

if (youWord && matchMedia('(prefers-reduced-motion: no-preference)').matches) {
  const variants = ['is-roboto-condensed', 'is-redaction', 'is-rubik', 'is-nunito', 'is-rubik-heavy', 'is-serif'];
  let variant = 0;
  youWord.className = `hero__you ${variants[0]}`;

  setInterval(() => {
    variant = (variant + 1) % variants.length;
    youWord.className = `hero__you ${variants[variant]}`;
  }, 1400);
}

const floaters = [...document.querySelectorAll('.masthead__floaters img')];

floaters.forEach((img) => {
  const rand = (min, max) => min + Math.random() * (max - min);
  img.style.setProperty('--x', `${rand(-4, 104).toFixed(1)}%`);
  img.style.setProperty('--size', `${Math.round(rand(64, 212))}px`);
  img.style.setProperty('--rot', `${Math.round(rand(-52, 52))}deg`);
  img.style.setProperty('--drift', `${Math.round(rand(-190, 190))}px`);
  img.style.setProperty('--dur', `${rand(14, 32).toFixed(1)}s`);
  img.style.setProperty('--delay', `${(-rand(0, 34)).toFixed(1)}s`);
});
