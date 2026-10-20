const header = document.querySelector('.header');
const scrollHeader = () => header.classList.toggle('scrolled', window.scrollY > 40);
window.addEventListener('scroll', scrollHeader, { passive: true });
scrollHeader();

const menu = document.querySelector('#mobile-menu');
const toggle = document.querySelector('.menu-toggle');
function closeMenu() { if (menu.open) menu.close(); }
toggle.addEventListener('click', () => {
  menu.showModal();
  document.body.classList.add('menu-open');
  toggle.setAttribute('aria-expanded', 'true');
  menu.querySelector('.menu-close').focus();
});
menu.querySelector('.menu-close').addEventListener('click', closeMenu);
menu.addEventListener('close', () => {
  document.body.classList.remove('menu-open');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.focus();
});
menu.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
menu.addEventListener('keydown', event => {
  if (event.key === 'Escape') { event.preventDefault(); closeMenu(); }
  if (event.key !== 'Tab') return;
  const focusable = [...menu.querySelectorAll('a[href], button')].filter(el => el.getClientRects().length);
  const first = focusable[0], last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
window.matchMedia('(min-width: 901px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

const policyToc = document.querySelector('.policy-toc');
if (policyToc) {
  const widePolicy = window.matchMedia('(min-width: 901px)');
  const setPolicyContents = () => { policyToc.open = widePolicy.matches; };
  setPolicyContents();
  widePolicy.addEventListener('change', setPolicyContents);
  const contentsLinks = [...policyToc.querySelectorAll('nav a')];
  const highlightContents = link => contentsLinks.forEach(item => {
    if (item === link) item.setAttribute('aria-current', 'location');
    else item.removeAttribute('aria-current');
  });
  highlightContents(contentsLinks.find(link => link.hash === location.hash) || contentsLinks[0]);
  policyToc.addEventListener('click', event => {
    const link = event.target.closest('nav a');
    if (!link) return;
    highlightContents(link);
    if (!widePolicy.matches) policyToc.open = false;
  });
  if ('IntersectionObserver' in window) {
    const contentsObserver = new IntersectionObserver(entries => {
      const entered = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (entered.length) highlightContents(contentsLinks.find(link => link.hash === '#' + entered[0].target.id));
    }, { rootMargin: `-120px 0px -${Math.max(0, window.innerHeight - 320)}px 0px` });
    contentsLinks.forEach(link => {
      const section = document.getElementById(link.hash.slice(1));
      if (section) contentsObserver.observe(section);
    });
  }
}

const faqButtons = [...document.querySelectorAll('[data-faq]')];
const faqAnimations = new Map();
function setFaqExpanded(button, expanded) {
  const answer = document.getElementById(button.getAttribute('aria-controls'));
  const height = answer.hidden ? 0 : answer.getBoundingClientRect().height;
  const style = getComputedStyle(answer);
  const opacity = answer.hidden ? 0 : Number(style.opacity);
  const padding = answer.hidden ? '0px' : style.paddingBottom;
  faqAnimations.get(answer)?.cancel();
  faqAnimations.delete(answer);
  button.setAttribute('aria-expanded', String(expanded));
  answer.inert = !expanded;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    answer.hidden = !expanded;
    return;
  }
  answer.hidden = false;
  const animation = answer.animate([
    { height: `${height}px`, opacity, paddingBottom: padding, overflow: 'hidden' },
    { height: expanded ? `${answer.scrollHeight}px` : '0px', opacity: expanded ? 1 : 0, paddingBottom: expanded ? getComputedStyle(answer).paddingBottom : '0px', overflow: 'hidden' }
  ], { duration: 320, easing: 'cubic-bezier(.22,1,.36,1)' });
  faqAnimations.set(answer, animation);
  animation.onfinish = () => {
    if (faqAnimations.get(answer) !== animation) return;
    answer.hidden = !expanded;
    faqAnimations.delete(answer);
  };
}
faqButtons.forEach(button => button.addEventListener('click', () => {
  const expanded = button.getAttribute('aria-expanded') !== 'true';
  faqButtons.forEach(other => {
    if (other !== button && other.getAttribute('aria-expanded') === 'true') setFaqExpanded(other, false);
  });
  setFaqExpanded(button, expanded);
}));

const prompts = {
  week: ['Help me plan a calmer week.', 'Start with three priorities, a short daily walk and time to review your spending. I can propose a task and a habit for you to review.'],
  meal: ['Help me plan a simple dinner.', 'How about a rice bowl with vegetables and your preferred protein? I can propose the meal and a grocery list. Review ingredients and portions in the app.'],
  workout: ['Help me organise a workout.', 'I can propose an exercise checklist for you to review. Tell me your goals and equipment in the app, and check the suggestions before saving.'],
  budget: ['Help me review my spending.', 'I can help you review the expenses you have logged and propose a budget check-in. Verify the numbers; these suggestions are general guidance.'],
  habit: ['Suggest a small habit to start.', 'Try a short evening check-in: review today and pick one priority for tomorrow. I can propose a habit for you to review and confirm in the app.']
};
document.querySelectorAll('[data-prompt]').forEach(button => button.addEventListener('click', () => {
  const [prompt, response] = prompts[button.dataset.prompt];
  document.getElementById('demo-prompt').textContent = prompt;
  document.getElementById('demo-response').textContent = response;
  document.querySelectorAll('[data-prompt]').forEach(chip => chip.setAttribute('aria-pressed', String(chip === button)));
}));
const response = document.getElementById('demo-response');
if (response) response.setAttribute('aria-live', 'polite');

document.querySelectorAll('[data-original-chip]').forEach(button => button.addEventListener('click', () => {
  const selected = button.getAttribute('aria-pressed') !== 'true';
  button.setAttribute('aria-pressed', String(selected));
  button.style.background = selected ? 'rgba(27,152,102,.25)' : 'rgba(255,255,255,.04)';
  button.style.borderColor = selected ? 'rgba(27,152,102,.7)' : 'rgba(255,255,255,.14)';
}));

const marquee = document.querySelector('.marquee');
if (marquee) [...marquee.children].forEach(item => { const clone = item.cloneNode(true); clone.setAttribute('aria-hidden', 'true'); marquee.append(clone); });

const starfield = document.querySelector('[data-space-stars]');
if (starfield) {
  for (let i = 0; i < 30; i++) {
    const star = document.createElement('span');
    star.className = 'space-star';
    const properties = { '--x': `${Math.random() * 100}%`, '--y': `${Math.random() * 50}%`, '--size': `${1 + Math.random() * 2}px`, '--duration': `${4 + Math.random() * 3}s`, '--delay': `${-Math.random() * 7}s`, '--drift': `${Math.random() > .5 ? 100 : -100}px` };
    Object.entries(properties).forEach(([key, value]) => star.style.setProperty(key, value));
    starfield.append(star);
  }
}

const strands = Array.from({ length: 40 }, () => ({ o: (Math.random() + Math.random() + Math.random() - 1.5) * 0.09, p: Math.random() * 6.28, f: 2 + Math.floor(Math.random() * 3), a: 0.05 + Math.random() * 0.12 }));
    const parts = Array.from({ length: 150 }, () => ({ t: Math.random() * 6.28, o: (Math.random() - 0.5) * 0.2, s: 0.4 + Math.random() * 1.6, v: (Math.random() * 0.5 + 0.2) * 0.002 }));
    const draw = (cv, cfg, time) => {
      if (!cv) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = cv.clientWidth, h = cv.clientHeight;
      if (!w || !h) return;
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
      const ctx = cv.getContext('2d'); if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const rr = w < 700 ? Math.max(cfg.r, 0.5) : cfg.r; const cx = w * cfg.x, cy = h * cfg.y, R = Math.min(w * rr, h * 0.42), rx = R, ry = R * 0.8, tilt = -0.35 + Math.sin(time * 0.0002) * 0.04;
      const pt = (t, r) => { const x = rx * r * Math.cos(t), y = ry * r * Math.sin(t); return [cx + x * Math.cos(tilt) - y * Math.sin(tilt), cy + x * Math.sin(tilt) + y * Math.cos(tilt)]; };
      const gc = {}; const col = (a) => { const k = a.toFixed(2); if (gc[k]) return gc[k]; return gc[k] = colRaw(a); }; const colRaw = (a) => { if (!ctx.createConicGradient) return `rgba(255,255,255,${a})`; const g = ctx.createConicGradient(-2.4, cx, cy); g.addColorStop(0, `rgba(255,255,255,${a * 1.6})`); g.addColorStop(0.35, `rgba(200,240,222,${a})`); g.addColorStop(0.6, `rgba(27,152,102,${a * 0.5})`); g.addColorStop(0.85, `rgba(255,255,255,${a * 0.7})`); g.addColorStop(1, `rgba(255,255,255,${a * 1.6})`); return g; };
      ctx.beginPath();
      for (let i = 0; i <= 80; i++) { const [x, y] = pt(i / 80 * 6.283, 1); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.lineCap = 'round'; for (const [lw, a] of [[0.26, 0.05], [0.16, 0.08], [0.08, 0.12]]) { ctx.lineWidth = R * lw; ctx.strokeStyle = `rgba(27,152,102,${a})`; ctx.stroke(); } ctx.lineWidth = R * 0.03; ctx.strokeStyle = 'rgba(200,240,222,.08)'; ctx.stroke();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineWidth = 0.7;
      for (const s of strands) {
        ctx.strokeStyle = col(s.a); ctx.beginPath();
        for (let i = 0; i <= 90; i++) { const t = i / 90 * 6.283; const r = 1 + s.o + 0.025 * Math.sin(s.f * t + s.p + time * 0.0006); const [x, y] = pt(t, r); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke();
      }
      for (const p of parts) {
        p.t += p.v; const [x, y] = pt(p.t, 1 + p.o + 0.02 * Math.sin(p.t * 3 + time * 0.001));
        const bright = 0.5 + 0.5 * Math.cos(p.t + 2.4);
        ctx.fillStyle = `rgba(${bright > 0.5 ? '255,255,255' : '120,220,180'},${0.25 + bright * 0.6})`;
        ctx.beginPath(); ctx.arc(x, y, p.s, 0, 6.283); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    };


const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const canvases = [...document.querySelectorAll('[data-ring]')];
const visible = new Set();
let frame = 0;
function paint(canvas, time) { draw(canvas, { x: .5, y: canvas.classList.contains('original-ring') ? .46 : .48, r: .42 }, time); }
function animate(time) {
  frame = 0;
  if (document.hidden || reducedMotion.matches || !visible.size) return;
  visible.forEach(canvas => paint(canvas, time));
  frame = requestAnimationFrame(animate);
}
function restart() {
  cancelAnimationFrame(frame); frame = 0;
  if (document.hidden) return;
  if (reducedMotion.matches) { visible.forEach(canvas => paint(canvas, 0)); return; }
  if (visible.size) frame = requestAnimationFrame(animate);
}
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target));
    restart();
  });
  canvases.forEach(canvas => observer.observe(canvas));
} else { canvases.forEach(canvas => visible.add(canvas)); restart(); }
reducedMotion.addEventListener('change', restart);
document.addEventListener('visibilitychange', restart);
let resizeFrame = 0;
window.addEventListener('resize', () => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(restart); }, { passive: true });
