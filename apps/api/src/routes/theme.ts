import type { FastifyInstance } from "fastify";
import { writeAuditLog } from "../lib/audit.js";
import { prisma } from "../lib/prisma.js";
import { pickString } from "../lib/strings.js";

// Default theme matching the existing CSS variables
const DEFAULT_THEME: Record<string, string> = {
  background: "#050608",
  surface: "#0A0B0D",
  surfaceSoft: "#0F1013",
  card: "#121318",
  cardHover: "#181A20",
  border: "#2A2B30",
  textPrimary: "#F2F0EA",
  textSecondary: "#A7A39B",
  textMuted: "#6F6C66",
  accent: "#D8D3C8",
  accentSoft: "#9A968E",
  accentDim: "#3A3936",
  fontScale: "1",
  bodyFont: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
  headingFont: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
  monoFont: "\"JetBrains Mono\", \"SFMono-Regular\", Consolas, monospace",
  articleAlign: "left",
  articleWidth: "720px",
  sectionSpacing: "96px",
  cardRadius: "18px",
  buttonRadius: "999px",
  // Hero background glow effect tokens
  heroGlowOpacity: "0",    // 0 = off (dark default), 1 = full glow
  heroGlowPosition: "-12%", // vertical position of the radial glow
};

const ALLOWED_KEYS = new Set(Object.keys(DEFAULT_THEME));
const COLOR_KEYS = new Set([
  "background",
  "surface",
  "surfaceSoft",
  "card",
  "cardHover",
  "border",
  "textPrimary",
  "textSecondary",
  "textMuted",
  "accent",
  "accentSoft",
  "accentDim",
]);
const ENUM_KEYS: Record<string, string[]> = {
  articleAlign: ["left", "center", "right", "justify"],
  bodyFont: [
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
    "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
    "Georgia, \"Times New Roman\", serif",
    "\"SFMono-Regular\", Consolas, \"Liberation Mono\", monospace",
  ],
  headingFont: [
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
    "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
    "Georgia, \"Times New Roman\", serif",
    "\"SFMono-Regular\", Consolas, \"Liberation Mono\", monospace",
  ],
  monoFont: [
    "\"JetBrains Mono\", \"SFMono-Regular\", Consolas, monospace",
    "\"SFMono-Regular\", Consolas, \"Liberation Mono\", monospace",
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", monospace",
  ],
};
const NUMBER_KEYS: Record<string, { min: number; max: number }> = {
  fontScale: { min: 0.9, max: 1.15 },
  heroGlowOpacity: { min: 0, max: 1 },
};
const LENGTH_KEYS: Record<string, { min: number; max: number; unit: "px" }> = {
  articleWidth: { min: 620, max: 980, unit: "px" },
  sectionSpacing: { min: 48, max: 128, unit: "px" },
  cardRadius: { min: 8, max: 28, unit: "px" },
  buttonRadius: { min: 8, max: 999, unit: "px" },
};
const PERCENT_ENUM_KEYS: Record<string, string[]> = {
  heroGlowPosition: ["-20%", "-12%", "0%", "15%", "30%"],
};

function isValidHex(value: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value.trim());
}

function normalizeThemeValue(key: string, value: unknown): string | null {
  const cleanValue = pickString(value);

  if (COLOR_KEYS.has(key)) {
    return isValidHex(cleanValue) ? cleanValue : null;
  }

  if (ENUM_KEYS[key]) {
    return ENUM_KEYS[key].includes(cleanValue) ? cleanValue : null;
  }

  if (PERCENT_ENUM_KEYS[key]) {
    return PERCENT_ENUM_KEYS[key].includes(cleanValue) ? cleanValue : null;
  }

  if (NUMBER_KEYS[key]) {
    const parsed = Number(cleanValue);
    const rule = NUMBER_KEYS[key];
    if (!Number.isFinite(parsed) || parsed < rule.min || parsed > rule.max) return null;
    // Preserve up to 2 decimal places for opacity values
    return parseFloat(parsed.toFixed(2)).toString();
  }

  if (LENGTH_KEYS[key]) {
    const rule = LENGTH_KEYS[key];
    const parsed = Number(cleanValue.replace(rule.unit, ""));
    if (!Number.isFinite(parsed) || parsed < rule.min || parsed > rule.max) return null;
    return `${Math.round(parsed)}${rule.unit}`;
  }

  return null;
}

async function getCurrentTheme(): Promise<Record<string, string>> {
  const settings = await prisma.themeSetting.findMany();
  const theme = { ...DEFAULT_THEME };
  for (const setting of settings) {
    if (ALLOWED_KEYS.has(setting.key)) {
      theme[setting.key] = setting.value;
    }
  }
  return theme;
}

export async function themeRoutes(app: FastifyInstance) {
  // Public: get current theme (used by frontend to apply CSS vars)
  app.get("/api/public/theme", async () => {
    const theme = await getCurrentTheme();
    return { data: theme, defaults: DEFAULT_THEME };
  });

  // Admin: save theme tokens
  app.put<{ Body: Record<string, string> }>(
    "/api/admin/theme",
    { preHandler: app.requireAdmin },
    async (request, reply) => {
      const body = request.body;

      // Validate: only allow known keys and valid token values
      const errors: string[] = [];
      const updates: { key: string; value: string }[] = [];

      for (const [key, value] of Object.entries(body)) {
        if (!ALLOWED_KEYS.has(key)) {
          errors.push(`Unknown theme key: ${key}`);
          continue;
        }
        const cleanValue = normalizeThemeValue(key, value);
        if (!cleanValue) {
          errors.push(`Invalid theme value for "${key}": ${value}`);
          continue;
        }
        updates.push({ key, value: cleanValue });
      }

      if (errors.length > 0) {
        return reply.code(400).send({ message: errors.join("; ") });
      }

      // Upsert all valid keys
      await prisma.$transaction(
        updates.map(({ key, value }) =>
          prisma.themeSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value },
          }),
        ),
      );

      const theme = await getCurrentTheme();
      await writeAuditLog(request, {
        action: "update",
        entityType: "theme",
        entityLabel: "Theme Studio",
        metadata: {
          updatedKeys: updates.map((update) => update.key),
        },
      });
      return { data: theme };
    },
  );

  // Admin: reset theme to defaults
  app.post(
    "/api/admin/theme/reset",
    { preHandler: app.requireAdmin },
    async (request) => {
      await prisma.themeSetting.deleteMany();
      await writeAuditLog(request, {
        action: "reset",
        entityType: "theme",
        entityLabel: "Theme Studio",
      });
      return { data: DEFAULT_THEME };
    },
  );
}
