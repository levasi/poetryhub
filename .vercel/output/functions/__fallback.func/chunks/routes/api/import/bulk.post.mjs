import { d as defineEventHandler, e as requireAdmin, r as readBody, c as createError, j as slugify, p as prisma, u as uniqueSlug, k as estimateReadingTime, l as extractExcerpt } from '../../../nitro/nitro.mjs';
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

const poemSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  author: z.string().min(1),
  language: z.string().default("en"),
  source: z.string().default("classic"),
  tags: z.array(z.string()).default([])
});
const bodySchema = z.array(poemSchema).min(1).max(500);
const bulk_post = defineEventHandler(async (event) => {
  await requireAdmin(event);
  const body = await readBody(event);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: "Invalid bulk payload", data: parsed.error.flatten() });
  }
  let imported = 0;
  let skipped = 0;
  const errors = [];
  for (const item of parsed.data) {
    try {
      const authorSlug = slugify(item.author);
      let author = await prisma.author.findUnique({ where: { slug: authorSlug } });
      if (!author) {
        author = await prisma.author.create({ data: { name: item.author, slug: authorSlug } });
      }
      const dup = await prisma.poem.findFirst({ where: { title: item.title, authorId: author.id } });
      if (dup) {
        skipped++;
        continue;
      }
      let poemSlug = slugify(item.title);
      const slugExists = await prisma.poem.findUnique({ where: { slug: poemSlug } });
      if (slugExists) poemSlug = uniqueSlug(item.title);
      const tagIds = [];
      for (const tagName of item.tags) {
        const tagSlug = slugify(tagName);
        const tag = await prisma.tag.upsert({
          where: { slug: tagSlug },
          update: {},
          create: { name: tagName, slug: tagSlug }
        });
        tagIds.push(tag.id);
      }
      await prisma.poem.create({
        data: {
          title: item.title,
          slug: poemSlug,
          content: item.content,
          excerpt: extractExcerpt(item.content),
          readingTime: estimateReadingTime(item.content),
          authorId: author.id,
          language: item.language,
          source: item.source,
          poemTags: { create: tagIds.map((tagId) => ({ tagId })) }
        }
      });
      imported++;
    } catch (err) {
      errors.push(`${item.title}: ${String(err)}`);
    }
  }
  await prisma.importLog.create({
    data: {
      source: "bulk-json",
      status: errors.length === 0 ? "success" : "partial",
      imported,
      skipped,
      errors: errors.length,
      details: errors.length > 0 ? errors.join("\n") : null
    }
  });
  return { ok: true, imported, skipped, errors: errors.length, errorDetails: errors };
});

export { bulk_post as default };
//# sourceMappingURL=bulk.post.mjs.map
