// Palette generation in OKLCH. Lightness and hue stay perceptually even across
// steps, which sRGB/HSL mixing (white/black blends) does not give.

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

// Lightness of each step when the base color sits at its "natural" position.
const DEFAULT_LADDER = [0.97, 0.93, 0.87, 0.78, 0.68, 0.58, 0.5, 0.43, 0.36, 0.29];

const LIGHTEST = 0.975;
const DARKEST = 0.25;

// Natural hues for status colors (OKLCH degrees). They are nudged toward the
// primary hue so they read as one family, but stay recognizable.
const STATUS = {
  success: { hue: 150, lightness: 0.6, chroma: 0.15 },
  warning: { hue: 75, lightness: 0.78, chroma: 0.16 },
  danger: { hue: 25, lightness: 0.6, chroma: 0.19 },
  info: { hue: 240, lightness: 0.62, chroma: 0.14 },
};

const STATUS_NUDGE_DEGREES = 10;

export const parseHex = (input) => {
  const value = String(input).trim().replace(/^#/, "");
  const full = value.length === 3 ? [...value].map((char) => char + char).join("") : value;

  if (!/^[0-9a-f]{6}$/i.test(full)) {
    throw new Error(`"${input}" is not a hex color. Use a value like #0b44ae or 0b44ae.`);
  }

  return [0, 2, 4].map((offset) => parseInt(full.slice(offset, offset + 2), 16) / 255);
};

const toHex = (rgb) =>
  `#${rgb
    .map((channel) => Math.round(Math.min(Math.max(channel, 0), 1) * 255).toString(16).padStart(2, "0"))
    .join("")}`;

const srgbToLinear = (channel) =>
  channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

const linearToSrgb = (channel) =>
  channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055;

const rgbToOklch = (rgb) => {
  const [r, g, b] = rgb.map(srgbToLinear);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bAxis = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const hue = ((Math.atan2(bAxis, a) * 180) / Math.PI + 360) % 360;

  return { l: lightness, c: Math.hypot(a, bAxis), h: hue };
};

const oklchToLinearRgb = ({ l: lightness, c, h }) => {
  const radians = (h * Math.PI) / 180;
  const a = c * Math.cos(radians);
  const b = c * Math.sin(radians);

  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
};

const isInGamut = (linear) => linear.every((channel) => channel >= -0.0001 && channel <= 1.0001);

// Lowers chroma until the color fits in sRGB, keeping lightness and hue.
const oklchToHex = (color) => {
  let { c } = color;

  while (c > 0 && !isInGamut(oklchToLinearRgb({ ...color, c }))) {
    c -= 0.002;
  }

  return toHex(oklchToLinearRgb({ ...color, c: Math.max(c, 0) }).map(linearToSrgb));
};

const relativeLuminance = (hex) => {
  const [r, g, b] = parseHex(hex).map(srgbToLinear);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const contrastRatio = (first, second) => {
  const [lighter, darker] = [relativeLuminance(first), relativeLuminance(second)].sort((x, y) => y - x);

  return (lighter + 0.05) / (darker + 0.05);
};

const hueDistance = (first, second) => {
  const distance = Math.abs(first - second) % 360;

  return distance > 180 ? 360 - distance : distance;
};

const nudgeHue = (from, toward, degrees) => {
  const delta = ((toward - from + 540) % 360) - 180;
  const step = Math.sign(delta) * Math.min(Math.abs(delta), degrees);

  return (from + step + 360) % 360;
};

// Peak chroma in the middle of the ladder, tapering toward white and black.
const chromaFactor = (lightness) => Math.min(Math.max(1 - ((lightness - 0.55) / 0.43) ** 2, 0.06), 1);

// Near white, chroma is also capped by distance from white so tints stay soft
// instead of turning into pastel neon.
const tintChroma = (baseChroma, lightness) =>
  Math.min(baseChroma * chromaFactor(lightness), Math.max((0.995 - lightness) * 0.45, 0.004));

const buildLadder = (baseLightness) => {
  const baseIndex = DEFAULT_LADDER.reduce(
    (best, value, index) =>
      Math.abs(value - baseLightness) < Math.abs(DEFAULT_LADDER[best] - baseLightness) ? index : best,
    0,
  );

  const ladder = DEFAULT_LADDER.map((_, index) => {
    if (index === baseIndex) {
      return baseLightness;
    }

    if (index < baseIndex) {
      const progress = (baseIndex - index) / baseIndex;

      return baseLightness + (LIGHTEST - baseLightness) * progress ** 0.9;
    }

    const progress = (index - baseIndex) / (DEFAULT_LADDER.length - 1 - baseIndex);

    return baseLightness - (baseLightness - DARKEST) * progress;
  });

  return { ladder, baseIndex };
};

const pickAccentHue = (primaryHue) => {
  const candidates = [30, -30, 150, -150, 180].map((offset) => (primaryHue + offset + 360) % 360);
  const statusHues = Object.values(STATUS).map((status) => status.hue);

  return candidates.reduce((best, hue) => {
    const score = Math.min(...statusHues.map((statusHue) => hueDistance(hue, statusHue)));
    const bestScore = Math.min(...statusHues.map((statusHue) => hueDistance(best, statusHue)));

    return score > bestScore ? hue : best;
  });
};

export const generatePalette = (input) => {
  const baseHex = toHex(parseHex(input));
  const base = rgbToOklch(parseHex(baseHex));
  const { ladder, baseIndex } = buildLadder(base.l);

  const primary = Object.fromEntries(
    STEPS.map((step, index) => [
      step,
      index === baseIndex
        ? baseHex
        : oklchToHex({ l: ladder[index], c: tintChroma(base.c, ladder[index]), h: base.h }),
    ]),
  );

  // Darker steps for hover/active. A base already at the dark end goes lighter instead.
  const hoverIndex = baseIndex <= 7 ? baseIndex + 1 : baseIndex - 1;
  const activeIndex = baseIndex <= 7 ? baseIndex + 2 : baseIndex - 2;

  const accentHue = pickAccentHue(base.h);
  const accent = oklchToHex({ l: 0.62, c: Math.min(Math.max(base.c, 0.1), 0.18), h: accentHue });

  const status = Object.fromEntries(
    Object.entries(STATUS).map(([name, spec]) => [
      name,
      oklchToHex({ l: spec.lightness, c: spec.chroma, h: nudgeHue(spec.hue, base.h, STATUS_NUDGE_DEGREES) }),
    ]),
  );

  const neutrals = {
    background: oklchToHex({ l: 0.985, c: 0.006, h: base.h }),
    surface: "#ffffff",
    text: oklchToHex({ l: 0.22, c: 0.035, h: base.h }),
    muted: oklchToHex({ l: 0.5, c: 0.03, h: base.h }),
    border: oklchToHex({ l: 0.9, c: 0.03, h: base.h }),
  };

  const checks = [
    { label: "white text on primary", ratio: contrastRatio("#ffffff", baseHex) },
    { label: "text on background", ratio: contrastRatio(neutrals.text, neutrals.background) },
    { label: "muted text on background", ratio: contrastRatio(neutrals.muted, neutrals.background) },
    { label: "primary on surface", ratio: contrastRatio(baseHex, neutrals.surface) },
  ].map((check) => ({ ...check, ratio: Math.round(check.ratio * 100) / 100, passes: check.ratio >= 4.5 }));

  return {
    base: baseHex,
    baseStep: STEPS[baseIndex],
    hoverStep: STEPS[hoverIndex],
    activeStep: STEPS[activeIndex],
    primary,
    accent,
    status,
    neutrals,
    checks,
  };
};
