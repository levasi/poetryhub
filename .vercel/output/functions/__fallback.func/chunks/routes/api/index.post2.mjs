import { d as defineEventHandler, e as requireAdmin, r as readBody, c as createError, j as slugify, p as prisma, u as uniqueSlug, k as estimateReadingTime, l as extractExcerpt } from '../../nitro/nitro.mjs';
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
  title: z.string().min(1).max(500),
  content: z.string().min(1),
  authorId: z.string().min(1),
  language: z.string().default("en"),
  source: z.string().default("classic"),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  featured: z.boolean().default(false),
  tagIds: z.array(z.string()).default([])
});
const index_post = defineEventHandler(async (event) => {
  await requireAdmin(event);
  const body = await readBody(event);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Validation error",
      data: parsed.error.flatten()
    });
  }
  const { tagIds, ...data } = parsed.data;
  let slug = slugify(data.title);
  const existing = await prisma.poem.findUnique({ where: { slug } });
  if (existing) slug = uniqueSlug(data.title);
  const poem = await prisma.poem.create({
    data: {
      ...data,
      slug,
      sourceUrl: data.sourceUrl || null,
      excerpt: extractExcerpt(data.content),
      readingTime: estimateReadingTime(data.content),
      poemTags: {
        create: tagIds.map((tagId) => ({ tagId }))
      }
    },
    include: {
      author: { select: { id: true, name: true, slug: true, imageUrl: true } },
      poemTags: { include: { tag: true } }
    }
  });
  return poem;
});

export { index_post as default };
//# sourceMappingURL=index.post2.mjs.map
