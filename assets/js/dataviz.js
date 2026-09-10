/* ==========================================================================
   Portfolio - Losseni Zouri - visualisations de données
   1. Infographie démographique : barres (Chart.js), carte des 18 régions
      avec encarts DOM (D3), indicateurs, filtres année / tranche d'âge.
   Les données vivent dans assets/data/ ; ce fichier ne contient que le rendu.
   Chargé uniquement sur les pages qui en ont besoin, après d3 et Chart.js.
   ========================================================================== */

(function () {
  'use strict';

  if (typeof d3 === 'undefined' || typeof Chart === 'undefined') return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rootStyles = getComputedStyle(document.documentElement);

  function cssColor(name, fallback) {
    const value = rootStyles.getPropertyValue(name).trim();
    return value || fallback;
  }

  const COLORS = {};

  function hexToRgba(hex, alpha) {
    const h = (hex || '').trim().replace('#', '');
    if (h.length !== 6) return hex;
    return 'rgba(' + parseInt(h.slice(0, 2), 16) + ',' + parseInt(h.slice(2, 4), 16) + ',' + parseInt(h.slice(4, 6), 16) + ',' + alpha + ')';
  }

  function readColors() {
    const styles = getComputedStyle(document.documentElement);
    const get = function (name, fallback) { return styles.getPropertyValue(name).trim() || fallback; };
    COLORS.accent = get('--color-accent', '#5EE6C9');
    COLORS.ink = get('--color-ink', '#EEF1F6');
    COLORS.muted = get('--color-muted', '#9AA3B5');
    COLORS.faint = get('--color-faint', '#7C8598');
    COLORS.surface = get('--color-surface', '#10141F');
    COLORS.surfaceAlt = get('--color-surface-alt', '#161B2A');
    COLORS.raised = get('--color-surface-raised', '#1C2234');
    COLORS.violet = get('--color-violet', '#8B7CFF');
    COLORS.warm = get('--color-amber', '#F5B841');
    COLORS.cool = get('--color-cyan', '#56C8FF');
    COLORS.line = get('--color-line', 'rgba(238, 241, 246, 0.10)');
    COLORS.lineStrong = get('--color-line-strong', 'rgba(238, 241, 246, 0.22)');
  }
  readColors();

  const instances = [];
  window.addEventListener('lz:theme', function () {
    readColors();
    instances.forEach(function (viz) { viz.applyTheme(); });
  });

  const FONT_SANS = "'Instrument Sans', 'Segoe UI', system-ui, sans-serif";
  const FONT_MONO = "'Geist Mono', ui-monospace, Consolas, monospace";

  const numberFr = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
  const percentFr = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

  function formatCount(n) {
    if (Math.abs(n) >= 1e6) return numberFr.format(n / 1e6) + ' M';
    return numberFr.format(Math.round(n / 1e3)) + ' k';
  }

  function formatPercent(p) {
    return percentFr.format(p) + ' %';
  }

  function formatDelta(n) {
    const sign = n > 0 ? '+' : n < 0 ? '−' : '';
    return sign + formatCount(Math.abs(n));
  }

  function loadJSON(url) {
    return fetch(url).then(function (response) {
      if (!response.ok) throw new Error(url + ' : ' + response.status);
      return response.json();
    });
  }

  /* When an element enters the viewport once, run the callback (rendering is deferred). */
  function whenVisible(el, callback) {
    if (!('IntersectionObserver' in window)) {
      callback();
      return;
    }
    const observer = new IntersectionObserver(function (entries, obs) {
      if (entries[0].isIntersecting) {
        obs.disconnect();
        callback();
      }
    }, { rootMargin: '240px 0px' });
    observer.observe(el);
  }

  /* ======================================================================
     1. INFOGRAPHIE DÉMOGRAPHIQUE
     ====================================================================== */
  const DOM_CODES = ['01', '02', '03', '04', '06'];

  function DemographyViz(root, data, geo) {
    this.root = root;
    this.data = data;
    this.geo = geo;
    this.compact = root.hasAttribute('data-compact');
    this.state = { year: '2022', metric: 'pop' };
    this.regions = data.regions.slice();
    this.byCode = {};
    this.regions.forEach(function (r) { this.byCode[r.code] = r; }, this);
    this.tooltip = root.querySelector('.dv__tooltip');
    this.buildKpis();
    this.buildTable();
    this.buildMap();
    this.buildBars();
    this.bindControls();
    this.update(true);
  }

  /* Réapplique les couleurs courantes (panneau Lab) aux graphiques déjà construits. */
  DemographyViz.prototype.applyTheme = function () {
    if (this.chart) {
      const c = this.chart;
      c.data.datasets[0].backgroundColor = hexToRgba(COLORS.violet, 0.6);
      c.data.datasets[1].backgroundColor = COLORS.accent;
      c.options.plugins.legend.labels.color = COLORS.muted;
      c.options.plugins.tooltip.backgroundColor = COLORS.raised;
      c.options.plugins.tooltip.titleColor = COLORS.ink;
      c.options.plugins.tooltip.bodyColor = COLORS.muted;
      c.options.scales.x.grid.color = COLORS.line;
      c.options.scales.x.ticks.color = COLORS.faint;
      c.options.scales.y.ticks.color = COLORS.muted;
    }
    if (this.shareScale) this.shareScale.range([COLORS.cool, COLORS.warm]);
    this.update();
  };

  DemographyViz.prototype.value = function (region, metric, year) {
    if (metric === 'oldShare') return (region.old[year] / region.pop[year]) * 100;
    return region[metric][year];
  };

  DemographyViz.prototype.format = function (metric, v) {
    return metric === 'oldShare' ? formatPercent(v) : formatCount(v);
  };

  /* --- Indicateurs clés, calculés depuis le jeu de données ---------------- */
  DemographyViz.prototype.buildKpis = function () {
    const sum = function (regions, key, year) {
      return regions.reduce(function (acc, r) { return acc + r[key][year]; }, 0);
    };
    const pop16 = sum(this.regions, 'pop', '2016');
    const pop22 = sum(this.regions, 'pop', '2022');
    const old16 = sum(this.regions, 'old', '2016');
    const old22 = sum(this.regions, 'old', '2022');
    const values = {
      pop2016: formatCount(pop16),
      pop2022: formatCount(pop22),
      deltaPop: formatDelta(pop22 - pop16),
      deltaOld: formatDelta(old22 - old16),
      oldShare2016: formatPercent((old16 / pop16) * 100),
      oldShare2022: formatPercent((old22 / pop22) * 100),
      regionsAging: this.regions.filter(function (r) {
        return r.old['2022'] / r.pop['2022'] > r.old['2016'] / r.pop['2016'];
      }).length + ' / ' + this.regions.length
    };
    this.root.querySelectorAll('[data-kpi]').forEach(function (el) {
      const key = el.getAttribute('data-kpi');
      if (values[key] !== undefined) el.textContent = values[key];
    });
  };

  /* --- Tableau de données accessible (repli et transparence) -------------- */
  DemographyViz.prototype.buildTable = function () {
    const table = this.root.querySelector('.dv__table');
    if (!table) return;
    const rows = this.regions.slice().sort(function (a, b) { return b.pop['2022'] - a.pop['2022']; });
    let html = '<thead><tr><th scope="col">Région</th><th scope="col">Population 2016</th><th scope="col">Population 2022</th><th scope="col">Moins de 30 ans 2022</th><th scope="col">Plus de 60 ans 2022</th><th scope="col">Part des 60+ 2016 → 2022</th></tr></thead><tbody>';
    rows.forEach(function (r) {
      html += '<tr><th scope="row">' + r.name + '</th><td>' + formatCount(r.pop['2016']) + '</td><td>' + formatCount(r.pop['2022']) + '</td><td>' + formatCount(r.young['2022']) + '</td><td>' + formatCount(r.old['2022']) + '</td><td>' + formatPercent((r.old['2016'] / r.pop['2016']) * 100) + ' → ' + formatPercent((r.old['2022'] / r.pop['2022']) * 100) + '</td></tr>';
    });
    table.innerHTML = html + '</tbody>';
  };

  /* --- Carte : métropole en projection conique, DOM en encarts ----------- */
  DemographyViz.prototype.buildMap = function () {
    const container = this.root.querySelector('.dv__map');
    if (!container) return;
    const self = this;
    const W = 640;
    const H = 560;
    const svg = d3.select(container).append('svg')
      .attr('viewBox', '0 0 ' + W + ' ' + H)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('aria-hidden', 'true');

    const metro = { type: 'FeatureCollection', features: this.geo.features.filter(function (f) { return DOM_CODES.indexOf(f.properties.code) === -1; }) };
    const projection = d3.geoConicConformal().parallels([44, 49]).rotate([-3, 0]);
    projection.fitExtent([[130, 12], [W - 12, H - 12]], metro);
    const path = d3.geoPath(projection);

    // Encarts DOM : une colonne à gauche, chaque territoire avec sa propre projection.
    const insetW = 100;
    const insetH = 92;
    const insets = {};
    DOM_CODES.forEach(function (code, i) {
      const feature = self.geo.features.find(function (f) { return f.properties.code === code; });
      if (!feature) return;
      const x0 = 8;
      const y0 = 12 + i * (insetH + 14);
      /* Projection plane pour les encarts : à cette échelle la déformation est
         invisible, et surtout geoIdentity ignore le sens d enroulement des
         anneaux, que les contours DOM simplifiés ont inversé - en projection
         sphérique D3 les interprétait comme couvrant toute la sphère, ce qui
         remplissait l encart d un carré plein. */
      const p = d3.geoIdentity().reflectY(true);
      p.fitExtent([[x0 + 10, y0 + 18], [x0 + insetW - 10, y0 + insetH - 6]], feature);
      insets[code] = { projection: p, path: d3.geoPath(p), box: [x0, y0, insetW, insetH], feature: feature };
    });

    const g = svg.append('g');

    // Cadres des encarts
    Object.keys(insets).forEach(function (code) {
      const inset = insets[code];
      g.append('rect').attr('class', 'dv-map__inset')
        .attr('x', inset.box[0]).attr('y', inset.box[1]).attr('width', inset.box[2]).attr('height', inset.box[3]).attr('rx', 6);
      g.append('text').attr('class', 'dv-map__inset-label')
        .attr('x', inset.box[0] + 8).attr('y', inset.box[1] + 13)
        .text(self.byCode[code] ? self.byCode[code].short : code);
    });

    // Régions
    const regionsLayer = g.append('g');
    this.geo.features.forEach(function (f) {
      const code = f.properties.code;
      const d = insets[code] ? insets[code].path(f) : path(f);
      regionsLayer.append('path').attr('class', 'dv-map__region').attr('d', d).attr('data-code', code).attr('data-inset', insets[code] ? 'true' : null);
    });

    // Bulles proportionnelles, centrées sur chaque région
    this.centroids = {};
    this.geo.features.forEach(function (f) {
      const code = f.properties.code;
      const c = insets[code] ? insets[code].path.centroid(f) : path.centroid(f);
      // Petits ajustements pour éviter les chevauchements en métropole
      if (code === '11') c[1] -= 2;
      self.centroids[code] = c;
    });

    this.bubbleLayer = g.append('g');
    this.bubbles = this.bubbleLayer.selectAll('circle')
      .data(this.regions, function (r) { return r.code; })
      .join('circle')
      .attr('class', 'dv-map__bubble')
      .attr('cx', function (r) { return self.centroids[r.code] ? self.centroids[r.code][0] : -50; })
      .attr('cy', function (r) { return self.centroids[r.code] ? self.centroids[r.code][1] : -50; })
      .attr('r', 0)
      .on('mouseenter', function (event, r) { self.showTooltip(event, r, this); })
      .on('mousemove', function (event) { self.moveTooltip(event); })
      .on('mouseleave', function () { self.hideTooltip(); });

    this.bubbles.append('title').text(function (r) { return r.name; });

    this.mapLegend = this.root.querySelector('.dv__legend');
    this.bubbleScale = d3.scaleSqrt().range([3, this.compact ? 26 : 30]);
    this.shareScale = d3.scaleLinear().range([COLORS.cool, COLORS.warm]);
  };

  DemographyViz.prototype.showTooltip = function (event, r, node) {
    if (!this.tooltip) return;
    const m = this.state.metric;
    const y = this.state.year;
    const v16 = this.value(r, m, '2016');
    const v22 = this.value(r, m, '2022');
    const delta = m === 'oldShare' ? (v22 - v16 >= 0 ? '+' : '−') + percentFr.format(Math.abs(v22 - v16)) + ' pt' : formatDelta(v22 - v16);
    this.tooltip.innerHTML =
      '<strong>' + r.name + '</strong>' +
      '<span>' + this.data.metrics[m] + ' ' + y + ' : <b>' + this.format(m, this.value(r, m, y)) + '</b></span>' +
      '<span>2016 → 2022 : ' + this.format(m, v16) + ' → ' + this.format(m, v22) + ' (' + delta + ')</span>';
    this.tooltip.hidden = false;
    this.moveTooltip(event, node);
  };

  DemographyViz.prototype.moveTooltip = function (event, node) {
    if (!this.tooltip || this.tooltip.hidden) return;
    const bounds = this.root.getBoundingClientRect();
    let x;
    let y;
    if (event && typeof event.clientX === 'number' && event.type !== 'focus') {
      x = event.clientX - bounds.left;
      y = event.clientY - bounds.top;
    } else if (node) {
      const nb = node.getBoundingClientRect();
      x = nb.left + nb.width / 2 - bounds.left;
      y = nb.top - bounds.top;
    } else {
      return;
    }
    const tw = this.tooltip.offsetWidth;
    const left = Math.max(8, Math.min(bounds.width - tw - 8, x - tw / 2));
    this.tooltip.style.transform = 'translate(' + Math.round(left) + 'px, ' + Math.round(y - this.tooltip.offsetHeight - 14) + 'px)';
  };

  DemographyViz.prototype.hideTooltip = function () {
    if (this.tooltip) this.tooltip.hidden = true;
  };

  /* --- Barres : 2016 vs 2022 pour l'indicateur choisi -------------------- */
  DemographyViz.prototype.buildBars = function () {
    const canvas = this.root.querySelector('.dv__bars');
    if (!canvas) return;
    const self = this;
    Chart.defaults.font.family = FONT_SANS;
    Chart.defaults.color = COLORS.muted;

    this.chart = new Chart(canvas, {
      type: 'bar',
      data: { labels: [], datasets: [
        { label: '2016', data: [], backgroundColor: hexToRgba(COLORS.violet, 0.6), borderRadius: 3, borderSkipped: false, maxBarThickness: 14 },
        { label: '2022', data: [], backgroundColor: COLORS.accent, borderRadius: 3, borderSkipped: false, maxBarThickness: 14 }
      ] },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        animation: reducedMotion ? false : { duration: 650, easing: 'easeOutQuart' },
        interaction: { mode: 'index', axis: 'y', intersect: false },
        plugins: {
          legend: { position: 'top', align: 'end', labels: { color: COLORS.muted, boxWidth: 10, boxHeight: 10, font: { family: FONT_MONO, size: 11 }, padding: 14 } },
          tooltip: {
            backgroundColor: COLORS.raised, borderColor: COLORS.lineStrong, borderWidth: 1,
            titleColor: COLORS.ink, bodyColor: COLORS.muted, titleFont: { family: FONT_SANS, weight: '600' }, bodyFont: { family: FONT_MONO, size: 11 },
            padding: 10, cornerRadius: 6, displayColors: true, boxPadding: 4,
            callbacks: {
              title: function (items) { return items.length ? self.sorted[items[0].dataIndex].name : ''; },
              label: function (item) { return ' ' + item.dataset.label + ' : ' + self.format(self.state.metric, item.raw); }
            }
          }
        },
        scales: {
          x: {
            grid: { color: COLORS.line }, border: { display: false },
            ticks: { color: COLORS.faint, font: { family: FONT_MONO, size: 10 }, maxTicksLimit: 6, callback: function (v) { return self.format(self.state.metric, v); } }
          },
          y: {
            grid: { display: false }, border: { display: false },
            ticks: { color: COLORS.muted, font: { family: FONT_SANS, size: 11 }, autoSkip: false }
          }
        }
      }
    });
  };

  /* --- Contrôles ---------------------------------------------------------- */
  DemographyViz.prototype.bindControls = function () {
    const self = this;
    this.root.querySelectorAll('[data-year]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        self.state.year = btn.getAttribute('data-year');
        self.update();
      });
    });
    this.root.querySelectorAll('[data-metric]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        self.state.metric = btn.getAttribute('data-metric');
        self.update();
      });
    });
  };

  DemographyViz.prototype.update = function (first) {
    const self = this;
    const m = this.state.metric;
    const y = this.state.year;

    this.root.querySelectorAll('[data-year]').forEach(function (btn) {
      const active = btn.getAttribute('data-year') === y;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
    this.root.querySelectorAll('[data-metric]').forEach(function (btn) {
      const active = btn.getAttribute('data-metric') === m;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
    this.root.querySelectorAll('[data-current-metric]').forEach(function (el) { el.textContent = self.data.metrics[m]; });
    this.root.querySelectorAll('[data-current-year]').forEach(function (el) { el.textContent = y; });

    // Barres : régions triées sur la valeur 2022, 10 premières en mode compact.
    this.sorted = this.regions.slice().sort(function (a, b) { return self.value(b, m, '2022') - self.value(a, m, '2022'); });
    if (this.compact) this.sorted = this.sorted.slice(0, 10);
    if (this.chart) {
      this.chart.data.labels = this.sorted.map(function (r) { return self.compact ? r.short : r.name; });
      this.chart.data.datasets[0].data = this.sorted.map(function (r) { return self.value(r, m, '2016'); });
      this.chart.data.datasets[1].data = this.sorted.map(function (r) { return self.value(r, m, '2022'); });
      this.chart.update(first && reducedMotion ? 'none' : undefined);
    }

    // Carte : bulles dimensionnées sur la valeur, ou colorées selon la part des 60+.
    if (this.bubbles) {
      const isShare = m === 'oldShare';
      const sizeMetric = isShare ? 'pop' : m;
      const maxV = d3.max(this.regions, function (r) { return self.value(r, sizeMetric, y); });
      this.bubbleScale.domain([0, maxV]);
      const shares = this.regions.map(function (r) { return self.value(r, 'oldShare', y); });
      this.shareScale.domain([d3.min(shares), d3.max(shares)]);

      const t = reducedMotion ? 0 : (first ? 900 : 550);
      this.bubbles.transition().duration(t).ease(d3.easeCubicOut)
        .attr('r', function (r) { return self.bubbleScale(self.value(r, sizeMetric, y)); })
        .attr('fill', function (r) { return isShare ? self.shareScale(self.value(r, 'oldShare', y)) : COLORS.accent; })
        .attr('stroke', function (r) { return isShare ? self.shareScale(self.value(r, 'oldShare', y)) : COLORS.accent; });

      if (this.mapLegend) {
        this.mapLegend.innerHTML = isShare
          ? '<span class="dv__legend-swatch" style="background:linear-gradient(90deg,' + COLORS.cool + ',' + COLORS.warm + ')"></span>' +
            '<span>Part des plus de 60 ans en ' + y + ' : de ' + formatPercent(d3.min(shares)) + ' à ' + formatPercent(d3.max(shares)) + ' · taille = population</span>'
          : '<span class="dv__legend-dot"></span><span>Taille des bulles : ' + this.data.metrics[m].toLowerCase() + ' en ' + y + '</span>';
      }
    }
  };

  function initDemography() {
    const roots = document.querySelectorAll('[data-dataviz="demographie"]');
    if (!roots.length) return;
    roots.forEach(function (root) {
      whenVisible(root, function () {
        const base = root.getAttribute('data-base') || '';
        const embedded = window.LZ_DATA || {};
        const sources = (embedded.demographie && embedded.regions)
          ? Promise.resolve([embedded.demographie, embedded.regions])
          : Promise.all([loadJSON(base + 'assets/data/demographie-regions.json'), loadJSON(base + 'assets/data/regions-france.json')]);
        sources.then(function (results) {
          root.classList.add('is-ready');
          instances.push(new DemographyViz(root, results[0], results[1]));
        }).catch(function (error) {
          root.classList.add('is-failed');
          const note = root.querySelector('.dv__fallback');
          if (note) note.hidden = false;
          if (window.console) console.warn('Infographie indisponible :', error.message);
        });
      });
    });
  }

  function init() {
    initDemography();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
