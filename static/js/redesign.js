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

  /* ---------- Contact: compose a mailto ---------- */
  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var to = form.getAttribute('data-mailto') || '';
      var name = (document.getElementById('f-name') || {}).value || '';
      var mail = (document.getElementById('f-mail') || {}).value || '';
      var subj = (document.getElementById('f-subj') || {}).value || ('Portfolio enquiry from ' + name);
      var msg = (document.getElementById('f-msg') || {}).value || '';
      var body = msg + '\n\n— ' + name + (mail ? ' (' + mail + ')' : '');
      var href = 'mailto:' + to + '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(body);
      var status = document.getElementById('form-status');
      if (status) status.textContent = 'Opening your email client…';
      window.location.href = href;
    });
  }

  /* ---------- Hero synapse-network canvas ---------- */
  var canvas = document.getElementById('synapse-net');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var nodes = [], w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), raf = null, visible = true;
  var MAXD = 150;

  function isLight() { return document.documentElement.classList.contains('light'); }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    w = rect.width; h = rect.height;
    canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var target = Math.min(72, Math.floor((w * h) / 15000));
    nodes = [];
    for (var i = 0; i < target; i++) {
      nodes.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35
      });
    }
  }

  function draw(move) {
    ctx.clearRect(0, 0, w, h);
    var light = isLight();
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (move) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }
      for (var j = i + 1; j < nodes.length; j++) {
        var m = nodes[j], dx = n.x - m.x, dy = n.y - m.y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < MAXD) {
          var a = (1 - d / MAXD) * (light ? 0.22 : 0.32);
          var t = (n.x + m.x) / (2 * w); // horizontal position → blue→purple
          var r = Math.round(16 + t * 154), g = Math.round(90 - t * 30), b = Math.round(180 + t * 9);
          ctx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(m.x, m.y); ctx.stroke();
        }
      }
    }
    for (var k = 0; k < nodes.length; k++) {
      ctx.beginPath();
      ctx.arc(nodes[k].x, nodes[k].y, 1.6, 0, Math.PI * 2);
      ctx.fillStyle = light ? 'rgba(120,70,160,.55)' : 'rgba(190,160,225,.75)';
      ctx.fill();
    }
  }

  function loop() { draw(true); raf = requestAnimationFrame(loop); }
  function start() { if (!raf && visible && !reduceMotion) loop(); }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

  resize();
  window.addEventListener('resize', function () { resize(); if (reduceMotion) draw(false); });

  if (reduceMotion) {
    draw(false);
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
