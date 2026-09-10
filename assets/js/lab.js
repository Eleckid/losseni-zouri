/* ==========================================================================
   Portfolio - Losseni Zouri - panneau « Lab » (outil de test, temporaire)
   Bascule en direct entre plusieurs systèmes typographiques (Google Fonts)
   et plusieurs palettes, en réécrivant les variables CSS du design system.
   Le choix est mémorisé (localStorage) pour survivre au changement de page.
   À retirer une fois le verdict rendu : supprimer ce fichier et sa balise.
   ========================================================================== */

(function () {
  'use strict';

  const STORAGE_KEY = 'lz-lab';
  const root = document.documentElement;

  /* ------------------------------------------------------------------ Typo */
  const FONTS = [
    { id: 'A', name: 'Sora · Instrument Sans · Geist Mono', display: "'Sora', sans-serif", body: "'Instrument Sans', sans-serif", mono: "'Geist Mono', monospace", google: null, weight: 800, tracking: '-0.045em' },
    { id: 'B', name: 'Syne · Manrope · JetBrains Mono', display: "'Syne', sans-serif", body: "'Manrope', sans-serif", mono: "'JetBrains Mono', monospace", google: 'Syne:wght@700;800&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500', weight: 800, tracking: '-0.03em', scale: 0.8 },
    { id: 'C', name: 'Bricolage Grotesque · Instrument Sans · Geist Mono', display: "'Bricolage Grotesque', sans-serif", body: "'Instrument Sans', sans-serif", mono: "'Geist Mono', monospace", google: 'Bricolage+Grotesque:opsz,wght@12..96,400..800', weight: 800, tracking: '-0.04em', variation: "'opsz' 96" },
    { id: 'D', name: 'Archivo Expanded · Figtree · DM Mono', display: "'Archivo', sans-serif", body: "'Figtree', sans-serif", mono: "'DM Mono', monospace", google: 'Archivo:wdth,wght@125,700..800&family=Figtree:wght@400;500;600;700&family=DM+Mono:wght@400;500', weight: 800, tracking: '-0.02em', variation: "'wdth' 125", scale: 0.84 },
    { id: 'E', name: 'Unbounded · Onest · IBM Plex Mono', display: "'Unbounded', sans-serif", body: "'Onest', sans-serif", mono: "'IBM Plex Mono', monospace", google: 'Unbounded:wght@600;700&family=Onest:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500', weight: 700, tracking: '-0.03em', scale: 0.72 },
    { id: 'F', name: 'Orbitron · Exo 2 · Share Tech Mono', display: "'Orbitron', sans-serif", body: "'Exo 2', sans-serif", mono: "'Share Tech Mono', monospace", google: 'Orbitron:wght@700;800&family=Exo+2:wght@400;500;600;700&family=Share+Tech+Mono', weight: 800, tracking: '-0.01em', scale: 0.8 },
    { id: 'G', name: 'Bebas Neue · Manrope · DM Mono', display: "'Bebas Neue', sans-serif", body: "'Manrope', sans-serif", mono: "'DM Mono', monospace", google: 'Bebas+Neue&family=Manrope:wght@400;500;600;700&family=DM+Mono:wght@400;500', weight: 400, tracking: '0.01em', transform: 'uppercase', scale: 1.22, leading: 0.9 },
    { id: 'H', name: 'Plus Jakarta Sans · Geist Mono', display: "'Plus Jakarta Sans', sans-serif", body: "'Plus Jakarta Sans', sans-serif", mono: "'Geist Mono', monospace", google: 'Plus+Jakarta+Sans:wght@400;500;600;700;800', weight: 800, tracking: '-0.04em' },
    { id: 'I', name: 'Outfit · Figtree · JetBrains Mono', display: "'Outfit', sans-serif", body: "'Figtree', sans-serif", mono: "'JetBrains Mono', monospace", google: 'Outfit:wght@700;800&family=Figtree:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500', weight: 800, tracking: '-0.04em' },
    { id: 'J', name: 'Chakra Petch · Barlow · Roboto Mono', display: "'Chakra Petch', sans-serif", body: "'Barlow', sans-serif", mono: "'Roboto Mono', monospace", google: 'Chakra+Petch:wght@600;700&family=Barlow:wght@400;500;600;700&family=Roboto+Mono:wght@400;500', weight: 700, tracking: '-0.01em' }
  ];

  /* --------------------------------------------------------------- Palettes
     Clés : bg, bg-deep, surface, surface-alt, surface-raised, ink, muted,
     faint, line, line-strong, grid, accent, accent-hover, accent-soft,
     accent-glow, on-accent, violet (2e accent), cyan (3e accent), amber. */
  function palette(id, name, scheme, v) {
    return { id: id, name: name, scheme: scheme, vars: v };
  }

  const PALETTES = [
    palette('1', 'Observatoire · navy, menthe, cyan, violet', 'dark', {
      'bg': '#0A0D17', 'bg-deep': '#070912', 'surface': '#10141F', 'surface-alt': '#161B2A', 'surface-raised': '#1C2234',
      'ink': '#EEF1F6', 'muted': '#9AA3B5', 'faint': '#7C8598', 'line': 'rgba(238,241,246,0.08)', 'line-strong': 'rgba(238,241,246,0.18)', 'grid': 'rgba(238,241,246,0.11)',
      'accent': '#5EE6C9', 'accent-hover': '#8AEFDB', 'accent-soft': 'rgba(94,230,201,0.12)', 'accent-glow': 'rgba(94,230,201,0.35)', 'on-accent': '#06110E',
      'violet': '#8B7CFF', 'cyan': '#56C8FF', 'amber': '#F5B841'
    }),
    palette('2', 'Encre & Or · noir chaud, or, cuivre, sauge', 'dark', {
      'bg': '#0C0B0F', 'bg-deep': '#08070A', 'surface': '#14121A', 'surface-alt': '#1B1822', 'surface-raised': '#241F2C',
      'ink': '#F3EFE4', 'muted': '#B3AB9C', 'faint': '#8C8578', 'line': 'rgba(243,239,228,0.08)', 'line-strong': 'rgba(243,239,228,0.18)', 'grid': 'rgba(243,239,228,0.11)',
      'accent': '#E6B450', 'accent-hover': '#F0C86E', 'accent-soft': 'rgba(230,180,80,0.14)', 'accent-glow': 'rgba(230,180,80,0.35)', 'on-accent': '#1A1204',
      'violet': '#E07A4F', 'cyan': '#9BC4A8', 'amber': '#E6B450'
    }),
    palette('3', 'Terminal · noir vert, phosphore, lime', 'dark', {
      'bg': '#070A08', 'bg-deep': '#040605', 'surface': '#0C120E', 'surface-alt': '#111A14', 'surface-raised': '#16221B',
      'ink': '#E8F5EA', 'muted': '#9DB8A4', 'faint': '#789C82', 'line': 'rgba(232,245,234,0.08)', 'line-strong': 'rgba(232,245,234,0.18)', 'grid': 'rgba(232,245,234,0.11)',
      'accent': '#7CFC9A', 'accent-hover': '#A3FFB7', 'accent-soft': 'rgba(124,252,154,0.12)', 'accent-glow': 'rgba(124,252,154,0.35)', 'on-accent': '#06150B',
      'violet': '#C8F542', 'cyan': '#5EEAD4', 'amber': '#F5D442'
    }),
    palette('4', 'Abysse · sarcelle profond, aqua, corail, sable', 'dark', {
      'bg': '#061417', 'bg-deep': '#04100F', 'surface': '#0A1D21', 'surface-alt': '#0F262B', 'surface-raised': '#143036',
      'ink': '#EAF7F7', 'muted': '#9FC3C4', 'faint': '#7AA3A5', 'line': 'rgba(234,247,247,0.08)', 'line-strong': 'rgba(234,247,247,0.18)', 'grid': 'rgba(234,247,247,0.11)',
      'accent': '#38E1D6', 'accent-hover': '#6BEEE5', 'accent-soft': 'rgba(56,225,214,0.12)', 'accent-glow': 'rgba(56,225,214,0.35)', 'on-accent': '#04211F',
      'violet': '#FF6B5B', 'cyan': '#F2D8A8', 'amber': '#F2B84C'
    }),
    palette('5', 'Néon Nuit · indigo, magenta, bleu électrique, jaune', 'dark', {
      'bg': '#0D0A1A', 'bg-deep': '#090714', 'surface': '#141026', 'surface-alt': '#1B1632', 'surface-raised': '#241D40',
      'ink': '#F4F0FF', 'muted': '#B4A9D6', 'faint': '#8B7FB0', 'line': 'rgba(244,240,255,0.08)', 'line-strong': 'rgba(244,240,255,0.18)', 'grid': 'rgba(244,240,255,0.11)',
      'accent': '#FF4FD8', 'accent-hover': '#FF7AE3', 'accent-soft': 'rgba(255,79,216,0.12)', 'accent-glow': 'rgba(255,79,216,0.35)', 'on-accent': '#1F0518',
      'violet': '#4F7BFF', 'cyan': '#F9F871', 'amber': '#FFB020'
    }),
    palette('6', 'Graphite & Signal · gris neutre, orange, bleu acier', 'dark', {
      'bg': '#111214', 'bg-deep': '#0C0D0E', 'surface': '#18191C', 'surface-alt': '#1F2024', 'surface-raised': '#26282D',
      'ink': '#F2F2F0', 'muted': '#A9ABAF', 'faint': '#83868C', 'line': 'rgba(242,242,240,0.08)', 'line-strong': 'rgba(242,242,240,0.18)', 'grid': 'rgba(242,242,240,0.11)',
      'accent': '#FF7A1A', 'accent-hover': '#FF9548', 'accent-soft': 'rgba(255,122,26,0.12)', 'accent-glow': 'rgba(255,122,26,0.35)', 'on-accent': '#1A0B00',
      'violet': '#6FA8DC', 'cyan': '#C6F04A', 'amber': '#FFC857'
    }),
    palette('7', 'Boréale · marine, cyan glacé, lavande, vert aurore', 'dark', {
      'bg': '#0A1020', 'bg-deep': '#070B18', 'surface': '#10182C', 'surface-alt': '#162038', 'surface-raised': '#1C2946',
      'ink': '#EEF3FF', 'muted': '#A3B1D0', 'faint': '#7E8CAE', 'line': 'rgba(238,243,255,0.08)', 'line-strong': 'rgba(238,243,255,0.18)', 'grid': 'rgba(238,243,255,0.11)',
      'accent': '#7DF9FF', 'accent-hover': '#A5FBFF', 'accent-soft': 'rgba(125,249,255,0.12)', 'accent-glow': 'rgba(125,249,255,0.35)', 'on-accent': '#03161A',
      'violet': '#B388FF', 'cyan': '#62E6A8', 'amber': '#FFD166'
    }),
    palette('8', 'Cuivre & Ardoise · ardoise, cuivre, sarcelle, crème', 'dark', {
      'bg': '#14161C', 'bg-deep': '#0F1115', 'surface': '#1B1E25', 'surface-alt': '#22262E', 'surface-raised': '#2A2F39',
      'ink': '#F1EEE9', 'muted': '#ADA9A1', 'faint': '#86827A', 'line': 'rgba(241,238,233,0.08)', 'line-strong': 'rgba(241,238,233,0.18)', 'grid': 'rgba(241,238,233,0.11)',
      'accent': '#E39A5E', 'accent-hover': '#EDB07C', 'accent-soft': 'rgba(227,154,94,0.12)', 'accent-glow': 'rgba(227,154,94,0.35)', 'on-accent': '#1A0F05',
      'violet': '#4FB3A9', 'cyan': '#EAD9B8', 'amber': '#E39A5E'
    }),
    palette('9', 'Monochrome · noir, blanc, gris', 'dark', {
      'bg': '#0A0A0A', 'bg-deep': '#050505', 'surface': '#121212', 'surface-alt': '#181818', 'surface-raised': '#202020',
      'ink': '#FAFAFA', 'muted': '#A3A3A3', 'faint': '#7A7A7A', 'line': 'rgba(250,250,250,0.1)', 'line-strong': 'rgba(250,250,250,0.2)', 'grid': 'rgba(250,250,250,0.12)',
      'accent': '#FFFFFF', 'accent-hover': '#FFFFFF', 'accent-soft': 'rgba(255,255,255,0.1)', 'accent-glow': 'rgba(255,255,255,0.3)', 'on-accent': '#0A0A0A',
      'violet': '#BDBDBD', 'cyan': '#E0E0E0', 'amber': '#FFFFFF'
    }),
    palette('10', 'Lumière · thème clair, sarcelle, violet, ambre', 'light', {
      'bg': '#F5F7FB', 'bg-deep': '#EAEEF5', 'surface': '#FFFFFF', 'surface-alt': '#F0F3F8', 'surface-raised': '#E6EAF2',
      'ink': '#0F172A', 'muted': '#4B5565', 'faint': '#6B7280', 'line': 'rgba(15,23,42,0.08)', 'line-strong': 'rgba(15,23,42,0.18)', 'grid': 'rgba(15,23,42,0.12)',
      'accent': '#0B7F72', 'accent-hover': '#085E55', 'accent-soft': 'rgba(11,127,114,0.10)', 'accent-glow': 'rgba(11,127,114,0.3)', 'on-accent': '#FFFFFF',
      'violet': '#6D28D9', 'cyan': '#0369A1', 'amber': '#B45309'
    }),
    palette('11', 'Azur & Ambre · bleu nuit, azur, lavande, ambre', 'dark', {
      'bg': '#0A101F', 'bg-deep': '#070B17', 'surface': '#0F1729', 'surface-alt': '#151E34', 'surface-raised': '#1C2742',
      'ink': '#ECF1FA', 'muted': '#9BAAC6', 'faint': '#7E8DAC', 'line': 'rgba(236,241,250,0.08)', 'line-strong': 'rgba(236,241,250,0.18)', 'grid': 'rgba(236,241,250,0.11)',
      'accent': '#5B9DFF', 'accent-hover': '#89B8FF', 'accent-soft': 'rgba(91,157,255,0.12)', 'accent-glow': 'rgba(91,157,255,0.35)', 'on-accent': '#08090C',
      'violet': '#A98BFF', 'cyan': '#3FD8C2', 'amber': '#FFC24B'
    }),
    palette('12', 'Forêt & Laiton · vert profond, jade, laiton, terracotta', 'dark', {
      'bg': '#0A130F', 'bg-deep': '#071009', 'surface': '#0F1B15', 'surface-alt': '#14241C', 'surface-raised': '#1A2E23',
      'ink': '#ECF3ED', 'muted': '#A0B5A6', 'faint': '#829A88', 'line': 'rgba(236,243,237,0.08)', 'line-strong': 'rgba(236,243,237,0.18)', 'grid': 'rgba(236,243,237,0.11)',
      'accent': '#59C99A', 'accent-hover': '#7CD4AF', 'accent-soft': 'rgba(89,201,154,0.12)', 'accent-glow': 'rgba(89,201,154,0.35)', 'on-accent': '#08090C',
      'violet': '#D8AC57', 'cyan': '#55B8C4', 'amber': '#D2694A'
    }),
    palette('13', 'Vermillon & Ardoise · charbon chaud, vermillon, bleu acier, or', 'dark', {
      'bg': '#121010', 'bg-deep': '#0D0B0B', 'surface': '#1A1716', 'surface-alt': '#221E1C', 'surface-raised': '#2B2624',
      'ink': '#F4F0EC', 'muted': '#B0A79F', 'faint': '#8D857E', 'line': 'rgba(244,240,236,0.08)', 'line-strong': 'rgba(244,240,236,0.18)', 'grid': 'rgba(244,240,236,0.11)',
      'accent': '#FF5A36', 'accent-hover': '#FF8064', 'accent-soft': 'rgba(255,90,54,0.12)', 'accent-glow': 'rgba(255,90,54,0.35)', 'on-accent': '#08090C',
      'violet': '#7CA9DB', 'cyan': '#58C0B0', 'amber': '#E9C46A'
    }),
    palette('14', 'Iris & Menthe · indigo doux, iris, menthe, rose', 'dark', {
      'bg': '#0F0E1B', 'bg-deep': '#0B0A15', 'surface': '#171628', 'surface-alt': '#1E1D33', 'surface-raised': '#262541',
      'ink': '#F0EFFA', 'muted': '#A7A4C4', 'faint': '#8885A8', 'line': 'rgba(240,239,250,0.08)', 'line-strong': 'rgba(240,239,250,0.18)', 'grid': 'rgba(240,239,250,0.11)',
      'accent': '#8F8CFF', 'accent-hover': '#BCBAFF', 'accent-soft': 'rgba(143,140,255,0.12)', 'accent-glow': 'rgba(143,140,255,0.35)', 'on-accent': '#08090C',
      'violet': '#4FD8B6', 'cyan': '#FF9EC4', 'amber': '#FFD08A'
    }),
    palette('15', 'Chartreuse & Ardoise · gris-vert, lime, azur, corail', 'dark', {
      'bg': '#101311', 'bg-deep': '#0B0E0C', 'surface': '#171B18', 'surface-alt': '#1E231F', 'surface-raised': '#262C27',
      'ink': '#F0F3EF', 'muted': '#A9B2A9', 'faint': '#879187', 'line': 'rgba(240,243,239,0.08)', 'line-strong': 'rgba(240,243,239,0.18)', 'grid': 'rgba(240,243,239,0.11)',
      'accent': '#C6F24A', 'accent-hover': '#D3F575', 'accent-soft': 'rgba(198,242,74,0.12)', 'accent-glow': 'rgba(198,242,74,0.35)', 'on-accent': '#08090C',
      'violet': '#58B4F5', 'cyan': '#FF7E5F', 'amber': '#E7C84C'
    }),
    palette('16', 'Mandarine & Nuit · bleu nuit, mandarine, azur, turquoise', 'dark', {
      'bg': '#0B1020', 'bg-deep': '#070B17', 'surface': '#111829', 'surface-alt': '#182034', 'surface-raised': '#1F2942',
      'ink': '#EEF2FA', 'muted': '#9EACC6', 'faint': '#7F8EAA', 'line': 'rgba(238,242,250,0.08)', 'line-strong': 'rgba(238,242,250,0.18)', 'grid': 'rgba(238,242,250,0.11)',
      'accent': '#FF8A3D', 'accent-hover': '#FFA66B', 'accent-soft': 'rgba(255,138,61,0.12)', 'accent-glow': 'rgba(255,138,61,0.35)', 'on-accent': '#08090C',
      'violet': '#59C2FF', 'cyan': '#4FE0C0', 'amber': '#FFC93C'
    }),
    palette('17', 'Prune & Champagne · prune, champagne, mauve, vert d’eau', 'dark', {
      'bg': '#140F1A', 'bg-deep': '#0F0B14', 'surface': '#1C1524', 'surface-alt': '#241C2E', 'surface-raised': '#2D2439',
      'ink': '#F4EFF6', 'muted': '#B6A9BE', 'faint': '#948898', 'line': 'rgba(244,239,246,0.08)', 'line-strong': 'rgba(244,239,246,0.18)', 'grid': 'rgba(244,239,246,0.11)',
      'accent': '#E5C79A', 'accent-hover': '#EEDBBF', 'accent-soft': 'rgba(229,199,154,0.12)', 'accent-glow': 'rgba(229,199,154,0.35)', 'on-accent': '#08090C',
      'violet': '#B48FD6', 'cyan': '#7ED0BA', 'amber': '#E58BA6'
    }),
    palette('18', 'Olive & Ambre · kaki sombre, ambre, ciel, rouille', 'dark', {
      'bg': '#12130C', 'bg-deep': '#0D0E09', 'surface': '#1A1B12', 'surface-alt': '#212317', 'surface-raised': '#292B1D',
      'ink': '#F2F2E6', 'muted': '#B3B49E', 'faint': '#91927D', 'line': 'rgba(242,242,230,0.08)', 'line-strong': 'rgba(242,242,230,0.18)', 'grid': 'rgba(242,242,230,0.11)',
      'accent': '#E0B341', 'accent-hover': '#E6C368', 'accent-soft': 'rgba(224,179,65,0.12)', 'accent-glow': 'rgba(224,179,65,0.35)', 'on-accent': '#08090C',
      'violet': '#7FA8D4', 'cyan': '#C4D66B', 'amber': '#D97742'
    }),
    palette('19', 'Marine & Corail · marine, corail, turquoise, bleuet', 'dark', {
      'bg': '#0A1420', 'bg-deep': '#070F19', 'surface': '#101E2C', 'surface-alt': '#152738', 'surface-raised': '#1C3146',
      'ink': '#EDF3F8', 'muted': '#9DB1C2', 'faint': '#7E93A6', 'line': 'rgba(237,243,248,0.08)', 'line-strong': 'rgba(237,243,248,0.18)', 'grid': 'rgba(237,243,248,0.11)',
      'accent': '#FF6B6B', 'accent-hover': '#FF9999', 'accent-soft': 'rgba(255,107,107,0.12)', 'accent-glow': 'rgba(255,107,107,0.35)', 'on-accent': '#08090C',
      'violet': '#4ECDC4', 'cyan': '#FFE66D', 'amber': '#8FA9FF'
    }),
    palette('20', 'Nordique clair · blanc bleuté, bleu profond, ambre', 'light', {
      'bg': '#F6F8FC', 'bg-deep': '#E9EEF7', 'surface': '#FFFFFF', 'surface-alt': '#F1F4FA', 'surface-raised': '#E7ECF6',
      'ink': '#0E1A2B', 'muted': '#4A5A70', 'faint': '#5E6E85', 'line': 'rgba(14,26,43,0.09)', 'line-strong': 'rgba(14,26,43,0.18)', 'grid': 'rgba(14,26,43,0.11)',
      'accent': '#1D4ED8', 'accent-hover': '#1943B9', 'accent-soft': 'rgba(29,78,216,0.12)', 'accent-glow': 'rgba(29,78,216,0.35)', 'on-accent': '#FFFFFF',
      'violet': '#7C3AED', 'cyan': '#0E7490', 'amber': '#B45309'
    }),
    palette('21', 'Crème & Forêt · crème, vert forêt, argile, ocre', 'light', {
      'bg': '#FAF7F0', 'bg-deep': '#F1ECE1', 'surface': '#FFFFFF', 'surface-alt': '#F5F1E8', 'surface-raised': '#EDE7DA',
      'ink': '#17211C', 'muted': '#4E5B52', 'faint': '#647065', 'line': 'rgba(23,33,28,0.09)', 'line-strong': 'rgba(23,33,28,0.18)', 'grid': 'rgba(23,33,28,0.11)',
      'accent': '#1F6F52', 'accent-hover': '#17533D', 'accent-soft': 'rgba(31,111,82,0.12)', 'accent-glow': 'rgba(31,111,82,0.35)', 'on-accent': '#FFFFFF',
      'violet': '#B4531F', 'cyan': '#2F6F8F', 'amber': '#946A12'
    }),
    palette('22', 'Ardoise claire · gris froid, indigo, corail, sarcelle', 'light', {
      'bg': '#F4F5F7', 'bg-deep': '#E8EAEE', 'surface': '#FFFFFF', 'surface-alt': '#EFF1F4', 'surface-raised': '#E5E8EC',
      'ink': '#111418', 'muted': '#4C535C', 'faint': '#626973', 'line': 'rgba(17,20,24,0.09)', 'line-strong': 'rgba(17,20,24,0.18)', 'grid': 'rgba(17,20,24,0.11)',
      'accent': '#4338CA', 'accent-hover': '#382FB0', 'accent-soft': 'rgba(67,56,202,0.12)', 'accent-glow': 'rgba(67,56,202,0.35)', 'on-accent': '#FFFFFF',
      'violet': '#C2410C', 'cyan': '#0F766E', 'amber': '#A16207'
    })
  ];

  const state = { font: 'A', palette: '1' };

  function dispatch() {
    window.dispatchEvent(new CustomEvent('lz:theme', { detail: { font: state.font, palette: state.palette } }));
  }

  function loadGoogle(combo) {
    if (!combo.google || combo.loaded) return Promise.resolve();
    combo.loaded = true;
    return new Promise(function (resolve) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=' + combo.google + '&display=swap';
      link.onload = resolve;
      link.onerror = resolve;
      document.head.appendChild(link);
    });
  }

  function applyFont(id) {
    const combo = FONTS.find(function (f) { return f.id === id; }) || FONTS[0];
    state.font = combo.id;
    const s = root.style;
    s.setProperty('--font-display', combo.display);
    s.setProperty('--font-sans', combo.body);
    s.setProperty('--font-mono', combo.mono);
    s.setProperty('--display-weight', String(combo.weight));
    s.setProperty('--display-tracking', combo.tracking);
    s.setProperty('--display-transform', combo.transform || 'none');
    s.setProperty('--display-variation', combo.variation || 'normal');
    s.setProperty('--display-scale', String(combo.scale || 1));
    s.setProperty('--display-leading', String(combo.leading || 0.92));
    loadGoogle(combo).then(function () { return document.fonts.ready; }).then(dispatch);
  }

  function applyPalette(id) {
    const p = PALETTES.find(function (x) { return x.id === id; }) || PALETTES[0];
    state.palette = p.id;
    const s = root.style;
    Object.keys(p.vars).forEach(function (key) { s.setProperty('--color-' + key, p.vars[key]); });
    s.setProperty('--lab-scheme', p.scheme);
    dispatch();
  }

  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* stockage indisponible */ }
  }

  function restore() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && saved.font) state.font = saved.font;
      if (saved && saved.palette) state.palette = saved.palette;
    } catch (e) { /* ignoré */ }
  }

  function reset() {
    state.font = 'A';
    state.palette = '1';
    root.removeAttribute('style');
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignoré */ }
    dispatch();
  }

  /* --------------------------------------------------------------------- UI */
  function buildUI() {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'lab-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'lab-panel');
    toggle.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M3 6h9m3 0h2M3 14h2m3 0h9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="13.5" cy="6" r="2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="6.5" cy="14" r="2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg><span>Lab</span>';

    const panel = document.createElement('section');
    panel.className = 'lab-panel';
    panel.id = 'lab-panel';
    panel.hidden = true;
    panel.setAttribute('aria-label', 'Laboratoire typographie et palette');

    let html = '<header class="lab__head"><strong>Lab</strong><span>Typographie &amp; palette - outil de test, retiré après le verdict</span><button type="button" class="lab__reset">Réinitialiser</button></header>';
    html += '<div class="lab__groups">';
    html += '<div class="lab__group"><h3 class="lab__title">Typographie <span>' + FONTS.length + '</span></h3><ul class="lab__list">';
    FONTS.forEach(function (f) {
      html += '<li><button type="button" class="lab__item" data-font="' + f.id + '"><span class="lab__id">' + f.id + '</span><span class="lab__name">' + f.name + '</span></button></li>';
    });
    html += '</ul></div>';
    html += '<div class="lab__group"><h3 class="lab__title">Palette <span>' + PALETTES.length + '</span></h3><ul class="lab__list">';
    let family = '';
    /* Affichage regroupé : toutes les palettes sombres, puis les claires. */
    const ordered = PALETTES.slice().sort(function (a, b) {
      if (a.scheme !== b.scheme) return a.scheme === 'dark' ? -1 : 1;
      return Number(a.id) - Number(b.id);
    });
    ordered.forEach(function (p) {
      if (p.scheme !== family) {
        family = p.scheme;
        html += '<li class="lab__sep">' + (family === 'dark' ? 'Sombres' : 'Claires') + '</li>';
      }
      html += '<li><button type="button" class="lab__item" data-palette="' + p.id + '"><span class="lab__id">' + p.id + '</span><span class="lab__swatch"><i style="background:' + p.vars.bg + '"></i><i style="background:' + p.vars.accent + '"></i><i style="background:' + p.vars.violet + '"></i><i style="background:' + p.vars.cyan + '"></i><i style="background:' + p.vars.amber + '"></i></span><span class="lab__name">' + p.name + '</span></button></li>';
    });
    html += '</ul></div></div>';
    panel.innerHTML = html;

    document.body.appendChild(toggle);
    document.body.appendChild(panel);

    function markActive(scroll) {
      panel.querySelectorAll('[data-font]').forEach(function (b) { b.classList.toggle('is-active', b.getAttribute('data-font') === state.font); });
      panel.querySelectorAll('[data-palette]').forEach(function (b) { b.classList.toggle('is-active', b.getAttribute('data-palette') === state.palette); });
      if (!scroll) return;
      panel.querySelectorAll('.lab__item.is-active').forEach(function (b) {
        const list = b.closest('.lab__list');
        if (list && list.scrollHeight > list.clientHeight) {
          list.scrollTop = b.offsetTop - list.clientHeight / 2 + b.offsetHeight / 2;
        }
      });
    }

    toggle.addEventListener('click', function () {
      const open = panel.hidden;
      panel.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      if (open) markActive(true);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !panel.hidden) {
        panel.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });

    panel.addEventListener('click', function (event) {
      const item = event.target.closest('.lab__item');
      if (item) {
        if (item.hasAttribute('data-font')) applyFont(item.getAttribute('data-font'));
        if (item.hasAttribute('data-palette')) applyPalette(item.getAttribute('data-palette'));
        persist();
        markActive();
        return;
      }
      if (event.target.closest('.lab__reset')) {
        reset();
        markActive();
      }
    });

    markActive();
  }

  function init() {
    restore();
    if (state.font !== 'A') applyFont(state.font);
    if (state.palette !== '1') applyPalette(state.palette);
    buildUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
