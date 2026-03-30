import { d as defineEventHandler, r as readBody, c as createError, p as prisma, o as signUserToken, a as setCookie, U as USER_TOKEN_COOKIE } from '../../../nitro/nitro.mjs';
import bcrypt from 'bcryptjs';
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
  email: z.string().email(),
  password: z.string().min(6)
});
const login_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: "Invalid request body" });
  }
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "Invalid credentials" });
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw createError({ statusCode: 401, statusMessage: "Invalid credentials" });
  }
  const token = await signUserToken({ id: user.id, email: user.email, name: user.name });
  setCookie(event, USER_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/"
  });
  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      poemFontFamily: user.poemFontFamily,
      poemFontSize: user.poemFontSize
    }
  };
});

export { login_post as default };
//# sourceMappingURL=login.post.mjs.map
