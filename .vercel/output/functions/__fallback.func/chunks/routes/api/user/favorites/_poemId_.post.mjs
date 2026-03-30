import { d as defineEventHandler, n as requireUser, g as getRouterParam, p as prisma } from '../../../../nitro/nitro.mjs';
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

const _poemId__post = defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const poemId = getRouterParam(event, "poemId");
  const existing = await prisma.favorite.findUnique({
    where: { userId_poemId: { userId: user.id, poemId } }
  });
  if (existing) {
    await prisma.favorite.delete({
      where: { userId_poemId: { userId: user.id, poemId } }
    });
    return { favorited: false };
  }
  await prisma.favorite.create({ data: { userId: user.id, poemId } });
  return { favorited: true };
});

export { _poemId__post as default };
//# sourceMappingURL=_poemId_.post.mjs.map
