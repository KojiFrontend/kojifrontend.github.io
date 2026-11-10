const navItems = [...document.querySelectorAll('.nav__link')]
  .map((link) => ({ link, section: document.querySelector(link.getAttribute('href')) }))
  .filter((item) => item.section);

let activeLink = null;
let navFrame = 0;
let measureFrame = 0;
const offsets = new Map();

const scheduleNav = () => {
  if (!navFrame) navFrame = requestAnimationFrame(syncNav);
};

const measure = () => {
  measureFrame = 0;
  navItems.forEach(({ section }) => {
    offsets.set(section, section.getBoundingClientRect().top + window.scrollY);
  });
  scheduleNav();
};

const scheduleMeasure = () => {
  if (!measureFrame) measureFrame = requestAnimationFrame(measure);
};

const syncNav = () => {
  navFrame = 0;
  const marker = window.scrollY + window.innerHeight * 0.45;
  let active = null;

  for (const { link, section } of navItems) {
    if ((offsets.get(section) ?? 0) > marker) break;
    active = link;
  }

  if (active === activeLink) return;
  activeLink?.removeAttribute('aria-current');
  active?.setAttribute('aria-current', 'true');
  activeLink = active;
};

if (navItems.length) {
  window.addEventListener('scroll', scheduleNav, { passive: true });
  window.addEventListener('resize', scheduleMeasure);
  window.addEventListener('load', measure);
  document.fonts?.ready.then(measure);
  if ('ResizeObserver' in window) new ResizeObserver(scheduleMeasure).observe(document.body);
  measure();
}
