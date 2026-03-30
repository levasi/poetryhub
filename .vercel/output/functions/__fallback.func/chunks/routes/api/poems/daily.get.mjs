import { d as defineEventHandler, p as prisma, c as createError, w as withResolvedAuthorPortrait } from '../../../nitro/nitro.mjs';
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

const daily_get = defineEventHandler(async () => {
  const count = await prisma.poem.count();
  if (count === 0) throw createError({ statusCode: 404, statusMessage: "No poems in database" });
  const now = /* @__PURE__ */ new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 864e5);
  const skip = dayOfYear % count;
  const poem = await prisma.poem.findFirst({
    skip,
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: { id: true, name: true, slug: true, imageUrl: true } },
      poemTags: { include: { tag: true } }
    }
  });
  if (!poem) throw createError({ statusCode: 404, statusMessage: "No poems in database" });
  const author = await withResolvedAuthorPortrait(poem.author);
  return { ...poem, author };
});

export { daily_get as default };
//# sourceMappingURL=daily.get.mjs.map
