// PUT /api/user/insta-posts/:id — update saved Insta post
import { Prisma } from '@prisma/client'
import { prisma } from '~/server/utils/prisma'
import { requireUser } from '~/server/utils/auth'
import { normalizeUserInstaPostPayload, userInstaPostBodySchema } from '~/utils/userInstaPost'

export default defineEventHandler(async (event) => {
  const tokenUser = await requireUser(event)
  const id = getRouterParam(event, 'id')
  if (!id?.trim()) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const existing = await prisma.userInstaPost.findFirst({
    where: { id, userId: tokenUser.id },
    select: { id: true },
  })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Insta post not found' })

  const body = await readBody(event)
  const parsed = userInstaPostBodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation error',
      data: parsed.error.flatten(),
    })
  }

  const payload = normalizeUserInstaPostPayload(parsed.data)
  const json = JSON.parse(JSON.stringify(payload)) as Prisma.InputJsonValue

  await prisma.userInstaPost.update({
    where: { id },
    data: {
      title: payload.title,
      authorName: payload.authorName,
      poemSlug: payload.poemSlug,
      payload: json,
    },
  })

  return { ok: true, id }
})
