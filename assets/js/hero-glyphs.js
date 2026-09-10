/* ==========================================================================
   Portfolio - Losseni Zouri
   Scène de hero « champ de données » (variante à l'étude)

   Un nuage de glyphes tourne lentement devant la caméra. Chaque nœud affiche
   un chiffre qui se ré-tire au hasard, comme un flux brut. Toutes les quelques
   secondes, une poignée de nœuds cristallise : ils s'alignent et décodent un
   terme de la statistique, restent lisibles pendant que le champ continue de
   tourner autour d'eux, puis se dispersent et redeviennent des chiffres.

   Trois principes techniques :
   - Canvas 2D et projection perspective écrite à la main, aucune dépendance.
   - Le nuage occupe un cylindre (même rayon en x et en z) pour que la rotation
     ne change pas la profondeur d'échelle ; la largeur de la section est
     obtenue par un étirement horizontal appliqué après projection. Sans cela,
     un volume large en x devient très profond une fois tourné et les glyphes
     proches explosent en taille.
   - Les cibles d'un mot sont posées en pixels écran, converties en espace
     caméra, puis ramenées en espace monde par rotation inverse à chaque image :
     le mot reste horizontal et lisible pendant que le champ tourne.
   ========================================================================== */

(function () {
  'use strict';

  const canvas = document.querySelector('.hero-glyphs');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Vocabulaire affiché : uniquement des termes que Losseni pratique. */
  const WORDS = [
    'MOYENNE', 'MÉDIANE', 'VARIANCE', 'CORRÉLATION', 'ÉCHANTILLON', 'RÉGRESSION',
    'FRÉQUENCE', 'TENDANCE', 'HYPOTHÈSE', 'DONNÉES', 'ANALYSE', 'ÉCART-TYPE',
    'POWER BI', 'PYTHON', 'DATAVIZ', 'INSEE', 'SQL', 'EXCEL'
  ];
  const DIGITS = '0123456789';
  /* Glyphes du décryptage : chiffres et symboles de statistique. */
  const SCRAMBLE = '0123456789%\u2211\u2248\u00b1\u2206\u221a\u222b\u03a9\u2260\u03c3\u03bc\u03c7';

  /* --------------------------------------------------------------- Couleurs */
  const colors = { ink: '#EEF1F6', faint: '#7C8598', accent: '#5EE6C9', cyan: '#56C8FF', violet: '#8B7CFF' };
  let fontStack = 'ui-monospace, monospace';

  function readColors() {
    const s = getComputedStyle(document.documentElement);
    const get = function (name, fallback) {
      const v = s.getPropertyValue(name).trim();
      return v || fallback;
    };
    colors.ink = get('--color-ink', colors.ink);
    colors.faint = get('--color-faint', colors.faint);
    colors.accent = get('--color-accent', colors.accent);
    colors.cyan = get('--color-cyan', colors.cyan);
    colors.violet = get('--color-violet', colors.violet);
    fontStack = get('--font-mono', fontStack);
  }

  /* rgba() à partir d'une couleur du thème, quel que soit son format d'écriture. */
  const rgbCache = new Map();

  function rgb(color) {
    if (rgbCache.has(color)) return rgbCache.get(color);
    let out = [238, 241, 246];
    if (color.charAt(0) === '#') {
      const hex = color.length === 4
        ? color.charAt(1) + color.charAt(1) + color.charAt(2) + color.charAt(2) + color.charAt(3) + color.charAt(3)
        : color.slice(1);
      out = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
    } else {
      const m = color.match(/-?\d+(\.\d+)?/g);
      if (m && m.length >= 3) out = [Number(m[0]), Number(m[1]), Number(m[2])];
    }
    rgbCache.set(color, out);
    return out;
  }

  function alpha(color, a) {
    const c = rgb(color);
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a.toFixed(3) + ')';
  }

  /* ------------------------------------------------------------------ Scène */
  const RADIUS = 460;          /* rayon du cylindre en x et en z */
  const FOCAL = 700;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let spanY = 300;             /* demi-hauteur du volume */
  let spread = 1;              /* étirement horizontal après projection */
  let baseSize = 14;

  let nodes = [];
  let edges = [];
  let packets = [];

  let yaw = 0;
  let pitch = -0.12;
  const pointer = { x: 0, y: 0, active: false };
  const drift = { x: 0, y: 0 };

  function targetCount() {
    const area = width * height;
    if (area < 380000) return 105;       /* mobile */
    if (area < 900000) return 160;       /* tablette */
    return 215;                          /* desktop */
  }

  function makeNodes(count) {
    const list = [];
    for (let i = 0; i < count; i++) {
      /* Répartition dans un cylindre, densité un peu plus forte vers le bord. */
      const angle = Math.random() * Math.PI * 2;
      const radius = RADIUS * Math.sqrt(0.1 + Math.random() * 1.28);
      const hx = Math.cos(angle) * radius;
      const hz = Math.sin(angle) * radius;
      let hy = (Math.random() * 2 - 1) * spanY;
      /* Bande centrale creusée : le titre garde de l'air autour de lui. */
      if (Math.abs(hy) < spanY * 0.26 && Math.abs(hx) < RADIUS * 0.5) {
        hy += (hy >= 0 ? 1 : -1) * spanY * 0.3;
      }
      list.push({
        hx: hx, hy: hy, hz: hz,
        x: hx, y: hy, z: hz,
        tx: hx, ty: hy, tz: hz,
        ch: DIGITS.charAt(Math.floor(Math.random() * 10)),
        nextFlip: Math.random() * 1600,
        word: false,
        sampled: false,
        lit: 0,
        tone: Math.random() < 0.1 ? 'violet' : (Math.random() < 0.14 ? 'cyan' : 'ink')
      });
    }
    return list;
  }

  /* Topologie fixe : deux ou trois voisins par nœud, calculée une fois sur les
     positions de repos. Le réseau se déforme ensuite quand un mot se forme. */
  function makeEdges(list) {
    const out = [];
    const seen = new Set();
    const near = [];
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      near.length = 0;
      for (let j = 0; j < list.length; j++) {
        if (i === j) continue;
        const b = list[j];
        const dx = (a.hx - b.hx) * spread;
        const dy = a.hy - b.hy;
        const dz = a.hz - b.hz;
        near.push({ j: j, d: dx * dx + dy * dy + dz * dz * 0.6 });
      }
      near.sort(function (p, q) { return p.d - q.d; });
      const links = Math.random() < 0.3 ? 3 : 2;
      for (let k = 0; k < links && k < near.length; k++) {
        const j = near[k].j;
        const key = i < j ? i + ':' + j : j + ':' + i;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ a: i, b: j });
      }
    }
    return out;
  }

  function build() {
    nodes = makeNodes(targetCount());
    edges = makeEdges(nodes);
    packets = [];
    const count = Math.max(2, Math.round(nodes.length / 30));
    for (let i = 0; i < count; i++) {
      packets.push({ edge: Math.floor(Math.random() * edges.length), t: Math.random(), speed: 0.14 + Math.random() * 0.2 });
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    spanY = Math.max(260, height * 0.62);
    spread = Math.max(1, Math.min(2.4, width / (RADIUS * 1.6)));
    baseSize = Math.max(12, Math.min(17, width / 92));

    if (!nodes.length || nodes.length !== targetCount()) build();
  }

  /* -------------------------------------------------------- Rotation 3D */
  let cosY = 1, sinY = 0, cosP = 1, sinP = 0;

  function updateBasis() {
    cosY = Math.cos(yaw); sinY = Math.sin(yaw);
    cosP = Math.cos(pitch); sinP = Math.sin(pitch);
  }

  function toView(x, y, z, out) {
    const x1 = x * cosY - z * sinY;
    const z1 = x * sinY + z * cosY;
    out.x = x1;
    out.y = y * cosP - z1 * sinP;
    out.z = y * sinP + z1 * cosP;
    return out;
  }

  /* Rotation inverse : d'une position visée à l'écran vers l'espace monde. */
  function toWorld(vx, vy, vz, out) {
    const y1 = vy * cosP + vz * sinP;
    const z1 = -vy * sinP + vz * cosP;
    out.x = vx * cosY + z1 * sinY;
    out.y = y1;
    out.z = -vx * sinY + z1 * cosY;
    return out;
  }

  function scaleAt(vz) {
    return FOCAL / (FOCAL + vz + RADIUS);
  }

  /* ---------------------------------------------------- Cristallisation */
  const word = { active: false, members: [], phase: 'idle', started: 0, y: 0, z: 0, size: 22, locked: 0 };
  /* Onde émise quand la dernière lettre se verrouille : elle parcourt le
     réseau et rallume les arêtes sur son passage. */
  const wave = { active: false, x: 0, y: 0, t: 0 };

  /* Échantillon : au clic, les chiffres proches sont prélevés et empilés en
     histogramme sous le point cliqué, avec leurs statistiques réelles. */
  const sample = {
    active: false, phase: 'idle', started: 0, x: 0, y: 0,
    members: [], n: 0, mean: 0, sd: 0, col: 22, step: 15
  };
  let nextWordAt = 1800;

  function startWord(now) {
    const text = WORDS[Math.floor(Math.random() * WORDS.length)];
    const letters = text.split('');
    const size = Math.max(20, Math.min(34, width / 46));
    const stepPx = size * 0.78;
    const halfPx = ((letters.length - 1) / 2) * stepPx;

    /* Position en pixels, hors de la bande centrale où vit le titre. */
    const maxOffsetX = Math.max(0, width / 2 - halfPx - 72);
    const centerPx = (Math.random() * 2 - 1) * maxOffsetX;
    const side = Math.random() < 0.5 ? -1 : 1;
    const yPx = side * height * (0.29 + Math.random() * 0.11);
    const z = -140 + Math.random() * 200;
    const s = scaleAt(z);

    const view = { x: 0, y: 0, z: 0 };
    const taken = new Set();
    const members = [];

    for (let i = 0; i < letters.length; i++) {
      /* Cible convertie en espace caméra : l'étirement et l'échelle sont annulés. */
      const vx = (centerPx + (i - (letters.length - 1) / 2) * stepPx) / (s * spread);
      const vy = yPx / s;
      let best = -1;
      let bestD = Infinity;
      for (let n = 0; n < nodes.length; n++) {
        if (taken.has(n) || nodes[n].word) continue;
        toView(nodes[n].x, nodes[n].y, nodes[n].z, view);
        const dx = view.x - vx;
        const dy = view.y - vy;
        const dz = view.z - z;
        const d = dx * dx + dy * dy * 1.5 + dz * dz * 0.3;
        if (d < bestD) { bestD = d; best = n; }
      }
      if (best < 0) break;
      taken.add(best);
      nodes[best].word = true;
      members.push({
        index: best, letter: letters[i], vx: vx,
        lockAt: now + 620 + i * 95,     /* verrouillage de gauche à droite */
        nextScramble: 0,
        flash: 0,
        locked: false
      });
    }

    if (members.length !== letters.length) {
      members.forEach(function (m) { nodes[m.index].word = false; });
      nextWordAt = now + 1500;
      return;
    }

    word.active = true;
    word.locked = 0;
    word.members = members;
    word.phase = 'forming';
    word.started = now;
    word.y = yPx / s;
    word.z = z;
    word.size = size;
  }

  function releaseWord(now) {
    word.phase = 'release';
    word.started = now;
    word.members.forEach(function (m) {
      const n = nodes[m.index];
      n.tx = n.hx; n.ty = n.hy; n.tz = n.hz;
      n.ch = DIGITS.charAt(Math.floor(Math.random() * 10));
      n.nextFlip = 140 + Math.random() * 600;
    });
  }

  function endWord(now) {
    word.members.forEach(function (m) { nodes[m.index].word = false; });
    word.active = false;
    word.members = [];
    word.phase = 'idle';
    nextWordAt = now + 2400 + Math.random() * 2400;
  }

  /* Prélèvement au clic : les nœuds les plus proches du point, dans un rayon
     limité, quittent le nuage pour former dix colonnes, une par chiffre. */
  function startSample(px, py, now) {
    if (sample.active) return;
    const near = [];
    for (let i = 0; i < proj.length; i++) {
      const p = proj[i];
      const n = nodes[p.i];
      if (n.word || n.sampled) continue;
      const value = DIGITS.indexOf(n.ch);
      if (value < 0) continue;
      const d = Math.hypot(p.x - px, p.y - py);
      if (d > 260) continue;
      near.push({ index: p.i, value: value, d: d });
    }
    if (near.length < 5) return;
    near.sort(function (a, b) { return a.d - b.d; });
    const picked = near.slice(0, 18);

    sample.col = Math.max(15, Math.min(24, width / 62));
    sample.step = Math.max(11, sample.col * 0.68);

    const columns = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let sum = 0;
    let sumSq = 0;
    sample.members = picked.map(function (item) {
      const row = columns[item.value]++;
      sum += item.value;
      sumSq += item.value * item.value;
      const n = nodes[item.index];
      n.sampled = true;
      return { index: item.index, value: item.value, row: row, flash: 0, arriveAt: now + 180 + row * 40 };
    });

    sample.n = picked.length;
    sample.mean = sum / sample.n;
    sample.sd = Math.sqrt(Math.max(0, sumSq / sample.n - sample.mean * sample.mean));
    sample.active = true;
    sample.phase = 'gather';
    sample.started = now;
    /* L'histogramme est posé sous le clic, sans déborder de la section. */
    const halfW = sample.col * 5;
    sample.x = Math.max(halfW + 24, Math.min(width - halfW - 24, px));
    sample.y = Math.min(height - 60, Math.max(160, py + 40));

    wave.active = true;
    wave.x = px;
    wave.y = py;
    wave.t = 0;
  }

  function releaseSample(now) {
    sample.phase = 'release';
    sample.started = now;
    sample.members.forEach(function (m) {
      const n = nodes[m.index];
      n.tx = n.hx; n.ty = n.hy; n.tz = n.hz;
      n.nextFlip = 200 + Math.random() * 700;
    });
  }

  function endSample() {
    sample.members.forEach(function (m) { nodes[m.index].sampled = false; });
    sample.members = [];
    sample.active = false;
    sample.phase = 'idle';
  }

  /* ------------------------------------------------------------- Boucle */
  let running = false;
  let visible = true;
  let last = 0;
  let elapsed = 0;
  let frames = 0;
  let frameAccum = 0;
  let fps = 0;
  let downgraded = false;
  let slowSeconds = 0;

  const vA = { x: 0, y: 0, z: 0 };
  let proj = [];
  const projIndex = [];
  const lastWordDraw = [];

  function step(now) {
    if (!running) return;
    const dt = Math.min(50, now - last);
    last = now;
    elapsed += dt;

    /* Rotation lente, respiration verticale, parallaxe du pointeur. */
    yaw += dt * 0.00008;
    drift.x += ((pointer.active ? pointer.x : 0) - drift.x) * 0.045;
    drift.y += ((pointer.active ? pointer.y : 0) - drift.y) * 0.045;
    pitch = -0.12 + Math.sin(elapsed * 0.00018) * 0.07 + drift.y * 0.1;
    updateBasis();

    if (sample.active) nextWordAt = Math.max(nextWordAt, elapsed + 900);
    if (!word.active && elapsed > nextWordAt) startWord(elapsed);

    if (sample.active) {
      const sAge = elapsed - sample.started;
      if (sample.phase === 'gather' && sAge > 2600) releaseSample(elapsed);
      else if (sample.phase === 'release' && sAge > 900) endSample();
    }

    if (word.active) {
      const age = elapsed - word.started;
      if (word.phase === 'forming' && age > 1000) { word.phase = 'hold'; word.started = elapsed; }
      else if (word.phase === 'hold' && age > 2200) releaseWord(elapsed);
      else if (word.phase === 'release' && age > 900) endWord(elapsed);
    }

    /* Cibles du mot recalculées à chaque image : elles suivent la rotation
       inverse, donc le mot reste horizontal à l'écran. */
    if (word.active && word.phase !== 'release') {
      for (let i = 0; i < word.members.length; i++) {
        const m = word.members[i];
        const n = nodes[m.index];
        toWorld(m.vx, word.y, word.z, vA);
        n.tx = vA.x; n.ty = vA.y; n.tz = vA.z;

        if (!m.locked && elapsed >= m.lockAt) {
          /* Verrouillage : la lettre se fige et encaisse un éclat. */
          m.locked = true;
          m.flash = 1;
          n.ch = m.letter;
          word.locked++;
          if (word.locked === word.members.length) {
            const pw = proj[projIndex[word.members[Math.floor(word.members.length / 2)].index]];
            if (pw) { wave.active = true; wave.x = pw.x; wave.y = pw.y; wave.t = 0; }
          }
        } else if (!m.locked && elapsed >= m.nextScramble) {
          /* Défilement de plus en plus rapide à l'approche du verrouillage. */
          const left = Math.max(0, m.lockAt - elapsed);
          n.ch = SCRAMBLE.charAt(Math.floor(Math.random() * SCRAMBLE.length));
          m.nextScramble = elapsed + 26 + Math.min(70, left * 0.16);
        }
        if (m.flash > 0) m.flash = Math.max(0, m.flash - dt / 420);
      }
    }

    ctx.clearRect(0, 0, width, height);

    const cx = width / 2 + drift.x * 22;
    const cy = height / 2 + drift.y * 14;

    /* Cibles de l'histogramme : posées en pixels, ramenées en espace monde. */
    if (sample.active && sample.phase !== 'release') {
      const sz = 0;
      const ss = scaleAt(sz);
      for (let i = 0; i < sample.members.length; i++) {
        const m = sample.members[i];
        const n = nodes[m.index];
        const sx = sample.x + (m.value - 4.5) * sample.col;
        const sy = sample.y - 26 - (m.row + 0.5) * sample.step;
        toWorld((sx - cx) / (ss * spread), (sy - cy) / ss, sz, vA);
        n.tx = vA.x; n.ty = vA.y; n.tz = vA.z;
        if (m.flash === 0 && elapsed >= m.arriveAt) m.flash = 1;
        if (m.flash > 0) m.flash = Math.max(0.001, m.flash - dt / 500);
      }
    }

    proj.length = 0;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const ease = n.word ? 0.08 : (n.sampled ? 0.11 : 0.03);
      n.x += (n.tx - n.x) * ease;
      n.y += (n.ty - n.y) * ease;
      n.z += (n.tz - n.z) * ease;

      if (!n.word && !n.sampled) {
        n.nextFlip -= dt;
        if (n.nextFlip <= 0) {
          n.ch = DIGITS.charAt(Math.floor(Math.random() * 10));
          n.nextFlip = 600 + Math.random() * 2000;
        }
      }

      toView(n.x, n.y, n.z, vA);
      const s = scaleAt(vA.z);
      const depth = Math.min(1, Math.max(0, (vA.z + RADIUS) / (RADIUS * 2)));
      proj.push({
        i: i,
        x: cx + vA.x * s * spread,
        y: cy + vA.y * s,
        depth: depth,
        size: n.word ? word.size : (n.sampled ? Math.max(13, baseSize) : Math.min(baseSize * 1.2, baseSize * s))
      });
    }

    /* Halo du pointeur : les nœuds proches s'éclairent et s'agitent. */
    if (pointer.active) {
      const px = cx + pointer.x * (width / 2);
      const py = cy + pointer.y * (height / 2);
      for (let i = 0; i < proj.length; i++) {
        const p = proj[i];
        const n = nodes[p.i];
        const d = Math.hypot(p.x - px, p.y - py);
        const target = d < 160 ? 1 - d / 160 : 0;
        n.lit += (target - n.lit) * 0.12;
        if (target > 0.55 && !n.word && Math.random() < 0.05) n.ch = DIGITS.charAt(Math.floor(Math.random() * 10));
      }
    } else {
      for (let i = 0; i < nodes.length; i++) nodes[i].lit *= 0.9;
    }

    /* --- Liens : trois passes d'opacité, un seul tracé par passe --- */
    const bucketLimits = [0.34, 0.62, 1.01];
    const bucketAlpha = [0.09, 0.17, 0.26];
    for (let b = 0; b < bucketLimits.length; b++) {
      ctx.beginPath();
      let drawn = false;
      for (let e = 0; e < edges.length; e++) {
        const ia = edges[e].a;
        const ib = edges[e].b;
        if (nodes[ia].word && nodes[ib].word) continue;   /* dessiné en accent plus bas */
        const pa = proj[ia];
        const pb = proj[ib];
        const near = 1 - (pa.depth + pb.depth) / 2;
        if (near > bucketLimits[b]) continue;
        if (b > 0 && near <= bucketLimits[b - 1]) continue;
        if (Math.abs(pa.x - pb.x) > 250 || Math.abs(pa.y - pb.y) > 250) continue;
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        drawn = true;
      }
      if (drawn) {
        ctx.strokeStyle = alpha(b === 2 ? colors.accent : colors.ink, bucketAlpha[b]);
        ctx.lineWidth = b === 2 ? 1.1 : 1;
        ctx.stroke();
      }
    }

    /* Onde : un anneau qui court dans le réseau après le verrouillage. */
    if (wave.active) {
      wave.t += dt;
      const radius = wave.t * 0.9;
      const band = 90;
      const life = Math.max(0, 1 - wave.t / 1500);
      if (life <= 0) {
        wave.active = false;
      } else {
        ctx.beginPath();
        let drawnWave = false;
        for (let e = 0; e < edges.length; e++) {
          const pa = proj[projIndex[edges[e].a]];
          const pb = proj[projIndex[edges[e].b]];
          if (!pa || !pb) continue;
          const mx = (pa.x + pb.x) / 2 - wave.x;
          const my = (pa.y + pb.y) / 2 - wave.y;
          const d = Math.sqrt(mx * mx + my * my);
          if (Math.abs(d - radius) > band) continue;
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
          drawnWave = true;
        }
        if (drawnWave) {
          ctx.strokeStyle = alpha(colors.accent, 0.4 * life);
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }
    }

    /* Constellation du mot en cours */
    if (word.active && word.members.length > 1 && word.locked > 1) {
      const glow = word.phase === 'release' ? Math.max(0, 1 - (elapsed - word.started) / 900) : 1;
      ctx.beginPath();
      const drop = word.size * 0.82;
      for (let i = 1; i < word.members.length; i++) {
        const pa = proj[word.members[i - 1].index];
        const pb = proj[word.members[i].index];
        ctx.moveTo(pa.x, pa.y + drop);
        ctx.lineTo(pb.x, pb.y + drop);
      }
      ctx.strokeStyle = alpha(colors.accent, 0.38 * glow);
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }

    /* Fils de traction : chaque nœud tiré vers sa lettre garde un fil tendu
       vers sa cible, qui se résorbe à mesure qu'il arrive. */
    if (word.active && word.phase === 'forming') {
      ctx.beginPath();
      let drawnThread = false;
      for (let i = 0; i < word.members.length; i++) {
        const m = word.members[i];
        const n = nodes[m.index];
        const p = proj[projIndex[m.index]];
        if (!p) continue;
        toView(n.tx, n.ty, n.tz, vA);
        const st = scaleAt(vA.z);
        const tx = width / 2 + drift.x * 22 + vA.x * st * spread;
        const ty = height / 2 + drift.y * 14 + vA.y * st;
        if (Math.hypot(tx - p.x, ty - p.y) < 6) continue;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(tx, ty);
        drawnThread = true;
      }
      if (drawnThread) {
        ctx.strokeStyle = alpha(colors.accent, 0.22);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    /* --- Paquets : une donnée qui circule le long d'une arête --- */
    for (let i = 0; i < packets.length; i++) {
      const pk = packets[i];
      pk.t += (dt / 1000) * pk.speed;
      if (pk.t >= 1) {
        pk.t = 0;
        pk.edge = Math.floor(Math.random() * edges.length);
        pk.speed = 0.14 + Math.random() * 0.2;
      }
      const edge = edges[pk.edge];
      if (!edge) continue;
      const pa = proj[edge.a];
      const pb = proj[edge.b];
      const x = pa.x + (pb.x - pa.x) * pk.t;
      const y = pa.y + (pb.y - pa.y) * pk.t;
      ctx.beginPath();
      ctx.arc(x, y, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = alpha(colors.cyan, 0.5 * Math.sin(pk.t * Math.PI));
      ctx.fill();
    }

    /* --- Glyphes : du plus lointain au plus proche --- */
    lastWordDraw.length = 0;
    proj.sort(function (p, q) { return q.depth - p.depth; });
    for (let i = 0; i < proj.length; i++) projIndex[proj[i].i] = i;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let currentFont = '';
    for (let i = 0; i < proj.length; i++) {
      const p = proj[i];
      const n = nodes[p.i];
      if (n.word || n.sampled) continue;    /* dessinés en dernier, par-dessus */
      const size = Math.round(p.size);
      if (size < 7) continue;
      const font = size + 'px ' + fontStack;
      if (font !== currentFont) { ctx.font = font; currentFont = font; }

      let a = (1 - p.depth) * 0.55 + 0.14;
      let color;
      if (n.lit > 0.02) {
        a = Math.min(1, a + n.lit * 0.5);
        color = n.lit > 0.5 ? colors.cyan : colors.ink;
      } else if (n.tone === 'violet') {
        color = colors.violet;
        a *= 0.9;
      } else if (n.tone === 'cyan') {
        color = colors.cyan;
        a *= 0.85;
      } else {
        color = p.depth > 0.55 ? colors.faint : colors.ink;
        a *= 0.85;
      }

      ctx.fillStyle = alpha(color, a);
      ctx.fillText(n.ch, p.x, p.y);
    }

    /* Histogramme de l'échantillon : axe, colonnes, chiffres prélevés et
       lecture statistique. Les valeurs sont celles réellement affichées. */
    if (sample.active) {
      const fadeS = sample.phase === 'release' ? Math.max(0, 1 - (elapsed - sample.started) / 900) : 1;
      const half = sample.col * 5;

      ctx.beginPath();
      ctx.moveTo(sample.x - half, sample.y - 20);
      ctx.lineTo(sample.x + half, sample.y - 20);
      ctx.strokeStyle = alpha(colors.cyan, 0.5 * fadeS);
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '10px ' + fontStack;
      ctx.fillStyle = alpha(colors.faint, 0.75 * fadeS);
      for (let d = 0; d < 10; d++) {
        ctx.fillText(String(d), sample.x + (d - 4.5) * sample.col, sample.y - 8);
      }

      ctx.font = '11px ' + fontStack;
      ctx.fillStyle = alpha(colors.cyan, 0.9 * fadeS);
      ctx.fillText(
        'n = ' + sample.n + '   \u03bc = ' + sample.mean.toFixed(1) + '   \u03c3 = ' + sample.sd.toFixed(1),
        sample.x, sample.y + 10);

      ctx.font = Math.round(Math.max(13, baseSize)) + 'px ' + fontStack;
      for (let i = 0; i < sample.members.length; i++) {
        const m = sample.members[i];
        const p = proj[projIndex[m.index]];
        if (!p) continue;
        const fl = Math.max(0, m.flash);
        ctx.shadowColor = alpha(colors.cyan, 0.45 * fadeS);
        ctx.shadowBlur = 8 + fl * 16;
        ctx.fillStyle = fl > 0.05
          ? alpha(colors.ink, Math.min(1, (0.6 + fl * 0.4) * fadeS))
          : alpha(colors.cyan, 0.95 * fadeS);
        ctx.fillText(nodes[p.i].ch, p.x, p.y);
      }
      ctx.shadowBlur = 0;
    }

    /* ... et sont posés en dernier, plus grands, avec un halo : ils doivent
       rester lisibles à travers le voile sombre du hero. */
    if (word.active) {
      const fade = word.phase === 'release' ? Math.max(0, 1 - (elapsed - word.started) / 900) : 1;
      const baseWord = Math.round(word.size);
      for (let i = 0; i < word.members.length; i++) {
        const m = word.members[i];
        const p = proj[projIndex[m.index]];
        if (!p) continue;
        const flash = m.flash || 0;
        const size = Math.round(baseWord * (1 + flash * 0.3));
        ctx.font = size + 'px ' + fontStack;
        ctx.shadowColor = alpha(colors.accent, (0.45 + flash * 0.45) * fade);
        ctx.shadowBlur = 12 + flash * 20;
        /* Au verrouillage la lettre part presque blanche, puis retombe sur l'accent. */
        ctx.fillStyle = flash > 0.05
          ? alpha(colors.ink, Math.min(1, (0.55 + flash * 0.45) * fade))
          : alpha(colors.accent, 0.97 * fade);
        ctx.fillText(nodes[p.i].ch, p.x, p.y);
        lastWordDraw.push({ ch: nodes[p.i].ch, x: Math.round(p.x), y: Math.round(p.y), size: size, locked: m.locked });
      }
      ctx.shadowBlur = 0;
    }

    /* Budget d'image : si la machine peine, on allège une fois. */
    frames++;
    frameAccum += dt;
    if (frameAccum >= 1000) {
      fps = Math.round((frames * 1000) / frameAccum);
      frames = 0;
      frameAccum = 0;
      /* Les premières secondes servent au chargement des polices et aux
         animations d'entrée : on ne juge la cadence qu'ensuite, et il faut
         deux secondes lentes d'affilée pour déclencher l'allègement. */
      slowSeconds = (elapsed > 3000 && fps > 0 && fps < 45) ? slowSeconds + 1 : 0;
      if (!downgraded && slowSeconds >= 2 && nodes.length > 70) {
        downgraded = true;
        if (word.active) endWord(elapsed);
        nodes = nodes.slice(0, Math.round(nodes.length * 0.65));
        edges = makeEdges(nodes);
        packets = packets.slice(0, 2);
      }
    }

    requestAnimationFrame(step);
  }

  /* ------------------------------------------------------- Image figée */
  function drawStatic() {
    if (!nodes.length) return;
    updateBasis();
    ctx.clearRect(0, 0, width, height);
    const cx = width / 2;
    const cy = height / 2;
    const points = [];
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      toView(n.x, n.y, n.z, vA);
      const s = scaleAt(vA.z);
      points.push({
        i: i,
        x: cx + vA.x * s * spread,
        y: cy + vA.y * s,
        depth: Math.min(1, Math.max(0, (vA.z + RADIUS) / (RADIUS * 2))),
        size: Math.min(baseSize * 1.2, baseSize * s)
      });
    }

    ctx.beginPath();
    for (let e = 0; e < edges.length; e++) {
      const pa = points[edges[e].a];
      const pb = points[edges[e].b];
      if (Math.abs(pa.x - pb.x) > 250 || Math.abs(pa.y - pb.y) > 250) continue;
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
    }
    ctx.strokeStyle = alpha(colors.ink, 0.1);
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const size = Math.round(p.size);
      if (size < 7) continue;
      ctx.font = size + 'px ' + fontStack;
      ctx.fillStyle = alpha(p.depth > 0.55 ? colors.faint : colors.ink, (1 - p.depth) * 0.42 + 0.1);
      ctx.fillText(nodes[p.i].ch, p.x, p.y);
    }
  }

  /* ------------------------------------------------------------ Contrôle */
  function start() {
    if (running || !visible) return;
    if (prefersReducedMotion.matches) { drawStatic(); return; }
    running = true;
    last = performance.now();
    requestAnimationFrame(step);
  }

  function stop() {
    running = false;
  }

  readColors();
  resize();
  if (!nodes.length) build();

  let resizeTimer = null;
  window.addEventListener('resize', function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () {
      resize();
      if (!running) drawStatic();
    }, 180);
  });

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    window.addEventListener('pointermove', function (event) {
      const rect = canvas.getBoundingClientRect();
      const inside = event.clientY >= rect.top && event.clientY <= rect.bottom;
      pointer.active = inside;
      if (!inside) return;
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    }, { passive: true });
  }

  /* Clic dans la section : le canevas est transparent aux événements, on écoute
     donc son parent et on ignore tout ce qui est déjà interactif. */
  const host = canvas.parentElement;
  if (host) {
    host.addEventListener('click', function (event) {
      if (event.target.closest('a, button, input, label, select, textarea, .lab-panel')) return;
      if (prefersReducedMotion.matches || !running) return;
      const rect = canvas.getBoundingClientRect();
      startSample(event.clientX - rect.left, event.clientY - rect.top, elapsed);
    });
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start(); else stop();
    }, { threshold: 0 });
    io.observe(canvas);
  } else {
    start();
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });

  window.addEventListener('lz:theme', function () {
    rgbCache.clear();
    readColors();
    if (!running) drawStatic();
  });

  if (prefersReducedMotion.addEventListener) {
    prefersReducedMotion.addEventListener('change', function () {
      if (prefersReducedMotion.matches) { stop(); drawStatic(); } else start();
    });
  }

  /* Exposé pour la page de comparaison : cadence, pause, mot à la demande. */
  window.LZ_HERO_GLYPHS = {
    stats: function () { return { fps: fps, nodes: nodes.length, edges: edges.length, word: word.active }; },
    pause: stop,
    resume: start,
    forceWord: function () { if (!word.active) startWord(elapsed); },
    sampleAt: function (x, y) { startSample(x, y, elapsed); },
    sampleStats: function () { return { active: sample.active, n: sample.n, mean: sample.mean, sd: sample.sd }; },
    lastWord: function () { return lastWordDraw.slice(); }
  };

  start();
})();
