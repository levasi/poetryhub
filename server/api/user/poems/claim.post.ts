// POST /api/user/poems/claim — attach an existing poem to “My poems”
import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireUser } from '~/server/utils/auth'

const schema = z.object({
  slug: z.string().min(1).trim(),
})

export default defineEventHandler(async (event) => {
  const tokenUser = await requireUser(event)
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validation error' })
  }

  const slug = parsed.data.slug
  const poem = await prisma.poem.findUnique({
    where: { slug },
    select: { id: true, submittedByUserId: true },
  })
  if (!poem) {
    throw createError({ statusCode: 404, statusMessage: 'Poem not found' })
  }

  // If already owned by someone else, don’t let users “steal” it.
  if (poem.submittedByUserId && poem.submittedByUserId !== tokenUser.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  await prisma.poem.update({
    where: { slug },
    data: { submittedByUserId: tokenUser.id },
  })

  return { ok: true }
})

