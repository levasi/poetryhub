import { V as executeAsync } from '../nitro/nitro.mjs';
import { o as defineNuxtRouteMiddleware, n as navigateTo } from './server.mjs';
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
import 'vue';
import 'vue/server-renderer';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/plugins';
import 'unhead/utils';

const admin = defineNuxtRouteMiddleware(async (to) => {
  let __temp, __restore;
  if (!to.path.startsWith("/admin") || to.path === "/admin/login") return;
  try {
    ;
    [__temp, __restore] = executeAsync(() => $fetch("/api/auth/me")), await __temp, __restore();
    ;
  } catch {
    return navigateTo(`/admin/login?redirect=${encodeURIComponent(to.fullPath)}`);
  }
});

export { admin as default };
//# sourceMappingURL=admin-CiuiNuf1.mjs.map
