import type { FastifyInstance } from "fastify";
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
};

const ALLOWED_KEYS = new Set(Object.keys(DEFAULT_THEME));

function isValidHex(value: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value.trim());
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

      // Validate: only allow known keys and valid hex colors
      const errors: string[] = [];
      const updates: { key: string; value: string }[] = [];

      for (const [key, value] of Object.entries(body)) {
        if (!ALLOWED_KEYS.has(key)) {
          errors.push(`Unknown theme key: ${key}`);
          continue;
        }
        const cleanValue = pickString(value);
        if (!isValidHex(cleanValue)) {
          errors.push(`Invalid hex color for "${key}": ${value}`);
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
      return { data: theme };
    },
  );

  // Admin: reset theme to defaults
  app.post(
    "/api/admin/theme/reset",
    { preHandler: app.requireAdmin },
    async () => {
      await prisma.themeSetting.deleteMany();
      return { data: DEFAULT_THEME };
    },
  );
}
