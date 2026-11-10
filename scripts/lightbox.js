const viewer = document.querySelector('.lightbox');
const viewerArt = viewer.querySelector('.lightbox__art');
const preloaded = new Set();
let trigger = null;

const preload = (card) => {
  const src = card.dataset.shot;
  if (!src || preloaded.has(src)) return;
  preloaded.add(src);
  const image = new Image();
  image.decoding = 'async';
  image.src = src;
  image.decode().catch(() => {});
};

const openShot = (card) => {
  if (viewer.open) return;

  const title = card.querySelector('.card__title').textContent;
  trigger = card;
  viewerArt.alt = title;
  viewerArt.src = card.dataset.shot;
  viewer.setAttribute('aria-label', title);
  viewer.showModal();
};

document.querySelectorAll('.card--shot').forEach((card) => {
  card.addEventListener('pointerenter', () => preload(card), { once: true });
  card.addEventListener('focus', () => preload(card), { once: true });
  card.addEventListener('click', () => openShot(card));
  card.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openShot(card);
  });
});

viewer.addEventListener('click', (event) => {
  if (event.target === viewer) viewer.close();
});

viewer.addEventListener('close', () => {
  if (viewer.open) return;
  trigger?.focus({ preventScroll: true });
  trigger = null;
  viewerArt.removeAttribute('src');
});
