// tourTokens.js — single source of VISUAL truth for the tour.
//
// Reads the host app's :root design tokens (vlbi-react/css/app.css) at load via
// getComputedStyle, with fallbacks copied VERBATIM from that file. The tour therefore
// draws with the SAME colours/type as the rest of the app instead of its own drifted
// palette. This mirrors how tourPhysics.js is the single source of computed physics.
// Governed by .workflows/_system/DESIGN-LANGUAGE.md. The `cool` tone is the one
// Phase-B licensed cinematic divergence (space/cold/Earth-night), not an app token.
function cssVar(name, fallback) {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  } catch (_) { return fallback; }
}

export const TOKENS = Object.freeze({
  bg0:    cssVar('--bg-0', '#000000'),
  bg1:    cssVar('--bg-1', '#0a0a0a'),
  bg2:    cssVar('--bg-2', '#111111'),
  bg3:    cssVar('--bg-3', '#1a1a1a'),
  border: cssVar('--border', '#2d2200'),
  accent: cssVar('--accent-teal',  '#C4A555'),   // THE muted-gold accent
  amber:  cssVar('--accent-amber', '#9E7E38'),
  orange: cssVar('--accent-orange','#ff9f43'),
  textPrimary:   cssVar('--text-primary',   '#e8e8f0'),
  textSecondary: cssVar('--text-secondary', '#8888b0'),
  danger: cssVar('--danger',  '#ff6b6b'),
  success:cssVar('--success', '#55efc4'),
  font:     cssVar('--font',      "'Inter', system-ui, sans-serif"),
  fontMono: cssVar('--font-mono', "'JetBrains Mono', monospace"),
  cool:   '#3a4a6a',   // Phase-B licensed cinematic cool (space / Earth night side)
});
