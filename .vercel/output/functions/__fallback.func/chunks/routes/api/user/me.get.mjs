import { d as defineEventHandler, n as requireUser, p as prisma, c as createError } from '../../../nitro/nitro.mjs';
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

const me_get = defineEventHandler(async (event) => {
  const tokenUser = await requireUser(event);
  const row = await prisma.user.findUnique({ where: { id: tokenUser.id } });
  if (!row) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    poemFontFamily: row.poemFontFamily,
    poemFontSize: row.poemFontSize
  };
});

export { me_get as default };
//# sourceMappingURL=me.get.mjs.map
