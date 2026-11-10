/* 冯老师 · 深圳初高数学 —— 站点交互 */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  /* ---------- 阅读进度条 ---------- */
  var bar = document.createElement('div');
  bar.className = 'progress';
  document.body.appendChild(bar);

  function onScrollProgress() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var p = max > 0 ? (h.scrollTop / max) * 100 : 0;
    bar.style.width = p.toFixed(2) + '%';
  }

  /* ---------- 吸顶导航 ---------- */
  var nav = document.getElementById('nav');
  function onScrollNav() {
    if (window.scrollY > 12) nav.classList.add('is-stuck');
    else nav.classList.remove('is-stuck');
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      onScrollProgress();
      onScrollNav();
      ticking = false;
    });
  }, { passive: true });
  onScrollProgress();
  onScrollNav();

  /* ---------- 移动端菜单 ---------- */
  var burger = document.getElementById('burger');
  var links = document.getElementById('navLinks');

  function closeMenu() {
    links.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', '打开菜单');
  }

  burger.addEventListener('click', function () {
    var open = links.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
  });

  links.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') closeMenu();
  });

  document.addEventListener('click', function (e) {
    if (!links.classList.contains('is-open')) return;
    if (links.contains(e.target) || burger.contains(e.target)) return;
    closeMenu();
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 720) closeMenu();
  });

  /* ---------- 滚动渐入 ---------- */
  var revealEls = [].slice.call(document.querySelectorAll('.reveal'));
  if (reduced || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var i = revealEls.indexOf(el);
        var delay = (i % 4) * 70;
        setTimeout(function () { el.classList.add('is-in'); }, delay);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 案例分数条 ---------- */
  var rows = [].slice.call(document.querySelectorAll('.case-row'));
  if (reduced || !('IntersectionObserver' in window)) {
    rows.forEach(function (r) { r.classList.add('is-in'); });
  } else {
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var r = en.target;
        var idx = [].indexOf.call(r.parentNode.children, r);
        setTimeout(function () { r.classList.add('is-in'); }, Math.min(idx, 11) * 55);
        io2.unobserve(r);
      });
    }, { threshold: 0.2 });
    rows.forEach(function (r) { io2.observe(r); });
  }

  /* ---------- 数字滚动 ---------- */
  var counters = [].slice.call(document.querySelectorAll('.stat b[data-count]'));
  function runCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(target)) return;
    if (reduced) return;
    var unit = el.querySelector('small');
    var unitHTML = unit ? unit.outerHTML : '';
    var dur = 900;
    var t0 = performance.now();
    function frame(t) {
      var k = Math.min(1, (t - t0) / dur);
      var eased = 1 - Math.pow(1 - k, 3);
      var val = Math.round(target * eased);
      el.innerHTML = val + unitHTML;
      if (k < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  if ('IntersectionObserver' in window) {
    var io3 = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        runCount(en.target);
        io3.unobserve(en.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { io3.observe(c); });
  }

  /* ---------- 学段切换 ---------- */
  var tabs = [].slice.call(document.querySelectorAll('.tab'));
  var panels = {
    high: document.getElementById('tab-high'),
    mid: document.getElementById('tab-mid')
  };

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var key = tab.getAttribute('data-tab');
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      Object.keys(panels).forEach(function (k) {
        var p = panels[k];
        if (!p) return;
        var on = k === key;
        p.classList.toggle('is-on', on);
        if (on) p.removeAttribute('hidden');
        else p.setAttribute('hidden', '');
      });
      // 新面板里的分数条重新起播
      var active = panels[key];
      if (active) {
        [].slice.call(active.querySelectorAll('.case-row')).forEach(function (r, i) {
          r.classList.remove('is-in');
          setTimeout(function () { r.classList.add('is-in'); }, 60 + i * 55);
        });
      }
    });
  });

  /* ---------- 灯箱 ---------- */
  var figs = [].slice.call(document.querySelectorAll('.fb'));
  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lbImg');
  var lbCap = document.getElementById('lbCap');
  var lbClose = document.getElementById('lbClose');
  var lbPrev = document.getElementById('lbPrev');
  var lbNext = document.getElementById('lbNext');
  var cur = 0;
  var lastFocus = null;

  function captionOf(fig) {
    var cap = fig.querySelector('figcaption');
    if (!cap) return '';
    return cap.innerHTML.replace(/<br\s*\/?>/gi, ' ');
  }

  function show(i) {
    if (!figs.length) return;
    cur = (i + figs.length) % figs.length;
    var fig = figs[cur];
    var img = fig.querySelector('img');
    lbImg.src = img.getAttribute('src');
    lbImg.alt = img.getAttribute('alt') || '';
    lbCap.innerHTML = captionOf(fig);
  }

  function openLb(i) {
    lastFocus = document.activeElement;
    show(i);
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  }

  function closeLb() {
    lb.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  figs.forEach(function (fig, i) {
    fig.addEventListener('click', function () { openLb(i); });
    fig.setAttribute('role', 'button');
    fig.setAttribute('tabindex', '0');
    fig.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLb(i);
      }
    });
  });

  lbClose.addEventListener('click', closeLb);
  lbPrev.addEventListener('click', function () { show(cur - 1); });
  lbNext.addEventListener('click', function () { show(cur + 1); });

  lb.addEventListener('click', function (e) {
    if (e.target === lb) closeLb();
  });

  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    else if (e.key === 'ArrowLeft') show(cur - 1);
    else if (e.key === 'ArrowRight') show(cur + 1);
  });

  /* ---------- 导航高亮 ---------- */
  var navAnchors = [].slice.call(document.querySelectorAll('.nav-links a'));
  var sections = navAnchors
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var io4 = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = '#' + en.target.id;
        navAnchors.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { io4.observe(s); });
  }
})();
