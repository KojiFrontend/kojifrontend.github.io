const themeShowcase = document.querySelector('[data-theme-showcase]');

if (themeShowcase) {
  const shell = themeShowcase.querySelector('[data-theme-shell]');
  const options = [...themeShowcase.querySelectorAll('[data-theme-option]')];
  const assets = new Map();
  let selected = null;
  const stacks = {
    top: [...themeShowcase.querySelectorAll('.theme-showcase__layer[data-screen="top"]')],
    bottom: [...themeShowcase.querySelectorAll('.theme-showcase__layer[data-screen="bottom"]')]
  };
  const front = { top: 0, bottom: 0 };

  const load = (src) => {
    if (assets.has(src)) return assets.get(src);
    const image = new Image();
    image.src = src;
    const ready = image.decode().then(() => true, () => {
      assets.delete(src);
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

  const select = async (option) => {
    selected = option;
    const ready = await preload(option);
    if (selected !== option || ready.includes(false)) return;
    options.forEach((other) => {
      const active = other === option;
      other.classList.toggle('is-active', active);
      other.setAttribute('aria-pressed', String(active));
    });
    paint(stacks.top, 'top', option.dataset.top);
    paint(stacks.bottom, 'bottom', option.dataset.bottom);
    themeShowcase.style.setProperty('--shell-filter', option.dataset.filter || 'none');
    if (shell && shell.getAttribute('src') !== option.dataset.shell) {
      shell.src = option.dataset.shell;
    }
  };

  options.forEach((option) => {
    option.addEventListener('pointerenter', () => preload(option), { once: true });
    option.addEventListener('focus', () => preload(option), { once: true });
    option.addEventListener('click', () => select(option));
  });
}
