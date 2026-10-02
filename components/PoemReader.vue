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
  <div
    class="poem-reader"
    :class="wrapperClass"
  >
    <div
      v-if="showTagsResolved && tags.length"
      class="poem-reader__tags"
    >
      <NuxtLink
        v-for="tag in tags"
        :key="tag.id"
        :to="`/descopera?tag=${tag.slug}`"
        class="poem-reader__tag"
      >
        {{ labelForTag(tag.slug, tag.name) }}
      </NuxtLink>
      <span
        v-if="langLabel"
        class="poem-reader__tag poem-reader__tag--static"
      >
        {{ langLabel }}
      </span>
    </div>

    <template v-if="showTitle && hasTitleAside">
      <div class="poem-reader__title-row">
        <div class="poem-reader__title-main">
          <PoemTitle
            :title="poem.title"
            :slug="poem.slug"
            :variant="titleVariant"
            :poem-id="poemIdForTitle"
            class="poem-title--flush"
          />
        </div>
        <div class="poem-reader__title-aside">
          <slot name="titleAside" />
        </div>
      </div>
    </template>
    <PoemTitle
      v-else-if="showTitle"
      :title="poem.title"
      :slug="poem.slug"
      :variant="titleVariant"
      :poem-id="poemIdForTitle"
    />

    <p
      v-if="showWrittenContext && writtenContextLine && variant !== 'modal'"
      class="poem-reader__written"
      :class="{ 'poem-reader__written--banner': variant === 'banner' }"
    >
      {{ writtenContextLine }}
    </p>

    <NuxtLink
      v-if="showAuthor && author && variant === 'pdp'"
      :to="`/authors/${author.slug}`"
      class="poem-reader__author"
    >
      <img
        :src="authorAvatar"
        alt=""
        loading="lazy"
        class="poem-reader__author-avatar"
      >
      <span class="poem-reader__author-name">&mdash;
        {{ author.name }}</span>
    </NuxtLink>

    <NuxtLink
      v-else-if="showAuthor && author && variant === 'banner'"
      :to="`/authors/${author.slug}`"
      class="poem-reader__author-banner"
    >
      — {{ author.name }}
    </NuxtLink>

    <div
      v-if="showOrnamentResolved"
      class="poem-reader__ornament"
    >
      <div class="poem-reader__ornament-line" />
      <span
        class="poem-reader__ornament-mark"
        aria-hidden="true"
      >✦</span>
      <div class="poem-reader__ornament-line poem-reader__ornament-line--flip" />
    </div>

    <div
      class="poem-body poem-reader__body"
      :class="bodyClass"
    >
      <template v-if="bodyModeResolved === 'stanzas'">
        <p
          v-for="(stanza, i) in stanzas"
          :key="i"
          class="poem-reader__stanza"
          :style="poemBodyStyle"
        >{{ stanza }}</p>
      </template>
      <p
        v-else
        :style="poemBodyStyle"
        class="poem-reader__stanza"
      >{{ plainBody }}</p>
    </div>
  </div>
</template>
