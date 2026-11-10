const themeShowcase = document.querySelector('[data-theme-showcase]');

if (themeShowcase) {
  const shell = themeShowcase.querySelector('[data-theme-shell]');
  const options = [...themeShowcase.querySelectorAll('[data-theme-option]')];
  const assets = new Map();
  const images = new Map();
  let selected = null;
  let hoverTimer = 0;
  const stacks = {
    top: [...themeShowcase.querySelectorAll('.theme-showcase__layer[data-screen="top"]')],
    bottom: [...themeShowcase.querySelectorAll('.theme-showcase__layer[data-screen="bottom"]')]
  };
  const front = { top: 0, bottom: 0 };

  const load = (src) => {
    if (!src) return Promise.resolve(true);
    const cached = assets.get(src);
    if (cached) return cached;
    const image = new Image();
    image.decoding = 'async';
    image.src = src;
    images.set(src, image);
    const ready = image.decode().then(() => true, () => {
      assets.delete(src);
      images.delete(src);
      return false;
    });
    assets.set(src, ready);
    return ready;
  };

  const preload = (option) =>
    Promise.all([option.dataset.top, option.dataset.bottom, option.dataset.shell].map(load));

  const paint = (stack, which, src) => {
    if (!stack || stack.length < 2 || !src) return;
    const current = front[which];
    const previous = stack[current];
    const next = stack[(current + 1) % stack.length];
    if (previous.style.backgroundImage.includes(src)) return;
    next.style.backgroundImage = `url("${src}")`;
    next.classList.add('is-visible');
    previous.classList.remove('is-visible');
    front[which] = (current + 1) % stack.length;
  };

  const apply = (option) => {
    options.forEach((other) => {
      const active = other === option;
      other.classList.toggle('is-active', active);
      other.setAttribute('aria-pressed', String(active));
    });
    paint(stacks.top, 'top', option.dataset.top);
    paint(stacks.bottom, 'bottom', option.dataset.bottom);
    if (!shell) return;
    const filter = option.dataset.filter && option.dataset.filter !== 'none' ? option.dataset.filter : '';
    if (shell.style.filter !== filter) shell.style.filter = filter;
    if (shell.getAttribute('src') !== option.dataset.shell) shell.src = option.dataset.shell;
  };

  const select = async (option) => {
    if (option === selected) return;
    selected = option;
    const ready = await preload(option);
    if (selected !== option || ready.includes(false)) return;
    apply(option);
  };

  const schedulePreload = (option) => {
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => preload(option), 90);
  };

  options.forEach((option) => {
    option.addEventListener('pointerenter', () => schedulePreload(option), { once: true });
    option.addEventListener('focus', () => preload(option), { once: true });
    option.addEventListener('click', () => select(option));
  });
}
