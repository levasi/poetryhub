<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { Poem } from '~/composables/usePoems'
import { useFavorites } from '~/composables/useFavorites'
import { parseStrictPoemWrittenYear } from '~/utils/carouselWrittenIn'
import { getFetchErrorDataCode, getFetchErrorMessage, getFetchErrorStatus } from '~/utils/fetchApiError'
import { READER_MOBILE_CLEARANCE } from '~/utils/pageShell'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    poem: Poem
    /** Editor / moderator / admin — inline title & body on author PDP. */
    allowPoemEdit?: boolean
    /** Start in poem edit UI immediately (e.g. author page unified edit). */
    autoPoemEdit?: boolean
    /** Show Save / Cancel next to poem fields; hide when parent provides a bottom bar. */
    showPoemEditToolbar?: boolean
    /** Mobile floating action pill (favorite / share). Off on author page. */
    showMobileActions?: boolean
  }>(),
  {
    allowPoemEdit: false,
    autoPoemEdit: false,
    showPoemEditToolbar: true,
    showMobileActions: true,
  },
)

const emit = defineEmits<{ updated: [poem: Poem] }>()

const { poemBodyStyle } = useReaderPreferences()

const { toggle, isFavorite } = useFavorites()
const { invalidatePublicCachesIfStaff } = usePublicCacheInvalidation()
const liked = computed(() => isFavorite(props.poem.id))

const editingPoem = ref(false)
const titleDraft = ref('')
const contentDraft = ref('')
const writtenInDraft = ref('')
const savingPoemEdit = ref(false)

function writtenInFromPoem(p: Poem): string {
  if (p.writtenPeriod?.trim()) return p.writtenPeriod.trim()
  if (p.writtenYear != null) return String(p.writtenYear)
  return ''
}

watch(
  () => props.poem,
  (p) => {
    if (!editingPoem.value) {
      titleDraft.value = p.title
      contentDraft.value = p.content
      writtenInDraft.value = writtenInFromPoem(p)
    }
  },
  { immediate: true },
)

watch(
  () => props.allowPoemEdit,
  (allow) => {
    if (!allow) cancelPoemEdit()
  },
  { immediate: true },
)

watch(
  () => props.autoPoemEdit,
  (auto, prevAuto) => {
    if (!props.allowPoemEdit) return
    if (auto) {
      nextTick(() => startPoemEdit())
    } else if (prevAuto === true) {
      cancelPoemEdit()
    }
  },
  { immediate: true },
)

watch(
  () => props.poem.slug,
  () => {
    if (props.allowPoemEdit && props.autoPoemEdit && editingPoem.value) {
      startPoemEdit()
    }
  },
)

function startPoemEdit() {
  titleDraft.value = props.poem.title
  contentDraft.value = props.poem.content
  writtenInDraft.value = writtenInFromPoem(props.poem)
  editingPoem.value = true
}

function cancelPoemEdit() {
  editingPoem.value = false
  titleDraft.value = props.poem.title
  contentDraft.value = props.poem.content
  writtenInDraft.value = writtenInFromPoem(props.poem)
}

function parseWrittenInPayload(raw: string): { writtenYear: number | null; writtenPeriod: string | null } | 'too-long' {
  const wyRaw = raw.trim()
  if (!wyRaw) return { writtenYear: null, writtenPeriod: null }
  const strictYear = parseStrictPoemWrittenYear(wyRaw)
  if (strictYear != null) return { writtenYear: strictYear, writtenPeriod: null }
  if (wyRaw.length > 220) return 'too-long'
  return { writtenYear: null, writtenPeriod: wyRaw }
}

async function savePoemEdit() {
  if (savingPoemEdit.value) return
  const titleTrim = titleDraft.value.trim()
  if (!titleTrim) {
    alert(t('viewer.poemTitleRequired'))
    return
  }

  const writtenParsed = parseWrittenInPayload(writtenInDraft.value)
  if (writtenParsed === 'too-long') {
    alert(t('viewer.writtenPeriodTooLong'))
    return
  }

  const prevWritten = writtenInFromPoem(props.poem)
  const body: {
    title?: string
    content?: string
    writtenYear?: number | null
    writtenPeriod?: string | null
  } = {}
  if (titleTrim !== props.poem.title) body.title = titleTrim
  if (contentDraft.value !== props.poem.content) body.content = contentDraft.value
  if (writtenInDraft.value.trim() !== prevWritten) {
    body.writtenYear = writtenParsed.writtenYear
    body.writtenPeriod = writtenParsed.writtenPeriod
  }

  if (
    body.title === undefined
    && body.content === undefined
    && body.writtenYear === undefined
    && body.writtenPeriod === undefined
  ) {
    editingPoem.value = false
    return
  }

  savingPoemEdit.value = true
  try {
    const res = await $fetch<{ ok: true; poem: Poem }>(
      `/api/poems/${encodeURIComponent(props.poem.slug)}/content`,
      { method: 'PUT', body },
    )
    const fresh = {
      ...res.poem,
      navigation: props.poem.navigation,
    }
    await invalidatePublicCachesIfStaff().catch(() => {})
    emit('updated', fresh)
    editingPoem.value = false
    titleDraft.value = fresh.title
    contentDraft.value = fresh.content
    writtenInDraft.value = writtenInFromPoem(fresh)
  } catch (err: unknown) {
    const status = getFetchErrorStatus(err)
    const code = getFetchErrorDataCode(err)
    if (status === 409 || code === 'DUPLICATE_POEM_TITLE') {
      alert(t('authors.duplicatePoemTitle'))
      return
    }
    alert(getFetchErrorMessage(err) || t('viewer.poemEditFailed'))
  } finally {
    savingPoemEdit.value = false
  }
}

