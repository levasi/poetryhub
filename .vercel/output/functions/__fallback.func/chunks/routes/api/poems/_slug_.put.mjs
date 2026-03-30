import { d as defineEventHandler, e as requireAdmin, g as getRouterParam, r as readBody, c as createError, p as prisma, k as estimateReadingTime, l as extractExcerpt } from '../../../nitro/nitro.mjs';
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
  title: z.string().min(1).max(500).optional(),
  content: z.string().min(1).optional(),
  authorId: z.string().optional(),
  language: z.string().optional(),
  source: z.string().optional(),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  featured: z.boolean().optional(),
  tagIds: z.array(z.string()).optional()
});
const _slug__put = defineEventHandler(async (event) => {
  await requireAdmin(event);
  const slug = getRouterParam(event, "slug");
  const body = await readBody(event);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: "Validation error", data: parsed.error.flatten() });
  }
  const existing = await prisma.poem.findUnique({ where: { slug } });
  if (!existing) throw createError({ statusCode: 404, statusMessage: "Poem not found" });
  const { tagIds, content, ...rest } = parsed.data;
  const poem = await prisma.poem.update({
    where: { slug },
    data: {
      ...rest,
      ...content && {
        content,
        excerpt: extractExcerpt(content),
        readingTime: estimateReadingTime(content)
      },
      sourceUrl: rest.sourceUrl || null,
      // Replace tag associations if provided
      ...tagIds !== void 0 && {
        poemTags: {
          deleteMany: {},
          create: tagIds.map((tagId) => ({ tagId }))
        }
      }
    },
    include: {
      author: { select: { id: true, name: true, slug: true, imageUrl: true } },
      poemTags: { include: { tag: true } }
    }
  });
  return poem;
});

export { _slug__put as default };
//# sourceMappingURL=_slug_.put.mjs.map
