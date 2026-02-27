type Rgba = {
  r: number;
  g: number;
  b: number;
  a: number;
};

const HEX_COLOR_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const RGB_COLOR_RE = /^rgba?\(([^)]+)\)$/i;

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function parseHexToRgba(input: string): Rgba {
  const normalized = input.trim();
  if (!HEX_COLOR_RE.test(normalized)) {
    throw new Error(`Unsupported hex color: ${input}`);
  }

  const hex = normalized.slice(1);
  const expanded =
    hex.length === 3
      ? hex
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : hex;
  const value = Number.parseInt(expanded, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
    a: 1,
  };
}

function parseRgbToRgba(input: string): Rgba {
  const normalized = input.trim();
  const match = RGB_COLOR_RE.exec(normalized);
  if (!match?.[1]) {
    throw new Error(`Unsupported rgb/rgba color: ${input}`);
  }

  const parts = match[1].split(',').map((part) => part.trim());
  if (parts.length < 3 || parts.length > 4) {
    throw new Error(`Invalid rgb/rgba color component count: ${input}`);
  }

  const [rPart, gPart, bPart, aPart] = parts;

  return {
    r: clamp(Number.parseFloat(rPart), 0, 255),
    g: clamp(Number.parseFloat(gPart), 0, 255),
    b: clamp(Number.parseFloat(bPart), 0, 255),
    a: clamp(aPart === undefined ? 1 : Number.parseFloat(aPart), 0, 1),
  };
}

export function parseColorToRgba(input: string): Rgba {
  const normalized = input.trim();
  if (normalized.startsWith('#')) {
    return parseHexToRgba(normalized);
  }
  if (normalized.startsWith('rgb')) {
    return parseRgbToRgba(normalized);
  }
  throw new Error(`Unsupported color format: ${input}`);
}

export function blendForegroundOnBackground(foreground: Rgba, background: Rgba): Rgba {
  const alpha = foreground.a + background.a * (1 - foreground.a);
  if (alpha === 0) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  return {
    r: (foreground.r * foreground.a + background.r * background.a * (1 - foreground.a)) / alpha,
    g: (foreground.g * foreground.a + background.g * background.a * (1 - foreground.a)) / alpha,
    b: (foreground.b * foreground.a + background.b * background.a * (1 - foreground.a)) / alpha,
    a: alpha,
  };
}

function toLinear(channel: number): number {
  const normalized = channel / 255;
  if (normalized <= 0.03928) return normalized / 12.92;
  return ((normalized + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(color: Rgba): number {
  return 0.2126 * toLinear(color.r) + 0.7152 * toLinear(color.g) + 0.0722 * toLinear(color.b);
}

export function getContrastRatio(foreground: string, background: string): number {
  const fg = parseColorToRgba(foreground);
  const bg = parseColorToRgba(background);
  const effectiveFg = fg.a < 1 ? blendForegroundOnBackground(fg, bg) : fg;
  const l1 = relativeLuminance(effectiveFg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
