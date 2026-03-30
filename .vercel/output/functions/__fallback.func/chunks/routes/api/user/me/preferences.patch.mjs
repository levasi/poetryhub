import { d as defineEventHandler, n as requireUser, r as readBody, c as createError, p as prisma } from '../../../../nitro/nitro.mjs';
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
  poemFontFamily: z.enum(["playfair", "georgia", "inter", "lora"]).optional(),
  poemFontSize: z.number().int().min(14).max(28).optional()
});
const preferences_patch = defineEventHandler(async (event) => {
  const tokenUser = await requireUser(event);
  const body = await readBody(event);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: "Invalid body", data: parsed.error.flatten() });
  }
  const data = parsed.data;
  if (Object.keys(data).length === 0) {
    const u = await prisma.user.findUniqueOrThrow({ where: { id: tokenUser.id } });
    return {
      poemFontFamily: u.poemFontFamily,
      poemFontSize: u.poemFontSize
    };
  }
  return prisma.user.update({
    where: { id: tokenUser.id },
    data,
    select: { poemFontFamily: true, poemFontSize: true }
  });
});

export { preferences_patch as default };
//# sourceMappingURL=preferences.patch.mjs.map
