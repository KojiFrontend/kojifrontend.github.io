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
  const rect = card.getBoundingClientRect();
  const wrap = document.createElement('div');
  wrap.className = 'lightbox__face-wrap';
  wrap.style.width = `${rect.width}px`;
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
        boxShadow:
          cardStyle.boxShadow === 'none'
            ? '0 0 0 0 rgba(0, 0, 0, 0)'
            : `0 0 0 0 rgba(0, 0, 0, 0), ${cardStyle.boxShadow}`
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

const settle = () => {
  clearTimeout(closeTimer);
  viewer.classList.remove('is-open', 'is-closing');
  resetPanel();
  viewerArt.style.width = '';
  viewerArt.style.height = '';
  if (pressed) pressed.classList.remove('is-lifted');
  pressed = null;
};

const closeShot = () => {
  if (!viewer.open || viewer.classList.contains('is-closing')) return;
  openToken += 1;
  const token = openToken;
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
  closeTimer = setTimeout(() => {
    if (token !== openToken) return;
    viewer.close();
    settle();
  }, reducedMotion.matches ? 0 : MORPH + 20);
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
  if (!viewer.open) settle();
});

document.querySelectorAll('a[href="#"]').forEach((link) => {
  link.addEventListener('click', (event) => event.preventDefault());
});
