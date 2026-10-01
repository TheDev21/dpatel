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
  var cssHref = '/assets/halloween/theme.css?v=10';
  if (!document.querySelector('link[href="' + cssHref + '"]')) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssHref;
    document.head.appendChild(link);
  }

  function init() {
    var isMobile = window.innerWidth < 640;
    var isHomepage = !!document.getElementById('grid');

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

    var IMG_BASE = '/assets/halloween/img/';
    function photoEl(name, widthPx) {
      var img = document.createElement('img');
      img.src = IMG_BASE + name;
      img.alt = '';
      img.style.display = 'block';
      img.style.width = widthPx + 'px';
      img.style.height = 'auto';
      return img;
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

    // bats -- one or two lone bats on the real flight paths, plus one
    // flock photo drifting across on its own slower path
    var batSpecs = isMobile
      ? [{ cls: 'wlg-h-bat-a', top: '14%', w: 46 }]
      : [
          { cls: 'wlg-h-bat-a', top: '12%', w: 60 },
          { cls: 'wlg-h-bat-c', top: '6%', w: 46 }
        ];
    batSpecs.forEach(function (spec) {
      var wrap = document.createElement('div');
      wrap.appendChild(photoEl('bat-single.png', spec.w));
      addDeco(wrap, spec.cls, { top: spec.top, left: '0', zIndex: '4' });
    });
    if (!isMobile) {
      var flockWrap = document.createElement('div');
      flockWrap.appendChild(photoEl('bat-flock.png', 170));
      addDeco(flockWrap, 'wlg-h-bat-b', { top: '20%', left: '0', zIndex: '4', opacity: '0.85' });
    }

    // ghosts -- bigger, and now cross the full screen edge-to-edge
    // (see wlgGhostA/B/C in theme.css) instead of wobbling in place
    var ghostSpecs = isMobile
      ? [{ cls: 'wlg-h-ghost-a', top: '28%', left: '0', w: 100, op: 0.75 }]
      : [
          { cls: 'wlg-h-ghost-a', top: '16%', left: '0', w: 150, op: 0.8 },
          { cls: 'wlg-h-ghost-b', top: '46%', left: '0', w: 130, op: 0.7 },
          { cls: 'wlg-h-ghost-c', top: '68%', left: '0', w: 110, op: 0.65 },
          { cls: 'wlg-h-ghost-a', top: '32%', left: '0', w: 95, op: 0.55, delay: '16s' }
        ];
    ghostSpecs.forEach(function (spec) {
      var wrap = document.createElement('div');
      var img = photoEl('ghost-single.png', spec.w);
      img.style.opacity = spec.op;
      wrap.appendChild(img);
      var style = { top: spec.top, left: spec.left, zIndex: '3' };
      if (spec.delay) style.animationDelay = spec.delay;
      addDeco(wrap, spec.cls, style);
    });

    // ghosts rising and vanishing -- homepage only, spread across the
    // full width instead of one blob parked in the middle
    if (isHomepage) {
      var riseSpecs = isMobile
        ? [{ left: '50%', w: 320, delay: 0 }]
        : [
            { left: '16%', w: 380, delay: 0 },
            { left: '50%', w: 460, delay: 0.9 },
            { left: '84%', w: 380, delay: 1.7 }
          ];
      riseSpecs.forEach(function (spec) {
        var riseWrap = document.createElement('div');
        riseWrap.appendChild(photoEl('ghost-flock.png', spec.w));
        addDeco(riseWrap, 'wlg-h-ghost-rise', {
          bottom: '0', left: spec.left, zIndex: '2', animationDelay: spec.delay + 's'
        });
      });
    }

    // spiders -- bigger, spread across the whole top edge (desktop only)
    if (!isMobile) {
      var spiderSpecs = [
        { top: '0', left: '2%', w: 200 },
        { top: '0', left: '34%', w: 170 },
        { top: '0', right: '2%', w: 230 }
      ];
      spiderSpecs.forEach(function (spec) {
        var wrap = document.createElement('div');
        wrap.appendChild(photoEl('spider-group.png', spec.w));
        var style = { top: spec.top, zIndex: '5' };
        if (spec.right) style.right = spec.right; else style.left = spec.left;
        addDeco(wrap, 'wlg-h-spider', style);
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
