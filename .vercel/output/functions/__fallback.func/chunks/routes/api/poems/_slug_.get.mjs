import { d as defineEventHandler, g as getRouterParam, p as prisma, c as createError, w as withResolvedAuthorPortrait } from '../../../nitro/nitro.mjs';
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

const _slug__get = defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");
  const poem = await prisma.poem.findUnique({
    where: { slug },
    include: {
      author: true,
      poemTags: {
        include: { tag: true }
      }
    }
  });
  if (!poem) {
    throw createError({ statusCode: 404, statusMessage: "Poem not found" });
  }
  const author = await withResolvedAuthorPortrait(poem.author);
  return { ...poem, author };
});

export { _slug__get as default };
//# sourceMappingURL=_slug_.get.mjs.map
