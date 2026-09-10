/* ==========================================================================
   Portfolio - Losseni Zouri
   JavaScript de progression : le site reste entièrement lisible sans lui.
   Modules : en-tête, menu mobile, section active, apparitions au défilement,
   révélation mot à mot, titre décodé, compteurs, inclinaison du portrait, scène 3D du hero,
   copie de l'e-mail. Chaque module vérifie la présence de ses éléments.
   ========================================================================== */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ----------------------------------------------------------------------
     En-tête : ombre et fond plus opaque dès que la page est défilée.
     Une sentinelle observée évite tout écouteur « scroll ».
     ---------------------------------------------------------------------- */
  function initHeader() {
    const header = document.querySelector('.site-header');
    if (!header || !('IntersectionObserver' in window)) return;

    const sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:1px;pointer-events:none;';
    document.body.prepend(sentinel);

    const observer = new IntersectionObserver(function (entries) {
      header.classList.toggle('is-scrolled', !entries[0].isIntersecting);
    });
    observer.observe(sentinel);
  }

  /* ----------------------------------------------------------------------
     Menu mobile : bouton accessible, fermeture par Échap, clic sur un lien
     ou passage au format desktop, gestion du focus.
     ---------------------------------------------------------------------- */
  function initMobileNav() {
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.getElementById('site-nav');
    if (!toggle || !nav) return;

    const desktopQuery = window.matchMedia('(min-width: 64rem)');
    const firstLink = nav.querySelector('a');

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      document.body.classList.toggle('has-open-menu', open);
    }

    function isOpen() {
      return toggle.getAttribute('aria-expanded') === 'true';
    }

    toggle.addEventListener('click', function () {
      const open = !isOpen();
      setOpen(open);
      if (open && firstLink) firstLink.focus();
    });

    nav.addEventListener('click', function (event) {
      if (event.target.closest('a') && isOpen()) setOpen(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });

    desktopQuery.addEventListener('change', function (event) {
      if (event.matches && isOpen()) setOpen(false);
    });
  }

  /* ----------------------------------------------------------------------
     Section active : aria-current sur le lien de navigation correspondant
     (page d'accueil uniquement, les liens y sont des ancres).
     ---------------------------------------------------------------------- */
  function initActiveSection() {
    const links = Array.from(document.querySelectorAll('.site-nav__link[href^="#"]'));
    if (!links.length || !('IntersectionObserver' in window)) return;

    const sections = links
      .map(function (link) { return document.getElementById(link.getAttribute('href').slice(1)); })
      .filter(Boolean);
    if (!sections.length) return;

    const linkFor = new Map();
    links.forEach(function (link) {
      linkFor.set(link.getAttribute('href').slice(1), link);
    });

    let current = null;

    /* Repère : un point qui glisse sous le libellé de la section en cours.
       Ses coordonnées sont relatives à la barre de navigation, pour survivre
       aux changements de largeur et de police. */
    const nav = document.getElementById('site-nav');
    const marker = document.createElement('span');
    marker.className = 'nav-cursor';
    marker.setAttribute('aria-hidden', 'true');
    if (nav) nav.appendChild(marker);

    function placeMarker() {
      if (!nav) return;
      const link = current ? linkFor.get(current) : null;
      if (!link || window.innerWidth < 1024) {
        marker.classList.remove('is-on');
        return;
      }
      const navBox = nav.getBoundingClientRect();
      const box = link.getBoundingClientRect();
      marker.style.setProperty('--nav-x', (box.left + box.width / 2 - navBox.left) + 'px');
      marker.style.setProperty('--nav-y', (box.bottom - navBox.top + 3) + 'px');
      marker.classList.add('is-on');
    }

    function setCurrent(id) {
      if (id === current) return;
      current = id;
      links.forEach(function (link) {
        if (link === linkFor.get(id)) {
          link.setAttribute('aria-current', 'true');
        } else {
          link.removeAttribute('aria-current');
        }
      });
      placeMarker();
    }

    let markerTimer = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(markerTimer);
      markerTimer = window.setTimeout(placeMarker, 150);
    });

    const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    fontsReady.then(placeMarker);

    // Une bande centrée dans la fenêtre décide de la section « en cours ».
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setCurrent(entry.target.id);
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

    sections.forEach(function (section) { observer.observe(section); });

    /* Au-dessus de la première section : aucun lien actif. On observe le hero
       lui-même plutôt que la première section : son état d intersection change
       vraiment quand on remonte, là où surveiller la section suivante laissait
       le repère bloqué sur la dernière section visitée. */
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
      const heroObserver = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) setCurrent(null);
      }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
      heroObserver.observe(heroSection);
    }
  }

  /* ----------------------------------------------------------------------
     Apparitions au défilement : une classe ajoutée une seule fois,
     le CSS fait le reste. Sans IntersectionObserver ou avec la préférence
     « réduire les animations », tout est affiché immédiatement.
     ---------------------------------------------------------------------- */
  function initReveal() {
    const targets = document.querySelectorAll('.reveal');
    if (!targets.length) return;

    if (!('IntersectionObserver' in window) || prefersReducedMotion.matches) {
      targets.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    const observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });

    targets.forEach(function (el) { observer.observe(el); });
  }

  /* ----------------------------------------------------------------------
     Révélation mot à mot : chaque mot est enveloppé dans un span décalé
     par une variable CSS. Sans JS (ou en mouvement réduit), le paragraphe
     reste tel quel.
     ---------------------------------------------------------------------- */
  function initWordReveal() {
    const blocks = document.querySelectorAll('.js-words');
    if (!blocks.length) return;

    if (prefersReducedMotion.matches) {
      blocks.forEach(function (block) { block.classList.add('is-ready'); });
      return;
    }

    blocks.forEach(function (block) {
      let index = 0;
      const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
      const textNodes = [];
      while (walker.nextNode()) textNodes.push(walker.currentNode);

      textNodes.forEach(function (node) {
        const parts = node.textContent.split(/(\s+)/);
        const fragment = document.createDocumentFragment();
        parts.forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            fragment.appendChild(document.createTextNode(' '));
            return;
          }
          const word = document.createElement('span');
          word.className = 'word';
          word.style.setProperty('--i', String(index++));
          word.textContent = part;
          fragment.appendChild(word);
        });
        node.parentNode.replaceChild(fragment, node);
      });

      block.classList.add('is-ready');
    });
  }


  /* ----------------------------------------------------------------------
     Titre « décodé » : chaque lettre commence en chiffre ou symbole
     statistique et se fige de gauche à droite. Les largeurs sont figées
     avant l'animation pour éviter tout saut de mise en page ; le texte
     réel reste dans aria-label et dans data-text. Relance douce au survol.
     ---------------------------------------------------------------------- */
  function initDecode() {
    const targets = document.querySelectorAll('.js-decode');
    if (!targets.length || prefersReducedMotion.matches) return;

    const GLYPHS = '0123456789%∑≈±∆√∫Ω≠';
    const words = [];

    targets.forEach(function (el) {
      const text = el.getAttribute('data-text') || el.textContent.trim();
      el.textContent = '';
      el.setAttribute('aria-hidden', 'true');
      const chars = [];
      for (let i = 0; i < text.length; i++) {
        const span = document.createElement('span');
        span.className = 'decode__char';
        span.textContent = text[i];
        el.appendChild(span);
        chars.push({ el: span, final: text[i] });
      }
      words.push({ el: el, chars: chars });
    });

    const allChars = [];
    words.forEach(function (w) { w.chars.forEach(function (c) { allChars.push(c); }); });

    function freezeWidths() {
      allChars.forEach(function (c) {
        c.el.style.width = '';
        c.el.textContent = c.final;
      });
      allChars.forEach(function (c) {
        c.el.style.width = c.el.getBoundingClientRect().width + 'px';
      });
    }

    let running = false;
    let lastRun = 0;

    function run(stagger, lead) {
      if (running) return;
      running = true;
      lastRun = performance.now();
      freezeWidths();
      const start = performance.now() + lead;
      allChars.forEach(function (c, i) {
        c.resolveAt = start + i * stagger + Math.random() * 60;
        c.nextFlip = 0;
        c.done = false;
        c.el.classList.remove('is-set');
        c.el.classList.add('is-cycling');
      });

      function frame(now) {
        let pending = 0;
        allChars.forEach(function (c) {
          if (c.done) return;
          if (now >= c.resolveAt) {
            c.el.textContent = c.final;
            c.el.classList.remove('is-cycling');
            c.el.classList.add('is-set');
            c.done = true;
            return;
          }
          pending++;
          if (now >= c.nextFlip) {
            c.el.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            c.nextFlip = now + 45 + Math.random() * 40;
          }
        });
        if (pending > 0) {
          requestAnimationFrame(frame);
        } else {
          running = false;
        }
      }
      requestAnimationFrame(frame);
    }

    const ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    ready.then(function () { run(85, 380); });

    let resizeTimer = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () { if (!running) freezeWidths(); }, 150);
    });

    window.addEventListener('lz:theme', function () {
      if (!running) freezeWidths();
    });

    /* Une police chargée tardivement change la largeur des glyphes : on refige. */
    if (document.fonts && document.fonts.addEventListener) {
      document.fonts.addEventListener('loadingdone', function () {
        if (!running) freezeWidths();
      });
    }

    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      const title = targets[0].closest('h1') || targets[0].parentElement;
      title.addEventListener('mouseenter', function () {
        if (performance.now() - lastRun > 2500) run(45, 0);
      });
    }
  }

  /* ----------------------------------------------------------------------
     Compteurs : un nombre réel monte de 0 à sa valeur au chargement.
     ---------------------------------------------------------------------- */
  function initCountUp() {
    const counters = document.querySelectorAll('.js-count[data-count]');
    if (!counters.length || prefersReducedMotion.matches) return;

    counters.forEach(function (el) {
      const target = parseInt(el.getAttribute('data-count'), 10);
      if (isNaN(target)) return;
      const duration = 1100;
      const delay = 500;
      const start = performance.now() + delay;

      function frame(now) {
        const t = Math.min(1, Math.max(0, (now - start) / duration));
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = String(Math.round(target * eased));
        if (t < 1) requestAnimationFrame(frame);
      }

      el.textContent = '0';
      requestAnimationFrame(frame);
    });
  }

  /* ----------------------------------------------------------------------
     Inclinaison légère du portrait au survol (souris uniquement, jamais
     au tactile ni en mouvement réduit). Un seul rAF par mouvement.
     ---------------------------------------------------------------------- */
  function initTilt() {
    const targets = document.querySelectorAll('.js-tilt');
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!targets.length || !canHover || prefersReducedMotion.matches) return;

    targets.forEach(function (el) {
      let raf = null;
      const maxAngle = 6;

      el.addEventListener('pointermove', function (event) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          const rect = el.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width - 0.5;
          const y = (event.clientY - rect.top) / rect.height - 0.5;
          el.style.setProperty('--tilt-x', (-y * maxAngle).toFixed(2) + 'deg');
          el.style.setProperty('--tilt-y', (x * maxAngle).toFixed(2) + 'deg');
          el.classList.add('is-tilting');
        });
      });

      el.addEventListener('pointerleave', function () {
        el.classList.remove('is-tilting');
        el.style.removeProperty('--tilt-x');
        el.style.removeProperty('--tilt-y');
      });
    });
  }

  /* ----------------------------------------------------------------------
     Scène 3D du hero : surface de densité (mélange de gaussiennes) projetée
     en perspective sur un canvas 2D, sans librairie. Les pics dérivent,
     la caméra tourne lentement et suit la souris. La boucle s'arrête quand
     le hero sort de l'écran ou que l'onglet est masqué ; en mouvement
     réduit, une seule image est dessinée.
     ---------------------------------------------------------------------- */
  function initHeroScene() {
    const canvas = document.querySelector('.hero-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let accent = { r: 94, g: 230, b: 201 };
    let dim = { r: 120, g: 132, b: 156 };
    let bright = { r: 240, g: 255, b: 250 };

    function readColors() {
      const styles = getComputedStyle(canvas);
      accent = parseHex(styles.getPropertyValue('--color-accent')) || accent;
      dim = parseHex(styles.getPropertyValue('--color-faint')) || dim;
      bright = parseHex(styles.getPropertyValue('--color-ink')) || bright;
    }
    readColors();
    const peaks = [
      { a: 1.0, s: 0.40, cx: -0.45, cy: -0.10, vx: 0.11, vy: 0.07, ph: 0.0 },
      { a: 0.78, s: 0.33, cx: 0.50, cy: 0.30, vx: 0.09, vy: 0.13, ph: 2.1 },
      { a: 0.60, s: 0.27, cx: 0.05, cy: -0.55, vx: 0.13, vy: 0.10, ph: 4.2 }
    ];
    const particles = [];
    const view = { yaw: 0, pitch: 1.02, yawOffset: 0, pitchOffset: 0, targetYaw: 0, targetPitch: 0 };
    let width = 0;
    let height = 0;
    let cols = 64;
    let rows = 38;
    let rafId = null;
    let visible = true;
    let lastTime = 0;
    let elapsed = 0;

    function parseHex(value) {
      const hex = (value || '').trim().replace('#', '');
      if (hex.length !== 6) return null;
      return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16) };
    }

    function rgba(c, alpha) {
      return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + alpha.toFixed(3) + ')';
    }

    function spawnParticle(progress) {
      return {
        x: (Math.random() * 2 - 1) * 1.6,
        y: (Math.random() * 2 - 1),
        z: 0.2 + progress * 1.3,
        speed: 0.08 + Math.random() * 0.12,
        size: 0.8 + Math.random() * 1.4,
        tw: Math.random() * Math.PI * 2
      };
    }

    // Couleurs de points pré-calculées par palier de hauteur (évite de construire
    // une chaîne rgba() par point). Mesuré : un arc coûte ~1 µs, un drawImage ~10 µs.
    const LEVELS = 8;
    let pointFill = [];
    let glowFill = '';

    function buildPalette() {
      pointFill = [];
      for (let l = 0; l < LEVELS; l++) {
        const k = 0.18 + (l / (LEVELS - 1)) * 0.82;
        const c = k > 0.85 ? bright : mixColor(dim, accent, Math.min(1, (k - 0.18) / 0.5));
        pointFill.push(rgba(c, 0.45 + 0.55 * k));
      }
      glowFill = rgba(accent, 0.09);
    }
    buildPalette();

    window.addEventListener('lz:theme', function () {
      readColors();
      buildPalette();
      if (prefersReducedMotion.matches) draw(0);
    });

    function mixColor(a, b, t) {
      return { r: Math.round(a.r + (b.r - a.r) * t), g: Math.round(a.g + (b.g - a.g) * t), b: Math.round(a.b + (b.b - a.b) * t) };
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.round(Math.min(58, Math.max(34, width / 22)));
      rows = Math.round(cols * 0.6);
      if (!particles.length) {
        for (let i = 0; i < 70; i++) particles.push(spawnParticle(Math.random()));
      }
    }

    function heightAt(x, y, t) {
      let z = 0;
      for (let i = 0; i < peaks.length; i++) {
        const p = peaks[i];
        const cx = p.cx + 0.28 * Math.sin(t * p.vx + p.ph);
        const cy = p.cy + 0.22 * Math.cos(t * p.vy + p.ph);
        const dx = x - cx;
        const dy = y - cy;
        z += p.a * Math.exp(-(dx * dx + dy * dy) / (2 * p.s * p.s));
      }
      return z + 0.045 * Math.sin(4 * x + t * 0.9) * Math.cos(3 * y - t * 0.6);
    }

    // Projection : rotation autour de l'axe vertical (yaw), inclinaison (pitch), perspective.
    function project(x, y, z, cosY, sinY, cosP, sinP, scale, cx, cy) {
      const rx = x * cosY - y * sinY;
      const ry = x * sinY + y * cosY;
      const depth = ry * cosP - z * sinP;
      const up = ry * sinP + z * cosP;
      const s = 2.6 / (depth + 3.4);
      return { x: cx + rx * s * scale, y: cy - up * s * scale, s: s, depth: depth, h: z };
    }

    function draw(t) {
      ctx.clearRect(0, 0, width, height);
      const cosY = Math.cos(view.yaw + view.yawOffset);
      const sinY = Math.sin(view.yaw + view.yawOffset);
      const cosP = Math.cos(view.pitch + view.pitchOffset);
      const sinP = Math.sin(view.pitch + view.pitchOffset);
      const scale = Math.min(width * 0.46, height * 0.62);
      const cx = width / 2;
      const cy = height * 0.66;
      const hScale = 0.74;

      // Grille projetée une seule fois ; les rangées sont ensuite triées de l'arrière vers l'avant.
      const grid = new Array(rows);
      for (let j = 0; j < rows; j++) {
        const y = (j / (rows - 1)) * 2 - 1;
        const row = new Array(cols);
        let depthSum = 0;
        let maxH = 0;
        for (let i = 0; i < cols; i++) {
          const x = ((i / (cols - 1)) * 2 - 1) * 1.6;
          const h = heightAt(x, y, t);
          const p = project(x, y, h * hScale, cosY, sinY, cosP, sinP, scale, cx, cy);
          p.h = h;
          row[i] = p;
          depthSum += p.depth;
          if (h > maxH) maxH = h;
        }
        grid[j] = { points: row, depth: depthSum / cols, maxH: maxH };
      }

      ctx.lineWidth = 1;
      ctx.lineJoin = 'round';

      // Colonnes (une sur deux) : fil de fer discret, tracé depuis la grille déjà calculée.
      ctx.strokeStyle = rgba(accent, 0.1);
      for (let i = 0; i < cols; i += 2) {
        ctx.beginPath();
        for (let j = 0; j < rows; j++) {
          const p = grid[j].points[i];
          if (j === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }

      const ordered = grid.slice().sort(function (a, b) { return b.depth - a.depth; });

      // Rangées : trait et points, plus lumineux vers les pics et vers l'avant.
      for (let r = 0; r < ordered.length; r++) {
        const row = ordered[r].points;
        const near = Math.min(1, Math.max(0, (1.2 - ordered[r].depth) / 2.4));
        ctx.beginPath();
        for (let i = 0; i < cols; i++) {
          const p = row[i];
          if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = rgba(accent, 0.1 + 0.26 * Math.min(1, ordered[r].maxH) * near);
        ctx.stroke();

        // Points bas : petits carrés une colonne sur deux. Points hauts : disques, halo sur les pics.
        ctx.fillStyle = rgba(dim, 0.35 + 0.4 * near);
        for (let i = 0; i < cols; i++) {
          const p = row[i];
          const k = Math.min(1, p.h / 1.05);
          if (k < 0.18) {
            if (i % 2 === 0) {
              const d = 1.6 * p.s;
              ctx.fillRect(p.x - d / 2, p.y - d / 2, d, d);
            }
            continue;
          }
          const radius = (0.9 + 1.9 * k) * p.s;
          if (k > 0.72) {
            ctx.fillStyle = glowFill;
            ctx.beginPath();
            ctx.arc(p.x, p.y, radius * 3.4, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = pointFill[Math.round(((k - 0.18) / 0.82) * (LEVELS - 1))];
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Particules : points de données qui s'élèvent au-dessus de la surface.
      for (let i = 0; i < particles.length; i++) {
        const q = particles[i];
        const p = project(q.x, q.y, q.z, cosY, sinY, cosP, sinP, scale, cx, cy);
        const twinkle = 0.45 + 0.4 * Math.sin(t * 2 + q.tw);
        ctx.fillStyle = rgba(accent, 0.5 * twinkle * Math.max(0, 1 - (q.z - 0.2) / 1.3));
        ctx.beginPath();
        ctx.arc(p.x, p.y, q.size * p.s, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function step(now) {
      rafId = null;
      if (!visible || document.hidden) return;
      const dt = Math.min(0.05, lastTime ? (now - lastTime) / 1000 : 0.016);
      lastTime = now;
      elapsed += dt;
      view.yaw += dt * 0.07;
      view.yawOffset += (view.targetYaw - view.yawOffset) * 0.04;
      view.pitchOffset += (view.targetPitch - view.pitchOffset) * 0.04;
      for (let i = 0; i < particles.length; i++) {
        const q = particles[i];
        q.z += q.speed * dt;
        if (q.z > 1.5) particles[i] = spawnParticle(0);
      }
      draw(elapsed);
      rafId = requestAnimationFrame(step);
    }

    function start() {
      if (rafId === null && visible && !document.hidden) {
        lastTime = 0;
        rafId = requestAnimationFrame(step);
      }
    }

    resize();

    if (prefersReducedMotion.matches) {
      draw(0);
      window.addEventListener('resize', function () { resize(); draw(0); });
      return;
    }

    let resizeTimer = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () { resize(); draw(elapsed); }, 120);
    });

    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      window.addEventListener('pointermove', function (event) {
        view.targetYaw = (event.clientX / window.innerWidth - 0.5) * 0.45;
        view.targetPitch = (event.clientY / window.innerHeight - 0.5) * 0.18;
      }, { passive: true });
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start();
      }, { threshold: 0.02 }).observe(canvas);
    }

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) start();
    });

    start();
  }

  /* ----------------------------------------------------------------------
     Copie de l'adresse e-mail : bouton affiché uniquement si l'API
     Presse-papiers est disponible, retour visuel et vocal.
     ---------------------------------------------------------------------- */
  function initCopyEmail() {
    const button = document.querySelector('.copy-email__btn');
    if (!button || !navigator.clipboard || !window.isSecureContext) return;

    const label = button.querySelector('.copy-email__text');
    const icon = button.querySelector('use');
    const status = document.querySelector('.copy-email__status');
    const value = button.getAttribute('data-copy');
    let resetTimer = null;

    button.hidden = false;

    function setState(copied) {
      button.classList.toggle('is-copied', copied);
      if (label) label.textContent = copied ? 'Copié' : 'Copier';
      if (icon) icon.setAttribute('href', copied ? '#icon-check' : '#icon-copy');
    }

    button.addEventListener('click', function () {
      navigator.clipboard.writeText(value).then(function () {
        setState(true);
        if (status) status.textContent = 'Adresse e-mail copiée dans le presse-papiers.';
        window.clearTimeout(resetTimer);
        resetTimer = window.setTimeout(function () {
          setState(false);
          if (status) status.textContent = '';
        }, 2400);
      }).catch(function () {
        if (status) status.textContent = 'La copie a échoué : sélectionnez l’adresse manuellement.';
      });
    });
  }

  function init() {
    initHeader();
    initMobileNav();
    initActiveSection();
    initReveal();
    initWordReveal();
    initDecode();
    initCountUp();
    initTilt();
    initHeroScene();
    initCopyEmail();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
