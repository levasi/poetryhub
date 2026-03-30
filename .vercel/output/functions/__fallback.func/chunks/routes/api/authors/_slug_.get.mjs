import { d as defineEventHandler, g as getRouterParam, f as getQuery, p as prisma, c as createError, h as ensureAuthorPortraitUrl, i as ensureAuthorBio } from '../../../nitro/nitro.mjs';
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
  var _a, _b;
  const slug = getRouterParam(event, "slug");
  const query = getQuery(event);
  const page = Math.max(1, parseInt(String((_a = query.page) != null ? _a : 1)));
  const limit = Math.min(50, Math.max(1, parseInt(String((_b = query.limit) != null ? _b : 10))));
  const skip = (page - 1) * limit;
  let author = await prisma.author.findUnique({ where: { slug } });
  if (!author) throw createError({ statusCode: 404, statusMessage: "Author not found" });
  const portraitUrl = await ensureAuthorPortraitUrl(author);
  if (portraitUrl && portraitUrl !== author.imageUrl) author = { ...author, imageUrl: portraitUrl };
  const bioText = await ensureAuthorBio(author);
  if (bioText && bioText !== author.bio) author = { ...author, bio: bioText };
  const [poems, total, works] = await Promise.all([
    prisma.poem.findMany({
      where: { authorId: author.id },
      skip,
      take: limit,
      orderBy: { publishedAt: "desc" },
      include: {
        poemTags: { include: { tag: true } }
      }
    }),
    prisma.poem.count({ where: { authorId: author.id } }),
    prisma.poem.findMany({
      where: { authorId: author.id },
      select: { title: true, slug: true },
      orderBy: { title: "asc" }
    })
  ]);
  return {
    author,
    works,
    poems: {
      data: poems,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
    }
  };
});

export { _slug__get as default };
//# sourceMappingURL=_slug_.get.mjs.map