defineExpose({
  savePoemEdit,
  cancelPoemEdit,
  savingPoemEdit,
})

// ── Reading progress ─────────────────────────────────────────────────────────
const progress = ref(0)
onMounted(() => {
  const onScroll = () => {
    const el = document.documentElement
    const scrolled = el.scrollTop
    const total = el.scrollHeight - el.clientHeight
    progress.value = total > 0 ? Math.min(100, (scrolled / total) * 100) : 0
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
})

// ── Share ─────────────────────────────────────────────────────────────────────
const copied = ref(false)

async function sharePoem() {
  const url = window.location.href
  if (navigator.share) {
    try {
      await navigator.share({ title: props.poem.title, url })
    } catch {
      // User cancelled or share failed — fall through to copy
    }
    return
  }
  await navigator.clipboard.writeText(url)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

</script>

<template>
  <div>
    <div class="poetry-viewer__progress">
      <div class="poetry-viewer__progress-bar" :style="{ width: `${progress}%` }" />
    </div>

    <ReaderMobileActions
      v-if="!editingPoem && showMobileActions"
      :poem="poem"
      :liked="liked"
      :copied="copied"
      @favorite="toggle(poem.id)"
      @share="sharePoem"
    />

    <div
      class="poetry-viewer__content"
      :class="showMobileActions ? READER_MOBILE_CLEARANCE : ''"
    >
      <template v-if="allowPoemEdit && editingPoem">
        <div class="poetry-viewer__edit">
          <div>
            <label class="poetry-viewer__field-label">
              {{ t('viewer.poemTitleLabel') }}
            </label>
            <input
              v-model="titleDraft"
              type="text"
              class="poetry-viewer__input"
              autocomplete="off"
            >
          </div>
          <div>
            <label
              class="poetry-viewer__field-label"
              for="poem-edit-written-in"
            >
              {{ t('viewer.writtenInLabel') }}
            </label>
            <input
              id="poem-edit-written-in"
              v-model="writtenInDraft"
              type="text"
              maxlength="220"
              class="poetry-viewer__input poetry-viewer__input--sm"
              :placeholder="t('viewer.writtenInHint')"
              autocomplete="off"
            >
            <p class="poetry-viewer__hint">
              {{ t('viewer.writtenInHint') }}
            </p>
          </div>
          <div>
            <label class="poetry-viewer__field-label">
              {{ t('viewer.poemBodyLabel') }}
            </label>
            <textarea
              v-model="contentDraft"
              rows="18"
              class="poetry-viewer__textarea"
              :style="poemBodyStyle"
            />
          </div>
          <div
            v-if="showPoemEditToolbar"
            class="poetry-viewer__toolbar"
          >
            <button
              type="button"
              class="poetry-viewer__btn-save"
              :disabled="savingPoemEdit"
              @click="savePoemEdit"
            >
              {{ savingPoemEdit ? t('viewer.savingPoemEdit') : t('viewer.savePoemChanges') }}
            </button>
            <button
              type="button"
              class="poetry-viewer__btn-cancel"
              :disabled="savingPoemEdit"
              @click="cancelPoemEdit"
            >
              {{ t('viewer.cancelPoemEdit') }}
            </button>
          </div>
        </div>
      </template>
      <PoemReader
        v-else
        :poem="poem"
        variant="pdp"
        :show-tags="true"
      >
        <template
          v-if="allowPoemEdit && !autoPoemEdit"
          #titleAside
        >
          <button
            type="button"
            class="poetry-viewer__edit-poem"
            @click="startPoemEdit"
          >
            <Icon
              icon="heroicons:pencil-square"
              class="poetry-viewer__edit-icon"
              aria-hidden="true"
            />
            {{ t('viewer.editPoem') }}
          </button>
        </template>
      </PoemReader>
    </div>
  </div>
</template>
