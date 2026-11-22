(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WA = '2348108418804';

  $('#yr').textContent = new Date().getFullYear();

  const nav = $('#nav'), bar = $('.progress');
  const onScroll = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
    nav.classList.toggle('solid', scrollY > 30);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const count = el => {
    const end = +el.dataset.n, s = el.dataset.s || '';
    if (calm) { el.textContent = end + s; return; }
    const t0 = performance.now();
    const f = t => { const p = Math.min((t - t0) / 1400, 1); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + s; p < 1 && requestAnimationFrame(f); };
    requestAnimationFrame(f);
  };
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    $$('[data-n]', e.target).forEach(count);
    io.unobserve(e.target);
  }), { threshold: .15 });
  $$('.reveal').forEach((el, i) => { el.style.transitionDelay = (i % 4) * 90 + 'ms'; io.observe(el); });

  const words = ['business websites', 'event ticketing systems', 'online registration', 'custom web apps'];
  const tEl = $('#type'); let w = 0, c = 0, del = false;
  if (calm) tEl.textContent = words[0];
  else (function tick() {
    const word = words[w];
    tEl.textContent = word.slice(0, del ? --c : ++c);
    let ms = del ? 35 : 80;
    if (!del && c === word.length) { del = true; ms = 1600; }
    else if (del && c === 0) { del = false; w = (w + 1) % words.length; ms = 350; }
    setTimeout(tick, ms);
  })();

  const cv = $('#net'), ctx = cv.getContext('2d');
  let W, H, pts = [], mouse = { x: -999, y: -999 }, run = true;
  const size = () => {
    const d = Math.min(devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    pts = Array.from({ length: Math.min(Math.floor(W * H / 15000), 90) }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4 }));
  };
  const draw = () => {
    if (run) {
      ctx.clearRect(0, 0, W, H);
      for (const p of pts) {
        if (!calm) { p.x += p.vx; p.y += p.vy; }
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.fillStyle = 'rgba(34,211,238,.8)'; ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, 6.3); ctx.fill();
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
          if (d < 130) { ctx.strokeStyle = `rgba(59,130,246,${.35 * (1 - d / 130)})`; ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke(); }
        }
        const m = Math.hypot(pts[i].x - mouse.x, pts[i].y - mouse.y);
        if (m < 160) { ctx.strokeStyle = `rgba(245,158,11,${.5 * (1 - m / 160)})`; ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); }
      }
    }
    if (!calm) requestAnimationFrame(draw);
  };
  size(); draw();
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { size(); calm && draw(); }, 150); });
  cv.parentElement.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); mouse = { x: e.clientX - r.left, y: e.clientY - r.top }; });
  cv.parentElement.addEventListener('pointerleave', () => mouse = { x: -999, y: -999 });
  new IntersectionObserver(([e]) => run = e.isIntersecting).observe(cv);

  if (!calm && matchMedia('(pointer:fine)').matches) {
    const g = $('.glow');
    addEventListener('pointermove', e => { g.style.left = e.clientX + 'px'; g.style.top = e.clientY + 'px'; }, { passive: true });
    $$('.tilt').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        el.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
      });
      el.addEventListener('pointerleave', () => el.style.transform = '');
    });
  }

  const localizePrices = async () => {
    const note = $('#localized-pricing-note');
    const cacheKey = 'boisites-local-prices-v1';

    try {
      let location;
      let exchange;

      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const value = JSON.parse(cached);
        if (Date.now() - value.time < 6 * 60 * 60 * 1000) {
          location = value.location;
          exchange = value.exchange;
        }
      }

      if (!location) {
        try {
          const locationResponse = await fetch('https://ipapi.co/json/', {
            headers: { Accept: 'application/json' }
          });
          if (!locationResponse.ok) throw new Error('Primary IP lookup failed');
          location = await locationResponse.json();
        } catch {
          const fallbackResponse = await fetch(
            'https://ip-api.com/json/?fields=status,message,country,countryCode,currency,language,query'
          );
          if (!fallbackResponse.ok) throw new Error('IP lookup failed');
          const fallbackLocation = await fallbackResponse.json();
          if (fallbackLocation.status !== 'success') throw new Error('IP lookup failed');
          location = {
            ip: fallbackLocation.query,
            country_code: fallbackLocation.countryCode,
            country_name: fallbackLocation.country,
            currency_code: fallbackLocation.currency,
            languages: fallbackLocation.language
          };
        }
      }

      if (!exchange) {
        const exchangeResponse = await fetch('https://open.er-api.com/v6/latest/USD');
        if (!exchangeResponse.ok) throw new Error('Exchange-rate lookup failed');
        exchange = await exchangeResponse.json();
        if (exchange.result !== 'success' || !exchange.rates) throw new Error('Exchange rates unavailable');
        sessionStorage.setItem(cacheKey, JSON.stringify({
          time: Date.now(),
          location,
          exchange
        }));
      }

      const currency = String(location.currency_code || location.currency || (location.country_code === 'NG' ? 'NGN' : 'USD')).toUpperCase();
      const targetRate = exchange.rates[currency];
      const ngnRate = exchange.rates.NGN;
      if (!targetRate || !ngnRate) return;

      const locale = (location.languages || 'en').split(',')[0].trim() || 'en';
      const format = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: 0
      });

      $$('[data-base-ngn]').forEach(el => {
        const baseNgn = Number(el.dataset.baseNgn);
        if (!Number.isFinite(baseNgn)) return;
        const baseUsd = baseNgn / ngnRate;
        const surchargeUsd = String(location.country_code).toUpperCase() === 'NG' ? 0 : 10;
        const localized = (baseUsd + surchargeUsd) * targetRate;
        const prefix = el.dataset.prefix || '';
        el.textContent = prefix + format.format(Math.round(localized));
      });

      const country = location.country_name || location.country || 'your country';
      note.textContent = String(location.country_code).toUpperCase() === 'NG'
        ? `IP-based local prices for ${country}.`
        : `IP-based local prices for ${country}, including an additional $10 USD.`;
    } catch {
      if (note) note.textContent = 'Base prices shown in Nigerian naira; local conversion is unavailable.';
    }
  };

  localizePrices();

  const form = $('#form'), err = $('#err');
  $$('[data-pick]').forEach(a => a.addEventListener('click', () => { form.service.value = a.dataset.pick; }));
  form.addEventListener('submit', e => {
    e.preventDefault();
    const n = form.name.value.trim(), m = form.msg.value.trim();
    err.hidden = !!(n && m);
    if (!n || !m) return;
    const text = `Hello Boisites, my name is ${n}.\nI need: ${form.service.value}.\n\n${m}`;
    open(`https://wa.me/${WA}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  });
})();
