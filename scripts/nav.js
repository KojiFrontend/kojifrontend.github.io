const navItems = [...document.querySelectorAll('.nav__link')]
  .map((link) => ({ link, section: document.querySelector(link.getAttribute('href')) }))
  .filter((item) => item.section);

const syncNav = () => {
  const marker = window.innerHeight * 0.45;
  let active = null;

  navItems.forEach(({ section }) => {
    if (section.getBoundingClientRect().top <= marker) active = section.id;
  });

  navItems.forEach(({ link, section }) => {
    if (section.id === active) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
};

if (navItems.length) {
  window.addEventListener('scroll', syncNav, { passive: true });
  window.addEventListener('resize', syncNav);
  syncNav();
}
