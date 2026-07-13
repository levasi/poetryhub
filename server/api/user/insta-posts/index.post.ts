// POST /api/user/insta-posts — save Insta post to account
import { Prisma } from '@prisma/client'
import { prisma } from '~/server/utils/prisma'
import { requireUser } from '~/server/utils/auth'
import { normalizeUserInstaPostPayload, userInstaPostBodySchema } from '~/utils/userInstaPost'

export default defineEventHandler(async (event) => {
  const tokenUser = await requireUser(event)
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

  const row = await prisma.userInstaPost.create({
    data: {
      userId: tokenUser.id,
      title: payload.title,
      authorName: payload.authorName,
      poemSlug: payload.poemSlug,
      payload: json,
    },
    select: { id: true },
  })

  return row
})
