import { d as defineEventHandler, e as requireAdmin } from '../../../nitro/nitro.mjs';
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

const me_get = defineEventHandler(async (event) => {
  const payload = await requireAdmin(event);
  return { id: payload.id, email: payload.email, role: payload.role };
});

export { me_get as default };
//# sourceMappingURL=me.get.mjs.map
