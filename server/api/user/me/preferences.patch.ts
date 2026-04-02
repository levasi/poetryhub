// PATCH /api/user/me/preferences — poem reader font & size
import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireUser } from '~/server/utils/auth'

const schema = z.object({
  poemFontFamily: z
    .enum([
      'playfair',
      'georgia',
      'inter',
      'lora',
      'literata',
      'merriweather',
      'source-serif',
      'crimson',
      'noto-serif',
      'eb-garamond',
      'verdana',
      'roboto',
      'helvetica',
      'bookerly',
    ])
    .optional(),
  poemFontSize: z.number().int().min(16).max(48).optional(),
  poemLineHeight: z.number().min(1).max(2.5).optional(),
  poemLetterSpacing: z.number().min(0).max(0.3).optional(),
})

export default defineEventHandler(async (event) => {
  const tokenUser = await requireUser(event)
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body', data: parsed.error.flatten() })
  }

  const data = parsed.data
  if (Object.keys(data).length === 0) {
    const u = await prisma.user.findUniqueOrThrow({ where: { id: tokenUser.id } })
    return {
      poemFontFamily: u.poemFontFamily,
      poemFontSize: u.poemFontSize,
      poemLineHeight: u.poemLineHeight,
      poemLetterSpacing: u.poemLetterSpacing,
    }
  }

  return prisma.user.update({
    where: { id: tokenUser.id },
    data,
    select: {
      poemFontFamily: true,
      poemFontSize: true,
      poemLineHeight: true,
      poemLetterSpacing: true,
    },
  })
})
