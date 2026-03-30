import { d as defineEventHandler, e as requireAdmin, g as getRouterParam, r as readBody, c as createError, p as prisma } from '../../../nitro/nitro.mjs';
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
  name: z.string().min(1).max(200).optional(),
  bio: z.string().optional(),
  birthYear: z.number().int().optional().nullable(),
  deathYear: z.number().int().optional().nullable(),
  nationality: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal(""))
});
const _slug__put = defineEventHandler(async (event) => {
  await requireAdmin(event);
  const slug = getRouterParam(event, "slug");
  const body = await readBody(event);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: "Validation error", data: parsed.error.flatten() });
  }
  const existing = await prisma.author.findUnique({ where: { slug } });
  if (!existing) throw createError({ statusCode: 404, statusMessage: "Author not found" });
  return prisma.author.update({
    where: { slug },
    data: { ...parsed.data, imageUrl: parsed.data.imageUrl || null }
  });
});

export { _slug__put as default };
//# sourceMappingURL=_slug_.put.mjs.map
