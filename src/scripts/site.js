const stage = document.querySelector('.stage');
const screens = [...document.querySelectorAll('.screen')];

const scroller = document.querySelector('.scroller');
const track = scroller.querySelector('.scroller__track');
const group = scroller.querySelector('.scroller__group');
const tip = document.querySelector('.tip');

const fillLoop = () => {
  track.querySelectorAll('.scroller__group--clone').forEach((node) => node.remove());

  const width = group.getBoundingClientRect().width;
  if (!width) return;

  const copies = Math.max(2, Math.ceil(scroller.clientWidth / width) + 2);
  for (let i = 1; i < copies; i += 1) {
    const clone = group.cloneNode(true);
    clone.classList.add('scroller__group--clone');
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  }

  track.style.setProperty('--shift', `${width}px`);
};

fillLoop();
document.fonts?.ready.then(fillLoop);

let refillTimer = 0;
window.addEventListener('resize', () => {
  clearTimeout(refillTimer);
  refillTimer = setTimeout(fillLoop, 150);
});

const tipLines = () => {
  const range = document.createRange();
  range.selectNodeContents(tip);
  return [...range.getClientRects()];
};

const hug = () => {
  const style = getComputedStyle(tip);
  const cap = parseFloat(style.maxWidth);
  const chrome =
    parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) +
    (tip.offsetWidth - tip.clientWidth);

  tip.style.width = `${cap}px`;
  void tip.offsetHeight;
  const wrapped = tipLines();
  const widest = Math.max(...wrapped.map((line) => line.width));
  tip.style.width = `${Math.ceil(widest + chrome)}px`;
  void tip.offsetHeight;

  if (tipLines().length > wrapped.length) {
    tip.style.width = `${cap}px`;
    void tip.offsetHeight;
  }
};

const place = (item) => {
  tip.textContent = item.dataset.tip;
  hug();
  const rect = item.getBoundingClientRect();
  const half = tip.offsetWidth / 2;
  const inset = 8;
  const x = Math.min(
    Math.max(rect.left + rect.width / 2, half + inset),
    document.documentElement.clientWidth - half - inset
  );
  tip.style.left = `${x}px`;
  tip.style.top = `${rect.top - 12}px`;
  tip.classList.add('is-on');
};

scroller.addEventListener('pointerover', (event) => {
  const item = event.target.closest('.scroller__item');
  if (item && item.dataset.tip) place(item);
});

scroller.addEventListener('pointerout', (event) => {
  if (!event.target.closest('.scroller__item')) return;
  if (event.relatedTarget && event.relatedTarget.closest('.scroller__item')) return;
  tip.classList.remove('is-on');
});

const tabs = [...document.querySelectorAll('.tabbar__tab')];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const viewer = document.querySelector('.lightbox');
const viewerPanel = viewer.querySelector('.lightbox__panel');
const viewerArt = viewer.querySelector('.lightbox__art');

const MORPH = 380;
const MORPH_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

let pressed = null;
let closeTimer = 0;
let morph = null;
let shotMorph = null;
let shotBox = null;
let openToken = 0;

const chromeOf = (el) => {
  const style = getComputedStyle(el);
  return {
    x: parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) +
      parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth),
    y: parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) +
      parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth)
  };
};

const fitArt = (w, h) => {
  if (!w || !h) return;
  const chrome = chromeOf(viewerPanel);
  const maxW = Math.min(720, document.documentElement.clientWidth - 40) - chrome.x;
  const maxH = Math.min(0.72 * innerHeight, 780) - chrome.y;
  const fit = Math.min(1, maxW / w, maxH / h);
  shotBox = { width: Math.round(w * fit), height: Math.round(h * fit) };
  viewerArt.style.width = `${shotBox.width}px`;
  viewerArt.style.height = `${shotBox.height}px`;
};

const sizeArt = (card) => {
  const [w, h] = (card.dataset.shotSize || '').split('x').map(Number);
  if (!w || !h) return false;
  fitArt(w, h);
  return true;
};

const faceFor = (card) => {
  const style = getComputedStyle(card);
  const shell = card.closest('.shell');
  const wrap = document.createElement('div');
  wrap.className = 'lightbox__face-wrap';
  if (shell) {
    const shellStyle = getComputedStyle(shell);
    wrap.style.width = `${shell.getBoundingClientRect().width -
      parseFloat(shellStyle.paddingLeft) - parseFloat(shellStyle.paddingRight)
      }px`;
  }

  const rect = card.getBoundingClientRect();
  const face = card.cloneNode(true);
  face.classList.remove('card--shot', 'is-lifted');
  face.classList.add('lightbox__face');
  face.removeAttribute('role');
  face.removeAttribute('tabindex');
  face.removeAttribute('aria-haspopup');
  face.setAttribute('aria-hidden', 'true');
  face.style.width = `${rect.width}px`;
  face.style.height = `${rect.height}px`;
  face.style.padding = style.padding;
  face.style.filter = style.filter;
  wrap.appendChild(face);
  return wrap;
};

