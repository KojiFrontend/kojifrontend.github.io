const navItems = [...document.querySelectorAll('.nav__link')]
  .map((link) => ({ link, section: document.querySelector(link.getAttribute('href')) }))
  .filter((item) => item.section);

let activeLink = null;
let navFrame = 0;

const syncNav = () => {
  navFrame = 0;
  const marker = window.innerHeight * 0.45;
  let active = null;

  for (const { link, section } of navItems) {
    if (section.getBoundingClientRect().top > marker) break;
    active = link;
  }

  if (active === activeLink) return;
  activeLink?.removeAttribute('aria-current');
  active?.setAttribute('aria-current', 'true');
  activeLink = active;
};

if (navItems.length) {
  const scheduleNav = () => {
    if (!navFrame) navFrame = requestAnimationFrame(syncNav);
  };
  window.addEventListener('scroll', scheduleNav, { passive: true });
  window.addEventListener('resize', scheduleNav);
  syncNav();
}
