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
  const copy = [...document.querySelectorAll('.hero-copy > .eyebrow, .hero-copy > h1, .hero-copy > .lede, .hero-actions, .trust-note')];
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

if (document.querySelector('.hero')) playHeroEntrance();

function initNeuralField() {
  const field = document.querySelector('[data-neural-field]');
  const canvas = field?.querySelector('.neuron-canvas');
  if (!field || !canvas) return;

  const context = canvas.getContext('2d');
  if (!context) return;

  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let nodes = [];
  let links = [];
  let frame = 0;
  let tapTimeout = 0;
  let pointer = { x: 0, y: 0, active: false, strength: 0 };

  const seeded = (index) => {
    const value = Math.sin(index * 999.91) * 43758.5453;
    return value - Math.floor(value);
  };

  const buildNetwork = () => {
    const count = width < 420 ? 44 : 68;
    nodes = Array.from({ length: count }, (_, index) => {
      const angle = seeded(index + 1) * Math.PI * 2;
      const radiusX = Math.sqrt(seeded(index + 11)) * width * .38;
      const radiusY = Math.sqrt(seeded(index + 31)) * height * .31;
      return {
        x: width * .52 + Math.cos(angle) * radiusX,
        y: height * .48 + Math.sin(angle) * radiusY,
        phase: seeded(index + 71) * Math.PI * 2,
        size: 1.2 + seeded(index + 91) * 2.2
      };
    }).filter((node) => node.x > width * .13 && node.x < width * .9 && node.y > height * .14 && node.y < height * .84);

    links = [];
    nodes.forEach((node, index) => {
      const nearest = nodes
        .map((other, otherIndex) => ({ otherIndex, distance: Math.hypot(node.x - other.x, node.y - other.y) }))
        .filter((entry) => entry.otherIndex !== index)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 2);
      nearest.forEach((entry) => {
        if (entry.distance < width * .19 && index < entry.otherIndex) links.push([index, entry.otherIndex]);
      });
    });
  };

  const resize = () => {
    const bounds = field.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    pixelRatio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    buildNetwork();
  };

  const influenceAt = (x, y) => {
    if (!pointer.active && pointer.strength < .01) return 0;
    const distance = Math.hypot(x - pointer.x, y - pointer.y);
    return Math.max(0, 1 - distance / Math.max(135, width * .31)) * pointer.strength;
  };

  const draw = (time) => {
    pointer.strength += ((pointer.active ? 1 : 0) - pointer.strength) * .08;
    context.clearRect(0, 0, width, height);
    context.lineCap = 'round';

    links.forEach(([fromIndex, toIndex]) => {
      const from = nodes[fromIndex];
      const to = nodes[toIndex];
      const influence = Math.max(influenceAt(from.x, from.y), influenceAt(to.x, to.y));
      context.beginPath();
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
      context.strokeStyle = `rgba(77, 230, 241, ${.07 + influence * .68})`;
      context.lineWidth = .6 + influence * 1.8;
      context.shadowBlur = influence * 16;
      context.shadowColor = '#32e7f4';
      context.stroke();
    });

    nodes.forEach((node) => {
      const influence = influenceAt(node.x, node.y);
      const ambient = .18 + Math.sin(time * .0018 + node.phase) * .06;
      const radius = node.size + influence * 3.8;
      context.beginPath();
      context.arc(node.x, node.y, radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(225, 254, 255, ${ambient + influence * .82})`;
      context.shadowBlur = 4 + influence * 28;
      context.shadowColor = influence > .1 ? '#32e7f4' : '#ffffff';
      context.fill();
    });

    context.shadowBlur = 0;
    frame = requestAnimationFrame(draw);
  };

  const setPointer = (event) => {
    const bounds = field.getBoundingClientRect();
    pointer.x = event.clientX - bounds.left;
    pointer.y = event.clientY - bounds.top;
    pointer.active = true;
    field.classList.add('neurons-active');
  };

  const clearPointer = () => { pointer.active = false; };
  const pulsePointer = (event) => {
    setPointer(event);
    clearTimeout(tapTimeout);
    tapTimeout = setTimeout(clearPointer, 1400);
  };
  field.addEventListener('pointermove', setPointer, { passive: true });
  field.addEventListener('pointerdown', pulsePointer, { passive: true });
  field.addEventListener('pointerleave', clearPointer, { passive: true });

  const observer = new ResizeObserver(resize);
  observer.observe(field);
  resize();

  if (reduceMotion) {
    pointer.x = width * .52;
    pointer.y = height * .48;
    pointer.strength = .35;
    pointer.active = false;
    draw(0);
    cancelAnimationFrame(frame);
    return;
  }

  frame = requestAnimationFrame(draw);
  addEventListener('pagehide', () => {
    cancelAnimationFrame(frame);
    clearTimeout(tapTimeout);
    observer.disconnect();
  }, { once: true });
}

initNeuralField();

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
