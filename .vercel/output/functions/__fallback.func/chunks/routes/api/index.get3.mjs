import { d as defineEventHandler, f as getQuery, p as prisma } from '../../nitro/nitro.mjs';
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
  const { category } = getQuery(event);
  const where = category ? { category: String(category) } : {};
  const tags = await prisma.tag.findMany({
    where,
    orderBy: { name: "asc" },
    include: { _count: { select: { poemTags: true } } }
  });
  return tags;
});

export { index_get as default };
//# sourceMappingURL=index.get3.mjs.map
