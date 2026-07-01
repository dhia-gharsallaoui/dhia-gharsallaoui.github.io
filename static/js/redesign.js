/* Synapse Dark Redesign — interactions */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Theme toggle ---------- */
  var toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var isLight = document.documentElement.classList.toggle('light');
      try { localStorage.setItem('pref-theme', isLight ? 'light' : 'dark'); } catch (e) {}
    });
  }

  /* ---------- Nav: scrolled state + mobile menu ---------- */
  var nav = document.getElementById('nav');
  var onScroll = function () { if (nav) nav.classList.toggle('scrolled', window.scrollY > 12); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  var burger = document.getElementById('nav-burger');
  if (burger && nav) {
    burger.addEventListener('click', function () { nav.classList.toggle('open'); });
    nav.querySelectorAll('#nav-links a').forEach(function (a) {
      a.addEventListener('click', function () { nav.classList.remove('open'); });
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  } else {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { ro.observe(el); });
  }

  /* ---------- Experience: show all bullets ---------- */
  document.querySelectorAll('.tl-more').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var list = btn.parentElement.querySelector('.tl-list');
      if (list) list.classList.remove('collapsed');
      btn.style.display = 'none';
    });
  });

  /* ---------- Contact: submit via Web3Forms (no email exposed) ---------- */
  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var status = document.getElementById('form-status');
      var btn = form.querySelector('button[type="submit"]');
      var payload = {};
      new FormData(form).forEach(function (v, k) { payload[k] = v; });
      if (status) { status.style.color = ''; status.textContent = 'Sending…'; }
      if (btn) btn.disabled = true;
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (j.success) {
            if (status) status.textContent = "Thanks — your message is on its way. I'll get back to you soon.";
            form.reset();
          } else {
            if (status) { status.style.color = '#ff6b6b'; status.textContent = j.message || 'Something went wrong. Please try again.'; }
          }
        })
        .catch(function () {
          if (status) { status.style.color = '#ff6b6b'; status.textContent = 'Network error — please try again, or reach me on LinkedIn.'; }
        })
        .then(function () { if (btn) btn.disabled = false; });
    });
  }

  /* ---------- Hero synapse-network canvas (cursor-reactive) ---------- */
  var canvas = document.getElementById('synapse-net');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var nodes = [], W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), raf = null, visible = true;
  var mx = -9999, my = -9999;              // cursor position in canvas space
  var LINK = 130, LINK2 = LINK * LINK;
  var BLUE = [16, 153, 234], PURPLE = [170, 59, 189];

  function isLight() { return document.documentElement.classList.contains('light'); }
  function mix(a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height;
    canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var count = Math.min(140, Math.max(50, Math.round((W * H) / 14000)));
    nodes = [];
    for (var i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.32, vy: (Math.random() - 0.5) * 0.32,
        r: 1.1 + Math.random() * 1.7, ph: Math.random() * 6.28
      });
    }
  }

  function frame(now, move) {
    var t = now * 0.001, light = isLight();
    var lineBase = light ? 0.20 : 0.16, nodeBase = light ? 0.5 : 0.35;
    ctx.clearRect(0, 0, W, H);

    // move + gentle cursor attraction
    if (move) {
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < -20) n.x = W + 20; if (n.x > W + 20) n.x = -20;
        if (n.y < -20) n.y = H + 20; if (n.y > H + 20) n.y = -20;
        var adx = mx - n.x, ady = my - n.y, ad2 = adx * adx + ady * ady;
        if (ad2 < 48400 && ad2 > 100) { var ad = Math.sqrt(ad2); n.x += adx / ad * 0.5; n.y += ady / ad * 0.5; }
      }
    }

    // links (brighten / thicken / shift purple near the cursor)
    for (var a1 = 0; a1 < nodes.length; a1++) {
      var A = nodes[a1];
      for (var b1 = a1 + 1; b1 < nodes.length; b1++) {
        var B = nodes[b1];
        var dx = A.x - B.x; if (dx > LINK || dx < -LINK) continue;
        var dy = A.y - B.y; if (dy > LINK || dy < -LINK) continue;
        var d2 = dx * dx + dy * dy; if (d2 > LINK2) continue;
        var midx = (A.x + B.x) / 2, midy = (A.y + B.y) / 2;
        var md = Math.sqrt((midx - mx) * (midx - mx) + (midy - my) * (midy - my));
        var heat = Math.max(0, 1 - md / 240);
        var col = mix(BLUE, PURPLE, Math.min(1, midx / W * 0.7 + heat * 0.8));
        var alpha = (1 - Math.sqrt(d2) / LINK) * (lineBase + heat * 0.5);
        ctx.strokeStyle = 'rgba(' + (col[0] | 0) + ',' + (col[1] | 0) + ',' + (col[2] | 0) + ',' + alpha + ')';
        ctx.lineWidth = heat > 0.25 ? 1.2 : 0.7;
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
      }
    }

    // nodes (activate + twinkle + glow near the cursor)
    for (var c1 = 0; c1 < nodes.length; c1++) {
      var N = nodes[c1];
      var ndx = N.x - mx, ndy = N.y - my;
      var heatN = Math.max(0, 1 - Math.sqrt(ndx * ndx + ndy * ndy) / 240);
      var colN = mix(BLUE, PURPLE, Math.min(1, N.x / W * 0.7 + heatN * 0.8));
      var tw = 0.65 + 0.35 * Math.sin(t * 1.8 + N.ph);
      var alphaN = (nodeBase + 0.55 * heatN) * tw;
      var r = N.r * (1 + heatN * 0.9);
      ctx.fillStyle = 'rgba(' + (colN[0] | 0) + ',' + (colN[1] | 0) + ',' + (colN[2] | 0) + ',' + alphaN + ')';
      ctx.beginPath(); ctx.arc(N.x, N.y, r, 0, 6.2832); ctx.fill();
      if (heatN > 0.4) {
        ctx.fillStyle = 'rgba(' + (colN[0] | 0) + ',' + (colN[1] | 0) + ',' + (colN[2] | 0) + ',' + (heatN * 0.12) + ')';
        ctx.beginPath(); ctx.arc(N.x, N.y, r * 3.2, 0, 6.2832); ctx.fill();
      }
    }
  }

  function loop(now) { frame(now || 0, true); raf = requestAnimationFrame(loop); }
  function start() { if (!raf && visible && !reduceMotion) raf = requestAnimationFrame(loop); }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

  resize();
  window.addEventListener('resize', function () { resize(); if (reduceMotion) frame(0, false); }, { passive: true });
  window.addEventListener('pointermove', function (e) {
    var r = canvas.getBoundingClientRect();
    mx = e.clientX - r.left; my = e.clientY - r.top;
  }, { passive: true });
  document.addEventListener('pointerleave', function () { mx = my = -9999; }, { passive: true });

  if (reduceMotion) {
    mx = W * 0.68; my = H * 0.42; frame(0, false);   // one static, gently-activated frame
  } else {
    var hero = document.getElementById('hero');
    if ('IntersectionObserver' in window && hero) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start(); else stop();
      }, { threshold: 0.01 }).observe(hero);
    }
    start();
  }
})();
