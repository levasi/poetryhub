// POST /api/authors/:slug/portrait — multipart image; administrators only (see requireAuthorPortraitAdmin).
import { readMultipartFormData } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { requireAuthorPortraitAdmin } from '~/server/utils/auth'
import { invalidateAuthorDetailCaches } from '~/server/utils/invalidatePublicCache'

/** Hard cap after client compression; avoids huge JSON/base64 payloads. */
const MAX_BYTES = 2 * 1024 * 1024

function detectMime(buf: Uint8Array): string | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  )
    return 'image/png'
  if (buf.length >= 6 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38)
    return 'image/gif'
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  )
    return 'image/webp'
  return null
}

export default defineEventHandler(async (event) => {
  await requireAuthorPortraitAdmin(event)

  const slug = getRouterParam(event, 'slug')
  if (!slug?.trim()) throw createError({ statusCode: 400, statusMessage: 'Missing slug' })

  const existing = await prisma.author.findUnique({ where: { slug } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Author not found' })

  const parts = await readMultipartFormData(event)
  const file = parts?.find((p) => p.name === 'file' && p.data && p.data.length > 0)
  if (!file?.data?.length) {
    throw createError({ statusCode: 400, statusMessage: 'Missing image file' })
  }
  if (file.data.length > MAX_BYTES) {
    throw createError({ statusCode: 400, statusMessage: 'Image too large (max 2 MB)' })
  }

  const mime = detectMime(file.data)
  if (!mime) {
    throw createError({ statusCode: 400, statusMessage: 'Unsupported image type' })
  }

  const base64 = Buffer.from(file.data).toString('base64')
  const dataUrl = `data:${mime};base64,${base64}`

  const updated = await prisma.author.update({
    where: { slug },
    data: { imageUrl: dataUrl },
  })

  await invalidateAuthorDetailCaches(slug)

  return updated
})
