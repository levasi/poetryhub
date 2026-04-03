// GET /api/poems/:slug/insight — AI literary insight via Claude (cached 24h)
// Returns 2–3 sentences covering dominant emotion, key imagery, and a literary observation.
// Requires ANTHROPIC_API_KEY in environment. Returns 503 when key is absent.
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '~/server/utils/prisma'

export default defineCachedEventHandler(
  async (event) => {
    const config = useRuntimeConfig(event)
    const apiKey = config.anthropicApiKey as string

    if (!apiKey) {
      throw createError({ statusCode: 503, statusMessage: 'AI insight is not configured on this server.' })
    }

    const slug = getRouterParam(event, 'slug')!
    const poem = await prisma.poem.findUnique({
      where: { slug },
      select: {
        title: true,
        content: true,
        author: { select: { name: true } },
      },
    })

    if (!poem) {
      throw createError({ statusCode: 404, statusMessage: 'Poem not found' })
    }

    const client = new Anthropic({ apiKey })

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 240,
      messages: [
        {
          role: 'user',
          content: [
            'You are a concise literary guide. In exactly 2–3 sentences describe:',
            '1. The dominant emotion or mood.',
            '2. One key image or symbol and what it represents.',
            '3. One brief literary insight (form, voice, or technique).',
            'Be specific to this text. Avoid generic observations. Do not begin with "This poem".',
            '',
            `Poem: "${poem.title}" by ${poem.author?.name ?? 'Unknown'}`,
            '',
            poem.content,
          ].join('\n'),
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    return { insight: text }
  },
  {
    name: 'api-poem-insight',
    maxAge: 86_400, // 24 hours — poem content does not change
    swr: true,
    getKey: (event) => `insight:${getRouterParam(event, 'slug') ?? ''}`,
  },
)
