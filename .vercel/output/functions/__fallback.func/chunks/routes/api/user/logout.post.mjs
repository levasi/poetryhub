import { d as defineEventHandler, b as deleteCookie, U as USER_TOKEN_COOKIE } from '../../../nitro/nitro.mjs';
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

const logout_post = defineEventHandler((event) => {
  deleteCookie(event, USER_TOKEN_COOKIE, { path: "/" });
  return { ok: true };
});

export { logout_post as default };
//# sourceMappingURL=logout.post.mjs.map
