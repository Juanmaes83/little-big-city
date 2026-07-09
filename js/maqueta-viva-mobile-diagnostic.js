/*
 * TEMPORARY mobile render diagnostic — Maqueta Viva 3D.
 * Investigation instrumentation ONLY. Does NOTHING unless the URL has debug=1.
 *
 * Purpose: capture, from a REAL mobile device, the exact state of the render
 * layers so we can prove what the phone is actually showing (ClayGL 3D canvas
 * vs maptalks/OSM map vs a fallback) instead of guessing.
 *
 * HOW TO REVERT (fully): delete this file and remove the single <script> tag
 * that references it in maqueta-viva-torrevieja.html. Nothing else depends on it.
 */
(function () {
  'use strict';

  function hasDebug() {
    try {
      return new URLSearchParams(window.location.search).get('debug') === '1';
    } catch (e) {
      return false;
    }
  }
  if (!hasDebug()) return; // production: strict no-op

  var runtimeErrors = [];
  window.addEventListener('error', function (e) {
    runtimeErrors.push((e && e.message) || 'error');
  });
  window.addEventListener('unhandledrejection', function (e) {
    runtimeErrors.push('rejection: ' + ((e && e.reason && String(e.reason)) || '?'));
  });

  function rectOf(el) {
    if (!el) return null;
    var r = el.getBoundingClientRect();
    return {
      x: Math.round(r.x),
      y: Math.round(r.y),
      w: Math.round(r.width),
      h: Math.round(r.height)
    };
  }

  function styleOf(el) {
    if (!el) return null;
    var s = getComputedStyle(el);
    return {
      display: s.display,
      visibility: s.visibility,
      opacity: s.opacity,
      zIndex: s.zIndex,
      position: s.position,
      left: s.left,
      top: s.top,
      transform: s.transform === 'none' ? 'none' : s.transform,
      pointerEvents: s.pointerEvents,
      background: (s.backgroundImage && s.backgroundImage !== 'none') ? 'image' : s.backgroundColor
    };
  }

  function isElementVisible(el) {
    if (!el) return false;
    var s = getComputedStyle(el);
    var r = el.getBoundingClientRect();
    return (
      s.display !== 'none' &&
      s.visibility !== 'hidden' &&
      parseFloat(s.opacity) > 0.01 &&
      r.width > 1 &&
      r.height > 1 &&
      r.x + r.width > 0 &&
      r.x < window.innerWidth &&
      r.y + r.height > 0 &&
      r.y < window.innerHeight
    );
  }

  function webglInfo(canvas) {
    var out = { available: false, contextLost: null, vendor: null, renderer: null };
    if (!canvas || !canvas.getContext) return out;
    var gl = null;
    try {
      gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    } catch (e) {
      out.error = String(e);
      return out;
    }
    if (!gl) return out;
    out.available = true;
    out.type = gl.constructor && gl.constructor.name;
    try {
      out.contextLost = gl.isContextLost ? gl.isContextLost() : null;
      out.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      var dbg = gl.getExtension('WEBGL_debug_renderer_info');
      if (dbg) {
        out.vendor = gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL);
        out.renderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
      }
    } catch (e) {
      out.paramError = String(e);
    }
    return out;
  }

  function resourcesByTag(selector, attr) {
    return [].slice.call(document.querySelectorAll(selector)).map(function (el) {
      return el.getAttribute(attr) || '';
    });
  }

  function engineFeatures() {
    var panel = document.getElementById('maqueta-engine-debug');
    if (!panel) return null;
    var txt = panel.innerText || '';
    var out = {};
    var zone = txt.match(/"zone":\s*"([^"]+)"/);
    var b = txt.match(/"buildings":\s*(\d+)/);
    var r = txt.match(/"roads":\s*(\d+)/);
    var w = txt.match(/"water":\s*(\d+)/);
    var tile = txt.match(/"x":\s*(\d+),\s*"y":\s*(\d+)/);
    if (zone) out.zone = zone[1];
    out.buildings = b ? +b[1] : null;
    out.roads = r ? +r[1] : null;
    out.water = w ? +w[1] : null;
    if (tile) out.tile = { x: +tile[1], y: +tile[2] };
    return out;
  }

  function collect() {
    var vp = document.getElementById('viewport');
    var mapEl = document.getElementById('map');
    var mapMain = document.getElementById('map-main');

    var canvasEls = [].slice.call(document.querySelectorAll('canvas'));
    var canvases = canvasEls.map(function (c, i) {
      var s = getComputedStyle(c);
      var r = c.getBoundingClientRect();
      var parent = c.parentElement;
      return {
        i: i,
        parent: parent ? (parent.id || parent.className || parent.tagName) : null,
        className: c.className || '',
        width: c.width,
        height: c.height,
        rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
        display: s.display,
        visibility: s.visibility,
        opacity: s.opacity,
        zIndex: s.zIndex,
        pointerEvents: s.pointerEvents,
        visible: isElementVisible(c)
      };
    });

    var clayCanvas = vp ? vp.querySelector('canvas') : null;
    var maptalksCanvas = document.querySelector('.maptalks-canvas-layer canvas, .maptalks-layer canvas, #map-main canvas');

    var cx = Math.round(window.innerWidth / 2);
    var cy = Math.round(window.innerHeight / 2);
    var topEl = document.elementFromPoint(cx, cy);
    var topChain = [];
    var e = topEl;
    for (var k = 0; k < 6 && e; k++) {
      topChain.push(e.id ? '#' + e.id : (e.tagName + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : '')));
      e = e.parentElement;
    }

    var params = {};
    try {
      new URLSearchParams(window.location.search).forEach(function (v, k) { params[k] = v; });
    } catch (e2) { /* ignore */ }

    return {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      platform: navigator.platform || (navigator.userAgentData && navigator.userAgentData.platform) || null,
      viewport: { innerWidth: window.innerWidth, innerHeight: window.innerHeight },
      visualViewport: window.visualViewport
        ? { width: Math.round(window.visualViewport.width), height: Math.round(window.visualViewport.height), scale: window.visualViewport.scale, offsetTop: Math.round(window.visualViewport.offsetTop) }
        : null,
      devicePixelRatio: window.devicePixelRatio,
      params: params,
      loadedScripts: resourcesByTag('script[src]', 'src'),
      loadedStyles: resourcesByTag('link[rel="stylesheet"]', 'href'),
      canvasCount: canvases.length,
      canvases: canvases,
      centerPoint: {
        x: cx,
        y: cy,
        topElementChain: topChain,
        topTag: topEl ? topEl.tagName : null,
        isClayCanvas: !!(topEl && vp && vp.contains(topEl) && topEl.tagName === 'CANVAS')
      },
      viewport_el: { rect: rectOf(vp), style: styleOf(vp) },
      map_el: { rect: rectOf(mapEl), style: styleOf(mapEl) },
      mapMain_el: { rect: rectOf(mapMain), style: styleOf(mapMain) },
      webgl: webglInfo(clayCanvas),
      clayCanvasVisible: isElementVisible(clayCanvas),
      maptalksCanvasVisible: isElementVisible(maptalksCanvas),
      engine: engineFeatures(),
      lastRuntimeError: window.MAQUETA_LAST_RUNTIME_ERROR || null,
      runtimeErrors: runtimeErrors.slice(-8)
    };
  }

  // Expose for console / automated capture.
  window.maquetaMobileDiagnostic = collect;

  function buildButton() {
    if (document.getElementById('maqueta-mobile-diag-btn')) return;
    var btn = document.createElement('button');
    btn.id = 'maqueta-mobile-diag-btn';
    btn.type = 'button';
    btn.textContent = 'Copiar diagnostico movil';
    btn.setAttribute('style', [
      'position:fixed', 'z-index:2147483647', 'top:calc(8px + env(safe-area-inset-top))',
      'left:50%', 'transform:translateX(-50%)', 'padding:10px 16px', 'border-radius:999px',
      'border:2px solid #fff', 'background:#c0392b', 'color:#fff', 'font:700 13px system-ui',
      'box-shadow:0 6px 20px rgba(0,0,0,.4)', 'pointer-events:auto', 'max-width:92vw'
    ].join(';'));

    var out = document.createElement('textarea');
    out.id = 'maqueta-mobile-diag-out';
    out.readOnly = true;
    out.setAttribute('style', [
      'position:fixed', 'z-index:2147483646', 'top:calc(52px + env(safe-area-inset-top))',
      'left:4vw', 'width:92vw', 'height:40vh', 'display:none', 'background:#0b0b0b',
      'color:#7CFC98', 'font:11px/1.4 monospace', 'border:1px solid #444', 'border-radius:10px',
      'padding:10px', 'white-space:pre', 'overflow:auto'
    ].join(';'));

    btn.addEventListener('click', function () {
      var json = JSON.stringify(collect(), null, 2);
      out.value = json;
      out.style.display = out.style.display === 'none' ? 'block' : 'none';
      var done = function (ok) {
        btn.textContent = ok ? 'Copiado ✓ (pegalo aqui)' : 'Selecciona el texto y copia';
        window.setTimeout(function () { btn.textContent = 'Copiar diagnostico movil'; }, 2600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(json).then(function () { done(true); }, function () {
          out.style.display = 'block'; out.focus(); out.select(); done(false);
        });
      } else {
        out.style.display = 'block'; out.focus(); out.select();
        try { done(document.execCommand('copy')); } catch (e) { done(false); }
      }
    });

    document.body.appendChild(btn);
    document.body.appendChild(out);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { window.setTimeout(buildButton, 1200); });
  } else {
    window.setTimeout(buildButton, 1200);
  }
})();
