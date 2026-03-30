import { d as defineEventHandler, e as requireAdmin, g as getRouterParam, p as prisma, c as createError } from '../../../nitro/nitro.mjs';
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

const _slug__delete = defineEventHandler(async (event) => {
  await requireAdmin(event);
  const slug = getRouterParam(event, "slug");
  const existing = await prisma.poem.findUnique({ where: { slug } });
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: "Poem not found" });
  }
  await prisma.poem.delete({ where: { slug } });
  return { ok: true };
});

export { _slug__delete as default };
//# sourceMappingURL=_slug_.delete.mjs.map
