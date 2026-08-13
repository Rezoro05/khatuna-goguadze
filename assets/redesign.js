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

function initHeroAnimation() {
  const hero = document.querySelector('.hero');
  const gsap = window.gsap;
  if (!hero || !gsap) return false;

  const heroCopy = hero.querySelectorAll('.hero-copy > .eyebrow, .hero-copy > h1, .hero-copy > .lede, .hero-actions, .trust-note');
  const brainCard = hero.querySelector('.brain-card');
  const brainImage = hero.querySelector('.brain-card img');
  const glow = hero.querySelector('.brain-glow');
  const ring = hero.querySelector('.brain-ring');
  const floatingCards = hero.querySelectorAll('.floating-card');
  const visual = hero.querySelector('.hero-visual');
  const mm = gsap.matchMedia();

  mm.add({
    isDesktop: '(min-width: 901px) and (pointer: fine)',
    isMobile: '(max-width: 900px)',
    reduceMotion: '(prefers-reduced-motion: reduce)'
  }, (context) => {
    const { isDesktop, isMobile, reduceMotion } = context.conditions;
    const animatedTargets = [...heroCopy, brainCard, ...floatingCards, glow, ring].filter(Boolean);

    if (reduceMotion) {
      gsap.set(animatedTargets, { clearProps: 'all' });
      return;
    }

    const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
    intro
      .from('.site-header .nav-wrap', { y: -18, autoAlpha: 0, duration: .55 })
      .from(heroCopy, { y: isMobile ? 24 : 36, autoAlpha: 0, duration: .72, stagger: .085 }, '<.08')
      .from(brainCard, { x: isMobile ? 0 : 44, y: isMobile ? 26 : 0, scale: .94, autoAlpha: 0, duration: .9 }, '<.16')
      .from(brainImage, { scale: 1.09, duration: 1.25, ease: 'power2.out' }, '<')
      .from([glow, ring], { scale: .65, autoAlpha: 0, duration: .8, stagger: .1 }, '<.18')
      .from(floatingCards, { y: 18, scale: .94, autoAlpha: 0, duration: .62, stagger: .12 }, '<.16')
      .set(animatedTargets, { clearProps: 'willChange' });

    const pulse = gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: 'sine.inOut' } });
    pulse
      .to(glow, { scale: 1.12, autoAlpha: .78, duration: 2.8 })
      .to(ring, { scale: 1.06, autoAlpha: .72, duration: 2.8 }, '<');

    if (!isDesktop) return () => {
      intro.kill();
      pulse.kill();
    };

    gsap.set([brainImage, floatingCards], { willChange: 'transform' });
    const imageX = gsap.quickTo(brainImage, 'x', { duration: .7, ease: 'power3.out' });
    const imageY = gsap.quickTo(brainImage, 'y', { duration: .7, ease: 'power3.out' });
    const cardsX = gsap.quickTo(floatingCards, 'x', { duration: .8, ease: 'power3.out' });
    const cardsY = gsap.quickTo(floatingCards, 'y', { duration: .8, ease: 'power3.out' });

    const move = (event) => {
      const bounds = visual.getBoundingClientRect();
      const nx = (event.clientX - bounds.left) / bounds.width - .5;
      const ny = (event.clientY - bounds.top) / bounds.height - .5;
      imageX(nx * 18);
      imageY(ny * 14);
      cardsX(nx * -10);
      cardsY(ny * -8);
    };

    const reset = () => {
      imageX(0); imageY(0); cardsX(0); cardsY(0);
    };

    visual.addEventListener('pointermove', move);
    visual.addEventListener('pointerleave', reset);

    return () => {
      intro.kill();
      pulse.kill();
      visual.removeEventListener('pointermove', move);
      visual.removeEventListener('pointerleave', reset);
      gsap.set([brainImage, floatingCards], { clearProps: 'willChange,transform' });
    };
  });

  window.addEventListener('pagehide', () => mm.revert(), { once: true });
  return true;
}

const heroUsesGsap = initHeroAnimation();
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealItems = [...document.querySelectorAll('.reveal')].filter((item) => !heroUsesGsap || !item.closest('.hero'));

if (reduceMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => observer.observe(item));
}
