const dialog = document.querySelector('.lightbox');

if (dialog instanceof HTMLDialogElement && typeof dialog.showModal === 'function') {
  const title = dialog.querySelector('#preview-title');
  const art = dialog.querySelector('.lightbox__art');

  document.querySelectorAll('a[data-preview]').forEach((link) => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      title.textContent = link.dataset.preview;
      art.alt = link.querySelector('img')?.alt || `${link.dataset.preview} in Koji`;
      art.src = link.href;
      dialog.showModal();
    });
  });

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener('close', () => art.removeAttribute('src'));
}

const orbit = document.querySelector('[data-orbit]');

if (orbit && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(([entry]) => {
    orbit.classList.toggle('is-visible', entry.isIntersecting);
  });
  observer.observe(orbit);
}
