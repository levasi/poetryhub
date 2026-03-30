import { d as defineEventHandler, e as requireAdmin, r as readBody, c as createError, j as slugify, p as prisma, u as uniqueSlug } from '../../nitro/nitro.mjs';
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
  name: z.string().min(1).max(200),
  bio: z.string().optional(),
  birthYear: z.number().int().optional(),
  deathYear: z.number().int().optional(),
  nationality: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal(""))
});
const index_post = defineEventHandler(async (event) => {
  await requireAdmin(event);
  const body = await readBody(event);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: "Validation error", data: parsed.error.flatten() });
  }
  const data = parsed.data;
  let slug = slugify(data.name);
  const existing = await prisma.author.findUnique({ where: { slug } });
  if (existing) slug = uniqueSlug(data.name);
  return prisma.author.create({
    data: { ...data, slug, imageUrl: data.imageUrl || null }
  });
});

export { index_post as default };
//# sourceMappingURL=index.post.mjs.map
