/* Weird Little Games -- Halloween seasonal layer loader.
   Active Oct 1-31 (local date). Sets data-theme="halloween" on <html>
   (which theme.css uses for its palette override) and injects a
   fixed, pointer-events:none decoration layer behind page content.
   Does nothing outside the season -- no DOM changes, no CSS loaded. */
(function () {
  'use strict';

  function isHalloweenSeason() {
    try {
      var override = new URLSearchParams(location.search).get('season');
      if (override === 'halloween') return true;
      if (override === 'off') return false;
    } catch (e) {}
    var now = new Date();
    return now.getMonth() === 9; // October, 0-indexed
  }

  if (!isHalloweenSeason()) return;

  document.documentElement.setAttribute('data-theme', 'halloween');

  var cssHref = '/assets/halloween/theme.css';
  if (!document.querySelector('link[href="' + cssHref + '"]')) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssHref;
    document.head.appendChild(link);
  }

  function init() {
    var isMobile = window.innerWidth < 640;

    var layer = document.createElement('div');
    layer.id = 'wlg-halloween-layer';
    layer.setAttribute('aria-hidden', 'true');

    var gradId = 0;
    function nextGradId() { gradId++; return 'wlgGhostGrad' + gradId; }

    function svgEl(tag, attrs) {
      var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
      for (var k in attrs) el.setAttribute(k, attrs[k]);
      return el;
    }

    function ghostSVG(size, opacity) {
      var id = nextGradId();
      var w = size, h = size * 1.07;
      var svg = svgEl('svg', { width: w, height: h, viewBox: '0 0 60 64' });
      var defs = svgEl('defs', {});
      var grad = svgEl('linearGradient', { id: id, x1: '0', y1: '0', x2: '0', y2: '1' });
      var stop1 = svgEl('stop', { offset: '0%', 'stop-color': '#F7F0E3' });
      var stop2 = svgEl('stop', { offset: '100%', 'stop-color': '#D9CDB8' });
      grad.appendChild(stop1); grad.appendChild(stop2);
      defs.appendChild(grad);
      svg.appendChild(defs);
      var body = svgEl('path', {
        d: 'M30,4 C43,4 52,15 52,30 L52,56 C52,58 49,59 47,57 L43,53 C41,51 38,51 36,53 L33,56 C31,58 29,58 27,56 L24,53 C22,51 19,51 17,53 L13,57 C11,59 8,58 8,56 L8,30 C8,15 17,4 30,4 Z',
        fill: 'url(#' + id + ')',
        stroke: 'rgba(11,10,13,0.5)',
        'stroke-width': '1',
        opacity: opacity || 0.85
      });
      svg.appendChild(body);
      var eyeL = svgEl('ellipse', { cx: '21', cy: '28', rx: '2.8', ry: '3.4', fill: '#241b2e', opacity: opacity || 0.85 });
      var eyeR = svgEl('ellipse', { cx: '39', cy: '28', rx: '2.8', ry: '3.4', fill: '#241b2e', opacity: opacity || 0.85 });
      svg.appendChild(eyeL);
      svg.appendChild(eyeR);
      return svg;
    }

    function batSVG(w, h) {
      // A pure near-black fill is invisible against the theme's own
      // near-black background -- give it a lighter fill plus a soft
      // dark outline so it reads as a silhouette regardless of exactly
      // what's behind it.
      var svg = svgEl('svg', { width: w, height: h, viewBox: '0 0 46 26' });
      var path = svgEl('path', {
        d: 'M23 10 C20 2 10 0 2 6 C9 7 14 10 17 13 C10 13 4 17 0 23 C9 21 16 17 20 13 C21 17 21 21 23 26 C25 21 25 17 26 13 C30 17 37 21 46 23 C42 17 36 13 29 13 C32 10 37 7 44 6 C36 0 26 2 23 10 Z',
        fill: '#4A4458',
        stroke: '#0B0A0D',
        'stroke-width': '0.8'
      });
      svg.appendChild(path);
      return svg;
    }

    function spiderSVG(w, h) {
      var svg = svgEl('svg', { width: w, height: h, viewBox: '0 0 20 16' });
      svg.appendChild(svgEl('ellipse', { cx: '10', cy: '9', rx: '5', ry: '4.2', fill: '#0B0A0D' }));
      svg.appendChild(svgEl('circle', { cx: '10', cy: '4.5', r: '2.6', fill: '#0B0A0D' }));
      svg.appendChild(svgEl('path', {
        d: 'M5 8 L0 5 M5 10 L0 12 M15 8 L20 5 M15 10 L20 12 M6 11 L2 15 M14 11 L18 15',
        stroke: '#0B0A0D', 'stroke-width': '1', fill: 'none', 'stroke-linecap': 'round'
      }));
      return svg;
    }

    function addDeco(el, cls, styleObj) {
      el.classList.add('wlg-h-deco');
      if (cls) el.className += ' ' + cls;
      for (var k in styleObj) el.style[k] = styleObj[k];
      layer.appendChild(el);
      return el;
    }

    // moon -- a solid crescent with a soft glow behind it. Built as one
    // circle minus an offset circle via fill-rule evenodd, which is
    // the reliable way to get a true crescent (a single arc path here
    // self-intersected and silently failed to fill at all).
    function fullCirclePath(cx, cy, r) {
      return 'M' + (cx - r) + ',' + cy +
        ' a' + r + ',' + r + ' 0 1,0 ' + (r * 2) + ',0' +
        ' a' + r + ',' + r + ' 0 1,0 ' + (-r * 2) + ',0 Z';
    }
    var moonWrap = document.createElement('div');
    var moonSvg = svgEl('svg', { width: 90, height: 90, viewBox: '0 0 90 90' });
    var glow = svgEl('circle', { cx: '45', cy: '45', r: '32', fill: '#F2E9D8', opacity: '0.08' });
    glow.style.filter = 'blur(10px)';
    moonSvg.appendChild(glow);
    moonSvg.appendChild(svgEl('path', {
      // the subtracted circle must stay fully inside the outer one
      // (distance between centers + its radius <= outer radius) or
      // evenodd produces a venn-diagram XOR instead of a clean bite.
      d: fullCirclePath(45, 45, 30) + ' ' + fullCirclePath(50, 39, 22),
      'fill-rule': 'evenodd',
      fill: '#F2E9D8', opacity: '0.6'
    }));
    moonWrap.appendChild(moonSvg);
    addDeco(moonWrap, 'wlg-h-moon', { top: '6%', right: '8%', zIndex: '1' });

    // fog
    var fogA = document.createElement('div');
    addDeco(fogA, 'wlg-h-fog-a', {
      bottom: '0', left: '-5%', width: '110%', height: '160px', zIndex: '2',
      background: 'linear-gradient(180deg, transparent, rgba(148,138,126,0.14) 60%, transparent)',
      filter: 'blur(2px)'
    });
    var fogB = document.createElement('div');
    addDeco(fogB, 'wlg-h-fog-b', {
      bottom: '36px', left: '-5%', width: '110%', height: '110px', zIndex: '2',
      background: 'linear-gradient(180deg, transparent, rgba(184,77,255,0.05) 50%, transparent)',
      filter: 'blur(3px)'
    });

    // bats
    var batSpecs = isMobile
      ? [{ cls: 'wlg-h-bat-a', top: '14%', size: 24 }]
      : [
          { cls: 'wlg-h-bat-a', top: '12%', size: 28 },
          { cls: 'wlg-h-bat-b', top: '24%', size: 20 },
          { cls: 'wlg-h-bat-c', top: '6%', size: 24 }
        ];
    batSpecs.forEach(function (spec) {
      var wrap = document.createElement('div');
      wrap.appendChild(batSVG(spec.size, spec.size * 0.565));
      addDeco(wrap, spec.cls, { top: spec.top, left: '0', zIndex: '4' });
    });

    // ghosts
    var ghostSpecs = isMobile
      ? [{ cls: 'wlg-h-ghost-a', top: '30%', left: '8%', size: 40, op: 0.55 }]
      : [
          { cls: 'wlg-h-ghost-a', top: '22%', left: '6%', size: 48, op: 0.6 },
          { cls: 'wlg-h-ghost-b', top: '52%', left: '86%', size: 38, op: 0.5 },
          { cls: 'wlg-h-ghost-c', top: '74%', left: '12%', size: 32, op: 0.45 }
        ];
    ghostSpecs.forEach(function (spec) {
      var wrap = document.createElement('div');
      wrap.appendChild(ghostSVG(spec.size, spec.op));
      addDeco(wrap, spec.cls, { top: spec.top, left: spec.left, zIndex: '3' });
    });

    // spiders hanging from a thread (desktop only) -- no corner web
    // lines, they didn't read well at any size.
    if (!isMobile) {
      [{ top: '0', right: '6%', threadLen: 40, spiderCls: '' },
       { top: '0', left: '8%', threadLen: 28, spiderCls: 'wlg-h-spider-b' }].forEach(function (spec) {
        var corner = document.createElement('div');
        corner.style.position = 'absolute';
        corner.style.top = spec.top;
        if (spec.right) corner.style.right = spec.right; else corner.style.left = spec.left;
        corner.style.zIndex = '5';

        var thread = document.createElement('div');
        thread.style.width = '1px';
        thread.style.height = spec.threadLen + 'px';
        thread.style.background = 'rgba(242,233,216,0.3)';
        thread.style.margin = spec.right ? '0 auto' : '0 0 0 9px';
        corner.appendChild(thread);

        var spiderWrap = document.createElement('div');
        spiderWrap.className = 'wlg-h-spider' + (spec.spiderCls ? ' ' + spec.spiderCls : '');
        spiderWrap.style.margin = spec.right ? '-1px auto 0' : '-1px 0 0 0';
        spiderWrap.appendChild(spiderSVG(18, 14));
        corner.appendChild(spiderWrap);

        corner.classList.add('wlg-h-deco');
        layer.appendChild(corner);
      });
    }

    // particles
    if (!isMobile) {
      var particleColors = ['#FF7518', '#B84DFF', '#F2E9D8', '#FF7518', '#B84DFF'];
      for (var i = 0; i < 5; i++) {
        var p = document.createElement('div');
        var size = (i % 2 === 0) ? 3 : 2;
        addDeco(p, 'wlg-h-particle', {
          top: (55 + i * 8) + '%',
          left: (12 + i * 18) + '%',
          width: size + 'px',
          height: size + 'px',
          background: particleColors[i],
          zIndex: '6',
          animationDelay: (i * 1.4) + 's'
        });
      }
    }

    document.body.insertBefore(layer, document.body.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
