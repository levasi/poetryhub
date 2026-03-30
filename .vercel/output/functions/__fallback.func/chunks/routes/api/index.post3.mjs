import { d as defineEventHandler, e as requireAdmin, r as readBody, c as createError, j as slugify, p as prisma } from '../../nitro/nitro.mjs';
import { z } from 'zod';
import 'jose';
import '@prisma/client';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'vue-router';

const schema = z.object({
  name: z.string().min(1).max(100),
  category: z.enum(["mood", "theme", "language", "era", "style"]).default("theme"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional()
});
const index_post = defineEventHandler(async (event) => {
  await requireAdmin(event);
  const body = await readBody(event);
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: "Validation error" });
  const { name, category, color } = parsed.data;
  const slug = slugify(name);
  return prisma.tag.upsert({
    where: { slug },
    update: { category, color },
    create: { name, slug, category, color }
  });
});

export { index_post as default };
//# sourceMappingURL=index.post3.mjs.map
