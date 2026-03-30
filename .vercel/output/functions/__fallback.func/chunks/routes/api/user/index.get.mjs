import { d as defineEventHandler, n as requireUser, p as prisma } from '../../../nitro/nitro.mjs';
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

const index_get = defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    select: { poemId: true },
    orderBy: { createdAt: "desc" }
  });
  return { ids: favorites.map((f) => f.poemId) };
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
