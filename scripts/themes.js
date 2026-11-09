const themeShowcase = document.querySelector('[data-theme-showcase]');

if (themeShowcase) {
  const shell = themeShowcase.querySelector('[data-theme-shell]');
  const options = [...themeShowcase.querySelectorAll('[data-theme-option]')];
  const loaded = new Set();
  const stacks = {
    top: [...themeShowcase.querySelectorAll('.theme-showcase__layer[data-screen="top"]')],
    bottom: [...themeShowcase.querySelectorAll('.theme-showcase__layer[data-screen="bottom"]')]
  };
  const front = { top: 0, bottom: 0 };

  const warming = [];
  const preload = (option) => {
    [option.dataset.top, option.dataset.bottom, option.dataset.shell].forEach((src) => {
      if (!src || loaded.has(src)) return;
      loaded.add(src);
      const image = new Image();
      image.src = src;
      warming.push(image);
    });
  };

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

  const select = (option) => {
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

  const warm = () => options.forEach(preload);
  const warmObserver = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    warm();
    warmObserver.disconnect();
  }, { rootMargin: '300px' });
  warmObserver.observe(themeShowcase);
  themeShowcase.addEventListener('pointerenter', warm, { once: true });
  themeShowcase.addEventListener('focusin', warm, { once: true });

  options.forEach((option) => {
    option.addEventListener('click', () => select(option));
  });
}
