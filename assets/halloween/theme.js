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

  // bump this alongside the script tag's ?v= query string whenever
  // theme.css changes, so a stale cached copy can never linger.
  var cssHref = '/assets/halloween/theme.css?v=6';
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
      // Dark body (reads against the site's normal light backgrounds,
      // no page-background changes needed) with pale eyes for contrast
      // against the dark body itself.
      var id = nextGradId();
      var w = size, h = size * 1.07;
      var svg = svgEl('svg', { width: w, height: h, viewBox: '0 0 60 64' });
      var defs = svgEl('defs', {});
      var grad = svgEl('linearGradient', { id: id, x1: '0', y1: '0', x2: '0', y2: '1' });
      var stop1 = svgEl('stop', { offset: '0%', 'stop-color': '#3A3245' });
      var stop2 = svgEl('stop', { offset: '100%', 'stop-color': '#211C2B' });
      grad.appendChild(stop1); grad.appendChild(stop2);
      defs.appendChild(grad);
      svg.appendChild(defs);
      var body = svgEl('path', {
        d: 'M30,4 C43,4 52,15 52,30 L52,56 C52,58 49,59 47,57 L43,53 C41,51 38,51 36,53 L33,56 C31,58 29,58 27,56 L24,53 C22,51 19,51 17,53 L13,57 C11,59 8,58 8,56 L8,30 C8,15 17,4 30,4 Z',
        fill: 'url(#' + id + ')',
        stroke: 'rgba(0,0,0,0.3)',
        'stroke-width': '1',
        opacity: opacity || 0.8
      });
      svg.appendChild(body);
      var eyeL = svgEl('ellipse', { cx: '21', cy: '28', rx: '2.8', ry: '3.4', fill: '#F2E9D8', opacity: opacity || 0.8 });
      var eyeR = svgEl('ellipse', { cx: '39', cy: '28', rx: '2.8', ry: '3.4', fill: '#F2E9D8', opacity: opacity || 0.8 });
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

    function pumpkinSVG(size, jackOLantern) {
      // Real pumpkin-orange with a radial gradient for roundness (not
      // a flat silhouette), five ribbed lobes with visible ridge
      // shadows, a glossy highlight, a proper curved stem, and
      // optionally a carved glowing jack-o'-lantern face.
      var id = nextGradId();
      var svg = svgEl('svg', { width: size, height: size * 0.85, viewBox: '0 0 60 50' });
      var defs = svgEl('defs', {});
      var grad = svgEl('radialGradient', { id: id, cx: '38%', cy: '32%', r: '75%' });
      grad.appendChild(svgEl('stop', { offset: '0%', 'stop-color': '#FFA94D' }));
      grad.appendChild(svgEl('stop', { offset: '55%', 'stop-color': '#EA7317' }));
      grad.appendChild(svgEl('stop', { offset: '100%', 'stop-color': '#A84A08' }));
      defs.appendChild(grad);
      svg.appendChild(defs);

      var shell = 'url(#' + id + ')', line = '#8A3A0A';
      [[13, 30, 10, 15], [22, 28.5, 11, 17], [30, 27, 12, 18], [38, 28.5, 11, 17], [47, 30, 10, 15]].forEach(function (lobe) {
        svg.appendChild(svgEl('ellipse', { cx: lobe[0], cy: lobe[1], rx: lobe[2], ry: lobe[3], fill: shell, stroke: '#7A3307', 'stroke-width': '0.8' }));
      });
      [13, 22, 30, 38, 47].forEach(function (x) {
        svg.appendChild(svgEl('path', {
          d: 'M' + x + ' 13 Q' + (x + (x < 30 ? -2.5 : x > 30 ? 2.5 : 0)) + ' 29 ' + x + ' 45',
          stroke: line, 'stroke-width': '1', fill: 'none', opacity: '0.4'
        }));
      });
      svg.appendChild(svgEl('ellipse', { cx: '22', cy: '20', rx: '7', ry: '5', fill: '#FFD9A0', opacity: '0.35' }));

      svg.appendChild(svgEl('path', {
        d: 'M30 11 C28 7 30 3 34 2', stroke: '#5A7A2A', 'stroke-width': '3.4', fill: 'none', 'stroke-linecap': 'round'
      }));
      svg.appendChild(svgEl('path', {
        d: 'M30 11 C28 7 30 3 34 2', stroke: '#3F5A1C', 'stroke-width': '1.2', fill: 'none', 'stroke-linecap': 'round', opacity: '0.6'
      }));
      svg.appendChild(svgEl('path', {
        d: 'M33 4 Q39 1 42 6 Q37 8 33 4 Z', fill: '#4A7A2F'
      }));

      if (jackOLantern) {
        var glow = '#FFC869';
        svg.appendChild(svgEl('path', { d: 'M19 23 L27 23 L23 32 Z', fill: glow }));
        svg.appendChild(svgEl('path', { d: 'M41 23 L33 23 L37 32 Z', fill: glow }));
        svg.appendChild(svgEl('path', { d: 'M27 33 L33 33 L30 38.5 Z', fill: glow }));
        svg.appendChild(svgEl('path', {
          d: 'M15 40 L19.5 35.5 L24 40 L28.5 35.5 L33 40 L37.5 35.5 L42 40 L45 40 L45 43 L15 43 Z',
          fill: glow
        }));
      }
      return svg;
    }

    function webSVG(size, corner) {
      // A real radial web: spokes fanning out from the corner anchor,
      // plus connecting rings woven between them -- not just parallel
      // diagonal lines, which is what read as scratch marks before.
      var svg = svgEl('svg', { width: size, height: size, viewBox: '0 0 ' + size + ' ' + size });
      var anchor = corner === 'tr' ? { x: size, y: 0 } : { x: 0, y: 0 };
      var endpoints = corner === 'tr'
        ? [{ x: 0, y: size * 0.12 }, { x: 0, y: size * 0.55 }, { x: size * 0.3, y: size * 0.92 }, { x: size * 0.65, y: size }, { x: size, y: size }]
        : [{ x: size, y: size * 0.12 }, { x: size, y: size * 0.55 }, { x: size * 0.7, y: size * 0.92 }, { x: size * 0.35, y: size }, { x: 0, y: size }];
      var color = 'rgba(46,40,56,0.4)';

      endpoints.forEach(function (pt) {
        svg.appendChild(svgEl('line', { x1: anchor.x, y1: anchor.y, x2: pt.x, y2: pt.y, stroke: color, 'stroke-width': '0.6' }));
      });
      [0.4, 0.7, 1.0].forEach(function (t) {
        var ringPts = endpoints.map(function (pt) {
          return (anchor.x + (pt.x - anchor.x) * t) + ',' + (anchor.y + (pt.y - anchor.y) * t);
        });
        svg.appendChild(svgEl('polyline', { points: ringPts.join(' '), stroke: color, 'stroke-width': '0.6', fill: 'none' }));
      });
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
    moonSvg.appendChild(svgEl('path', {
      // the subtracted circle must stay fully inside the outer one
      // (distance between centers + its radius <= outer radius) or
      // evenodd produces a venn-diagram XOR instead of a clean bite.
      // Dark fill so it reads against the site's normal light pages.
      d: fullCirclePath(45, 45, 30) + ' ' + fullCirclePath(50, 39, 22),
      'fill-rule': 'evenodd',
      fill: '#2E2838', opacity: '0.4'
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

    // spiders hanging from a thread, over a real radial web (desktop only)
    if (!isMobile) {
      [{ top: '0', right: '6%', threadLen: 40, spiderCls: '', webCorner: 'tr', webSize: 80 },
       { top: '0', left: '8%', threadLen: 28, spiderCls: 'wlg-h-spider-b', webCorner: 'tl', webSize: 60 }].forEach(function (spec) {
        var corner = document.createElement('div');
        corner.style.position = 'absolute';
        corner.style.top = spec.top;
        if (spec.right) corner.style.right = spec.right; else corner.style.left = spec.left;
        corner.style.zIndex = '5';

        var webWrap = document.createElement('div');
        webWrap.style.position = 'absolute';
        webWrap.style.top = '0';
        if (spec.right) webWrap.style.right = '0'; else webWrap.style.left = '0';
        webWrap.appendChild(webSVG(spec.webSize, spec.webCorner));
        corner.appendChild(webWrap);

        var thread = document.createElement('div');
        thread.style.width = '1px';
        thread.style.height = spec.threadLen + 'px';
        thread.style.background = 'rgba(11,10,13,0.3)';
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

    // pumpkins tucked into empty corners -- full-size now, one lit as
    // a jack-o'-lantern
    var pumpkinSpecs = isMobile
      ? [{ bottom: '3%', left: '3%', size: 72, lit: true }]
      : [
          { bottom: '4%', left: '3%', size: 96, lit: true },
          { bottom: '8%', right: '4%', size: 70, lit: false }
        ];
    pumpkinSpecs.forEach(function (spec) {
      var wrap = document.createElement('div');
      wrap.appendChild(pumpkinSVG(spec.size, spec.lit));
      var style = { bottom: spec.bottom, zIndex: '3', opacity: '0.9' };
      if (spec.left) style.left = spec.left; else style.right = spec.right;
      addDeco(wrap, '', style);
    });

    // homepage only: a couple of pumpkins peeking out from behind real
    // game cards, anchored to each card's actual on-screen position
    // (not a guessed percentage) so they line up at any viewport size.
    if (!isMobile) {
      var cards = document.querySelectorAll('.grid .card');
      if (cards.length >= 6) {
        var peekSpecs = [
          { cardIndex: 0, corner: 'bottom-right', size: 78, lit: true },
          { cardIndex: 4, corner: 'bottom-left', size: 66, lit: false }
        ];
        peekSpecs.forEach(function (spec) {
          var card = cards[spec.cardIndex];
          if (!card) return;
          var rect = card.getBoundingClientRect();
          var wrap = document.createElement('div');
          wrap.appendChild(pumpkinSVG(spec.size, spec.lit));
          wrap.style.position = 'absolute';
          // Negative, not positive: static in-flow content (the card)
          // paints after positive/zero z-index but after negative
          // z-index too -- so this has to be negative to actually
          // render behind the card instead of on top of it.
          wrap.style.zIndex = '-1';
          wrap.style.pointerEvents = 'none';
          var peekAmount = spec.size * 0.35;
          // Appended to document.body (not the fixed decoration layer)
          // and positioned in document coordinates (rect + scroll
          // offset), so it scrolls together with the actual card
          // instead of staying pinned to the viewport and drifting
          // away from it the moment the page scrolls.
          if (spec.corner === 'bottom-right') {
            wrap.style.top = (rect.bottom + window.scrollY - spec.size * 0.6) + 'px';
            wrap.style.left = (rect.right + window.scrollX - peekAmount) + 'px';
          } else {
            wrap.style.top = (rect.bottom + window.scrollY - spec.size * 0.6) + 'px';
            wrap.style.left = (rect.left + window.scrollX - (spec.size - peekAmount)) + 'px';
          }
          document.body.appendChild(wrap);
        });
      }
    }

    // particles
    if (!isMobile) {
      var particleColors = ['#FF7518', '#B84DFF', '#2E2838', '#FF7518', '#B84DFF'];
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