const endsFor = (card) => {
  const from = card.getBoundingClientRect();
  const to = viewerPanel.getBoundingClientRect();
  const chrome = chromeOf(viewerPanel);
  const cardStyle = getComputedStyle(card);
  const panelStyle = getComputedStyle(viewerPanel);
  return {
    frame: [
      {
        left: `${from.left}px`,
        top: `${from.top}px`,
        width: `${from.width}px`,
        height: `${from.height}px`,
        margin: '0px',
        borderRadius: cardStyle.borderRadius,
        boxShadow: `0 0 0 0 rgba(0, 0, 0, 0), ${cardStyle.boxShadow}`
      },
      {
        left: `${to.left}px`,
        top: `${to.top}px`,
        width: `${to.width}px`,
        height: `${to.height}px`,
        margin: '0px',
        borderRadius: panelStyle.borderRadius,
        boxShadow: panelStyle.boxShadow
      }
    ],
    shot: [
      {
        width: `${Math.max(1, from.width - chrome.x)}px`,
        height: `${Math.max(1, from.height - chrome.y)}px`
      },
      {
        width: `${shotBox.width}px`,
        height: `${shotBox.height}px`
      }
    ]
  };
};

const timing = () => ({
  duration: reducedMotion.matches ? 0 : MORPH,
  easing: MORPH_EASE,
  fill: 'both'
});

const begin = (card) => {
  viewerPanel.appendChild(faceFor(card));
  const ends = endsFor(card);
  morph = viewerPanel.animate(ends.frame, timing());
  shotMorph = viewerArt.animate(ends.shot, timing());

  void viewerPanel.offsetHeight;
  viewer.classList.add('is-open');
  card.classList.add('is-lifted');
  pressed = card;
};

const resetPanel = () => {
  morph?.cancel();
  shotMorph?.cancel();
  morph = null;
  shotMorph = null;
  viewerPanel.querySelector('.lightbox__face-wrap')?.remove();
};

const openShot = (card) => {
  const token = ++openToken;
  const title = card.querySelector('.card__title').textContent;
  viewerArt.alt = title;
  viewer.setAttribute('aria-label', title);

  if (viewer.open) viewer.close();
  viewer.classList.remove('is-open', 'is-closing');
  resetPanel();
  viewerPanel.style.opacity = '';
  if (pressed && pressed !== card) pressed.classList.remove('is-lifted');
  pressed = null;
  viewerArt.src = card.dataset.shot;
  const reveal = () => {
    if (token !== openToken || !viewer.open) return;
    viewerPanel.style.opacity = '';
    if (!sizeArt(card)) {
      fitArt(viewerArt.naturalWidth, viewerArt.naturalHeight);
    }
    begin(card);
  };

  viewer.showModal();
  if (viewerArt.complete) {
    reveal();
  } else {
    viewerPanel.style.opacity = '0';
    viewerArt.addEventListener('load', reveal, { once: true });
    viewerArt.addEventListener('error', reveal, { once: true });
  }
};

const closeShot = () => {
  if (!viewer.open || viewer.classList.contains('is-closing')) return;
  openToken += 1;
  viewer.classList.remove('is-open');
  viewer.classList.add('is-closing');

  if (pressed) {
    morph?.cancel();
    shotMorph?.cancel();
    const ends = endsFor(pressed);
    morph = viewerPanel.animate([...ends.frame].reverse(), timing());
    shotMorph = viewerArt.animate([...ends.shot].reverse(), timing());
  }
  clearTimeout(closeTimer);
  closeTimer = setTimeout(() => viewer.close(), reducedMotion.matches ? 0 : MORPH + 20);
};

document.querySelectorAll('.card--shot').forEach((card) => {
  card.addEventListener('click', () => openShot(card));
  card.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openShot(card);
  });
});

viewer.addEventListener('click', (event) => {
  if (event.target === viewer) closeShot();
});

viewer.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeShot();
});

viewer.addEventListener('close', () => {
  if (viewer.open) return;
  clearTimeout(closeTimer);
  viewer.classList.remove('is-open', 'is-closing');
  resetPanel();
  viewerArt.style.width = '';
  viewerArt.style.height = '';
  if (pressed) pressed.classList.remove('is-lifted');
  pressed = null;
});

const setActive = (id) => {
  let matched = false;

  tabs.forEach((tab) => {
    if (tab.dataset.view === id) {
      matched = true;
      tab.setAttribute('aria-current', 'page');
      document.title = `${tab.dataset.title} | Koji`;
    } else {
      tab.removeAttribute('aria-current');
    }
  });

  if (!matched) {
    const label = document.getElementById(id)?.getAttribute('aria-label');
    if (label) document.title = `${label} | Koji`;
  }
};

const goTo = (screen) => {
  stage.scrollTo({
    top: screen.offsetTop,
    behavior: reducedMotion.matches ? 'auto' : 'smooth'
  });
};

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const screen = document.getElementById(tab.dataset.view);
    if (screen) goTo(screen);
  });
});

document.querySelectorAll('a[href="#"]').forEach((link) => {
  link.addEventListener('click', (event) => event.preventDefault());
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) setActive(entry.target.id);
    });
  },
  { threshold: 0.55 }
);

screens.forEach((screen) => observer.observe(screen));
