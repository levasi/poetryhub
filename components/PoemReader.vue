<script setup lang="ts">
import type { Poem } from '~/composables/usePoems'

/**
 * Unified poem reading block: optional tags, title, author line, written context, ornament, body.
 * Uses global reader font/size/line-height from `useReaderPreferences`.
 */
const props = withDefaults(
  defineProps<{
    poem: Poem
    /** `pdp` — full poem page (avatar author, ornament). `banner` — home hero. `modal` — quick-read body only. */
    variant?: 'pdp' | 'banner' | 'modal'
    showTags?: boolean
    showTitle?: boolean
    showAuthor?: boolean
    showWrittenContext?: boolean
    showOrnament?: boolean
    /** `stanzas` — split on blank lines. `plain` — single block (pre-wrap for plain text). */
    bodyMode?: 'stanzas' | 'plain'
    /**
     * When set, body shows this string in plain mode (e.g. card preview lines).
     * Ignores `bodyMode` stanzas path.
     */
    bodyPlainOverride?: string | null
    /** Extra classes on the body container or stanza paragraphs. */
    bodyClass?: string
    /** Extra classes on the root wrapper (e.g. card preview layout). */
    wrapperClass?: string
  }>(),
  {
    variant: 'pdp',
    showTitle: true,
    showAuthor: true,
    showWrittenContext: true,
    bodyPlainOverride: null,
    bodyClass: '',
    wrapperClass: '',
  },
)

const { t, te } = useI18n()
const { labelForTag } = useTagLabel()
const { poemBodyStyle } = useReaderPreferences()

const showTagsResolved = computed(() => props.showTags ?? props.variant === 'pdp')
const showOrnamentResolved = computed(() => props.showOrnament ?? props.variant === 'pdp')

const tags = computed(() => props.poem.poemTags?.map((pt) => pt.tag) ?? [])

const langLabel = computed(() => {
  const code = props.poem.language
  if (!code || code === 'en' || code === 'ro') return null
  const key = `lang.${code}`
  return te(key) ? t(key) : code.toUpperCase()
})

const writtenContextLine = computed(() => {
  const y = props.poem.writtenYear
  const p = props.poem.writtenPeriod?.trim()
  if (y != null && p) return t('viewer.writtenYearAndPeriod', { year: y, period: p })
  if (y != null) return t('viewer.writtenInYear', { year: y })
  if (p) return p
  return null
})

const author = computed(() => props.poem.author)
const authorAvatar = computed(() => authorAvatarUrl(author.value))

const stanzas = computed(() =>
  props.poem.content
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean),
)

const bodyModeResolved = computed(() => {
  if (props.bodyPlainOverride != null && props.bodyPlainOverride !== '') return 'plain' as const
  if (props.bodyMode) return props.bodyMode
  return props.variant === 'modal' ? ('plain' as const) : ('stanzas' as const)
})

const plainBody = computed(() => {
  if (props.bodyPlainOverride != null && props.bodyPlainOverride !== '') return props.bodyPlainOverride
  return props.poem.content ?? ''
})

const titleVariant = computed(() => (props.variant === 'banner' ? 'banner' : 'pdp'))

const poemIdForTitle = computed(() =>
  props.variant === 'pdp' || props.variant === 'banner' ? props.poem.id : undefined,
)

const slots = useSlots()
/** Extra control beside the title row (e.g. author PDP “Edit poem”). */
const hasTitleAside = computed(() => !!slots.titleAside)
</script>

<template>
  <div class="poem-reader" :class="wrapperClass">
    <div v-if="showTagsResolved && tags.length" class="mb-6 flex flex-wrap gap-2 md:mb-8">
      <NuxtLink v-for="tag in tags" :key="tag.id" :to="`/?tag=${tag.slug}`"
        class="rounded-full border border-edge bg-surface-raised/90 px-3 py-1 text-xs text-content-secondary shadow-sm transition-colors hover:border-brand/50 hover:text-brand">
        {{ labelForTag(tag.slug, tag.name) }}
      </NuxtLink>
      <span v-if="langLabel"
        class="rounded-full border border-edge bg-surface-raised/90 px-3 py-1 text-xs text-content-secondary">
        {{ langLabel }}
      </span>
    </div>

    <template v-if="showTitle && hasTitleAside">
      <div
        class="mb-3 flex flex-wrap items-start justify-between gap-x-4 gap-y-3 sm:items-center">
        <div class="min-w-0 flex-1">
          <PoemTitle :title="poem.title" :slug="poem.slug" :variant="titleVariant" :poem-id="poemIdForTitle"
            class="!mb-0" />
        </div>
        <div class="flex shrink-0 items-center self-start pt-1 sm:self-center sm:pt-0">
          <slot name="titleAside" />
        </div>
      </div>
    </template>
    <PoemTitle v-else-if="showTitle" :title="poem.title" :slug="poem.slug" :variant="titleVariant"
      :poem-id="poemIdForTitle" />

    <NuxtLink v-if="showAuthor && author && variant === 'pdp'" :to="`/authors/${author.slug}`"
      class="group mt-2 inline-flex max-w-full items-center gap-4 text-content-secondary transition-colors hover:text-brand">
      <img :src="authorAvatar" alt="" loading="lazy"
        class="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-edge-subtle transition-[box-shadow] group-hover:ring-brand/35" />
      <span class="font-serif text-lg font-semibold leading-snug tracking-tight text-content group-hover:text-brand">&mdash;
        {{ author.name }}</span>
    </NuxtLink>

    <NuxtLink v-else-if="showAuthor && author && variant === 'banner'" :to="`/authors/${author.slug}`"
      class="mt-2 inline-block text-sm text-content-muted transition hover:text-gold-800">
      — {{ author.name }}
    </NuxtLink>

    <p v-if="showWrittenContext && writtenContextLine && variant !== 'modal'" class="mt-3 text-sm text-content-muted"
      :class="variant === 'banner' ? 'text-center md:text-left' : ''">
      {{ writtenContextLine }}
    </p>

    <div v-if="showOrnamentResolved" class="my-10 flex items-center gap-4 md:my-12">
      <div class="h-px flex-1 bg-gradient-to-r from-transparent via-edge-strong/40 to-edge-subtle" />
      <span class="select-none text-lg text-brand/70" aria-hidden="true">✦</span>
      <div class="h-px flex-1 bg-gradient-to-l from-transparent via-edge-strong/40 to-edge-subtle" />
    </div>

    <div class="poem-body w-full" :class="bodyClass">
      <template v-if="bodyModeResolved === 'stanzas'">
        <p v-for="(stanza, i) in stanzas" :key="i" :style="poemBodyStyle">{{ stanza }}</p>
      </template>
      <p v-else :style="poemBodyStyle" class="whitespace-pre-wrap">{{ plainBody }}</p>
    </div>
  </div>
</template>
