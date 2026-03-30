import { d as defineEventHandler, e as requireAdmin, r as readBody, c as createError, j as slugify, p as prisma, u as uniqueSlug, k as estimateReadingTime, l as extractExcerpt, m as useRuntimeConfig } from '../../../nitro/nitro.mjs';
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

const poetrydb_post = defineEventHandler(async (event) => {
  var _a, _b;
  await requireAdmin(event);
  const config = useRuntimeConfig();
  const body = await readBody(event);
  const targetAuthors = (_a = body == null ? void 0 : body.authors) != null ? _a : [];
  const count = Math.min((_b = body == null ? void 0 : body.count) != null ? _b : 20, 100);
  let url;
  if (targetAuthors.length > 0) {
    url = `${config.poetryDbUrl}/author/${encodeURIComponent(targetAuthors[0])}`;
  } else {
    url = `${config.poetryDbUrl}/random/${count}`;
  }
  let poems;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`PoetryDB returned ${res.status}`);
    poems = await res.json();
    if (!Array.isArray(poems)) throw new Error("Unexpected response from PoetryDB");
  } catch (err) {
    throw createError({ statusCode: 502, statusMessage: `PoetryDB fetch failed: ${String(err)}` });
  }
  let imported = 0;
  let skipped = 0;
  const errors = [];
  for (const raw of poems.slice(0, count)) {
    try {
      const content = raw.lines.join("\n").trim();
      if (!content) {
        skipped++;
        continue;
      }
      const authorSlug = slugify(raw.author);
      let author = await prisma.author.findUnique({ where: { slug: authorSlug } });
      if (!author) {
        author = await prisma.author.create({
          data: { name: raw.author, slug: authorSlug, nationality: "Unknown" }
        });
      }
      const existing = await prisma.poem.findFirst({
        where: { title: raw.title, authorId: author.id }
      });
      if (existing) {
        skipped++;
        continue;
      }
      let poemSlug = slugify(raw.title);
      const slugExists = await prisma.poem.findUnique({ where: { slug: poemSlug } });
      if (slugExists) poemSlug = uniqueSlug(raw.title);
      await prisma.poem.create({
        data: {
          title: raw.title,
          slug: poemSlug,
          content,
          excerpt: extractExcerpt(content),
          readingTime: estimateReadingTime(content),
          authorId: author.id,
          language: "en",
          source: "imported",
          sourceUrl: `https://poetrydb.org/title/${encodeURIComponent(raw.title)}`
        }
      });
      imported++;
    } catch (err) {
      errors.push(`${raw.title}: ${String(err)}`);
    }
  }
  await prisma.importLog.create({
    data: {
      source: "poetrydb",
      status: errors.length === 0 ? "success" : "partial",
      imported,
      skipped,
      errors: errors.length,
      details: errors.length > 0 ? errors.join("\n") : null
    }
  });
  return { ok: true, imported, skipped, errors: errors.length, errorDetails: errors };
});

export { poetrydb_post as default };
//# sourceMappingURL=poetrydb.post.mjs.map
