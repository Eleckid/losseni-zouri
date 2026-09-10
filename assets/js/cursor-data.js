/* ==========================================================================
   Portfolio - Losseni Zouri
   Curseur « de mesure » (variante à l'étude)

   Un réticule de graphique remplace le curseur système : un point exact, un
   anneau qui suit avec un léger retard, deux ticks d'axe, et une lecture des
   coordonnées normalisées tant qu'on survole le hero. Au survol d'un élément
   interactif, le réticule se referme en cible pleine.

   Précautions : uniquement sur pointeur fin avec survol réel, jamais sur
   tactile ; le point reste collé à la position réelle pour ne pas dégrader la
   précision ; le curseur système revient sur les champs de saisie et dès que
   le pointeur quitte la fenêtre ; en mouvement réduit, le retard est supprimé.
   Activation : classe `has-measure-cursor` sur <html>.
   ========================================================================== */

(function () {
  'use strict';

  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (!fine.matches) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;

  const el = document.createElement('div');
  el.className = 'cursor';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML =
    '<span class="cursor__ring"></span>' +
    '<span class="cursor__tick cursor__tick--x"></span>' +
    '<span class="cursor__tick cursor__tick--y"></span>' +
    '<span class="cursor__dot"></span>' +
    '<span class="cursor__readout"></span>';
  document.body.appendChild(el);

  const ring = el.querySelector('.cursor__ring');
  const dot = el.querySelector('.cursor__dot');
  const readout = el.querySelector('.cursor__readout');

  const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const eased = { x: target.x, y: target.y };
  let visible = false;
  let raf = 0;
  let hero = null;

  function frame() {
    const k = prefersReducedMotion.matches ? 1 : 0.18;
    eased.x += (target.x - eased.x) * k;
    eased.y += (target.y - eased.y) * k;
    dot.style.transform = 'translate3d(' + target.x + 'px,' + target.y + 'px,0)';
    ring.style.transform = 'translate3d(' + eased.x + 'px,' + eased.y + 'px,0)';
    el.style.setProperty('--cursor-x', target.x + 'px');
    el.style.setProperty('--cursor-y', target.y + 'px');
    raf = requestAnimationFrame(frame);
  }

  function interactive(node) {
    return node && node.closest && node.closest('a, button, summary, [role="button"], input, select, textarea, label');
  }

  window.addEventListener('pointermove', function (event) {
    if (event.pointerType !== 'mouse') return;
    target.x = event.clientX;
    target.y = event.clientY;

    if (!visible) {
      visible = true;
      el.classList.add('is-visible');
      if (!raf) raf = requestAnimationFrame(frame);
    }

    const over = interactive(event.target);
    el.classList.toggle('is-active', Boolean(over));
    el.classList.toggle('is-text', Boolean(over && over.matches('input, textarea')));

    /* Lecture des coordonnées : seulement au-dessus du hero, là où la scène
       occupe l'écran et où l'idée de repère a un sens. */
    if (!hero) hero = document.querySelector('.hero');
    if (hero) {
      const rect = hero.getBoundingClientRect();
      const inside = event.clientY >= rect.top && event.clientY <= rect.bottom;
      el.classList.toggle('is-plotting', inside && !over);
      if (inside) {
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1 - (event.clientY - rect.top) / rect.height;
        readout.textContent = 'x ' + nx.toFixed(2) + '  y ' + ny.toFixed(2);
      }
    }
  }, { passive: true });

  window.addEventListener('pointerdown', function () { el.classList.add('is-down'); });
  window.addEventListener('pointerup', function () { el.classList.remove('is-down'); });

  document.addEventListener('pointerleave', function () {
    visible = false;
    el.classList.remove('is-visible');
  });

  window.addEventListener('blur', function () {
    visible = false;
    el.classList.remove('is-visible');
  });

  /* Le curseur système revient dès que le pointeur cesse d'être fin. */
  if (fine.addEventListener) {
    fine.addEventListener('change', function () {
      if (!fine.matches) {
        root.classList.remove('has-measure-cursor');
        el.classList.remove('is-visible');
      }
    });
  }

  /* Actif par défaut : la classe est posée par le script, jamais dans le HTML,
     pour que le curseur système reste en place si le JavaScript ne s exécute pas.
     Une page peut refuser le réticule avec data-no-measure-cursor sur <html>. */
  if (!root.hasAttribute('data-no-measure-cursor')) root.classList.add('has-measure-cursor');

  window.LZ_CURSOR = {
    enable: function () { root.classList.add('has-measure-cursor'); },
    disable: function () { root.classList.remove('has-measure-cursor'); },
    toggle: function () { return root.classList.toggle('has-measure-cursor'); },
    enabled: function () { return root.classList.contains('has-measure-cursor'); }
  };
})();
