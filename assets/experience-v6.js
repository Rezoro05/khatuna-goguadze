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

  copy.forEach((element, index) => {
    element.animate([
      { opacity: 0, transform: 'translateY(38px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 1350, delay: 180 + index * 360, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' });
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
    const count = width < 420 ? 58 : 92;
    nodes = Array.from({ length: count }, (_, index) => {
      const angle = seeded(index + 1) * Math.PI * 2;
      const radiusX = Math.sqrt(seeded(index + 11)) * width * .38;
      const radiusY = Math.sqrt(seeded(index + 31)) * height * .31;
      return {
        x: width * .52 + Math.cos(angle) * radiusX,
        y: height * .48 + Math.sin(angle) * radiusY,
        phase: seeded(index + 71) * Math.PI * 2,
        size: .9 + seeded(index + 91) * 1.6
      };
    }).filter((node) => node.x > width * .13 && node.x < width * .9 && node.y > height * .14 && node.y < height * .84);

    links = [];
    nodes.forEach((node, index) => {
      const nearest = nodes
        .map((other, otherIndex) => ({ otherIndex, distance: Math.hypot(node.x - other.x, node.y - other.y) }))
        .filter((entry) => entry.otherIndex !== index)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3);
      nearest.forEach((entry) => {
        if (entry.distance < width * .22 && index < entry.otherIndex) links.push([index, entry.otherIndex]);
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
    return Math.max(0, 1 - distance / Math.max(150, width * .36)) * pointer.strength;
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
      context.strokeStyle = `rgba(221, 87, 58, ${.035 + influence * .62})`;
      context.lineWidth = .55 + influence * 1.25;
      context.shadowBlur = influence * 12;
      context.shadowColor = '#e85e3d';
      context.stroke();
    });

    nodes.forEach((node) => {
      const influence = influenceAt(node.x, node.y);
      const ambient = .1 + Math.sin(time * .0018 + node.phase) * .035;
      const radius = node.size + influence * 2.8;
      context.beginPath();
      context.arc(node.x, node.y, radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(238, 112, 76, ${ambient + influence * .85})`;
      context.shadowBlur = 3 + influence * 24;
      context.shadowColor = influence > .1 ? '#ef6a47' : '#ed9b78';
      context.fill();
    });

    if (pointer.strength > .02) {
      const hubLinks = nodes
        .map((node, index) => ({ index, distance: Math.hypot(node.x - pointer.x, node.y - pointer.y) }))
        .filter((entry) => entry.distance < Math.max(170, width * .34))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, width < 420 ? 7 : 11);

      hubLinks.forEach((entry) => {
        const node = nodes[entry.index];
        const strength = Math.max(0, 1 - entry.distance / Math.max(170, width * .34)) * pointer.strength;
        context.beginPath();
        context.moveTo(pointer.x, pointer.y);
        context.lineTo(node.x, node.y);
        context.strokeStyle = `rgba(218, 74, 48, ${.18 + strength * .72})`;
        context.lineWidth = .7 + strength * 1.25;
        context.shadowBlur = strength * 14;
        context.shadowColor = '#ed5b3b';
        context.stroke();
      });

      context.beginPath();
      context.arc(pointer.x, pointer.y, 3.5 + pointer.strength * 3.2, 0, Math.PI * 2);
      context.fillStyle = `rgba(225, 78, 48, ${.25 + pointer.strength * .7})`;
      context.shadowBlur = 22 * pointer.strength;
      context.shadowColor = '#f05b3b';
      context.fill();
    }

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
