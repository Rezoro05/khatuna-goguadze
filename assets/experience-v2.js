const menuButton = document.querySelector('.menu-button');
const navLinks = document.querySelector('.nav-links');

if (menuButton && navLinks) {
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open));
    navLinks.classList.toggle('open', !open);
    document.body.classList.toggle('menu-open', !open);
  });
  navLinks.addEventListener('click', (event) => {
    if (!event.target.closest('a')) return;
    menuButton.setAttribute('aria-expanded', 'false');
    navLinks.classList.remove('open');
    document.body.classList.remove('menu-open');
  });
}

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function playHeroEntrance() {
  if (reduceMotion) return;
  const copy = [...document.querySelectorAll('.hero-copy > .eyebrow, .hero-copy > h1, .hero-copy > .lede, .hero-actions, .replay-motion, .trust-note')];
  const visual = document.querySelector('.hero-visual');
  const cards = [...document.querySelectorAll('.floating-card')];

  copy.forEach((element, index) => {
    element.animate([
      { opacity: 0, transform: 'translateY(38px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 1350, delay: 180 + index * 360, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' });
  });

  visual?.animate([
    { opacity: 0, transform: 'translate3d(70px,24px,0) scale(.88)' },
    { opacity: 1, transform: 'translate3d(0,0,0) scale(1)' }
  ], { duration: 2600, delay: 600, easing: 'cubic-bezier(.16,1,.3,1)' });

  cards.forEach((element, index) => {
    element.animate([
      { opacity: 0, transform: 'translateY(28px) scale(.86)' },
      { opacity: 1, transform: 'translateY(0) scale(1)' }
    ], { duration: 1500, delay: 2500 + index * 500, easing: 'cubic-bezier(.34,1.56,.64,1)' });
  });
}

document.querySelector('[data-replay-motion]')?.addEventListener('click', playHeroEntrance);
if (document.querySelector('.hero')) playHeroEntrance();

const revealItems = document.querySelectorAll('.reveal:not(.hero-copy):not(.hero-visual)');
if (reduceMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: .12 });
  revealItems.forEach((item) => observer.observe(item));
}
