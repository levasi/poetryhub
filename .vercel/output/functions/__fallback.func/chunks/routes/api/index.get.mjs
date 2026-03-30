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
  var _a, _b;
  const query = getQuery(event);
  const page = Math.max(1, parseInt(String((_a = query.page) != null ? _a : 1)));
  const limit = Math.min(100, Math.max(1, parseInt(String((_b = query.limit) != null ? _b : 20))));
  const skip = (page - 1) * limit;
  const where = {};
  if (query.search) {
    where.name = { contains: String(query.search), mode: "insensitive" };
  }
  const [authors, total] = await Promise.all([
    prisma.author.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: "asc" },
      include: { _count: { select: { poems: true } } }
    }),
    prisma.author.count({ where })
  ]);
  return {
    data: authors,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
