<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { Poem } from '~/composables/usePoems'
import { useFavorites } from '~/composables/useFavorites'
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
const savingPoemEdit = ref(false)

watch(
  () => props.poem,
  (p) => {
    if (!editingPoem.value) {
      titleDraft.value = p.title
      contentDraft.value = p.content
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
  editingPoem.value = true
}

function cancelPoemEdit() {
  editingPoem.value = false
  titleDraft.value = props.poem.title
  contentDraft.value = props.poem.content
}

async function savePoemEdit() {
  if (savingPoemEdit.value) return
  const titleTrim = titleDraft.value.trim()
  if (!titleTrim) {
    alert(t('viewer.poemTitleRequired'))
    return
  }

  const body: { title?: string; content?: string } = {}
  if (titleTrim !== props.poem.title) body.title = titleTrim
  if (contentDraft.value !== props.poem.content) body.content = contentDraft.value

  if (!body.title && !body.content) {
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
    <!-- Reading progress bar -->
    <div class="fixed left-0 top-0 z-50 h-0.5 w-full bg-edge-subtle pointer-events-none">
      <div class="h-full bg-brand transition-all duration-100" :style="{ width: `${progress}%` }" />
    </div>

    <ReaderMobileActions
      v-if="!editingPoem && showMobileActions"
      :poem="poem"
      :liked="liked"
      :copied="copied"
      @favorite="toggle(poem.id)"
      @share="sharePoem"
    />

    <!-- ── Standard reading view — reading measure matches poem column ─────── -->
    <div
      class="animate-fade-in mx-auto w-full max-w-reading md:pb-0"
      :class="showMobileActions ? READER_MOBILE_CLEARANCE : ''"
    >
      <template v-if="allowPoemEdit && editingPoem">
        <div class="space-y-4">
          <div>
            <label class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-content-muted">
              {{ t('viewer.poemTitleLabel') }}
            </label>
            <input v-model="titleDraft" type="text"
              class="w-full rounded-ds-lg border border-edge-subtle bg-surface-page px-4 py-3 font-serif text-2xl font-semibold text-content outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 md:text-3xl"
              autocomplete="off" />
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-content-muted">
              {{ t('viewer.poemBodyLabel') }}
            </label>
            <textarea v-model="contentDraft" rows="18"
              class="w-full resize-y rounded-ds-lg border border-edge-subtle bg-surface-page px-4 py-3 font-serif text-base leading-relaxed outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              :style="poemBodyStyle" />
          </div>
          <div v-if="showPoemEditToolbar" class="flex flex-wrap gap-2 pt-2">
            <button type="button"
              class="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:bg-brand-hover disabled:opacity-50"
              :disabled="savingPoemEdit" @click="savePoemEdit">
              {{ savingPoemEdit ? t('viewer.savingPoemEdit') : t('viewer.savePoemChanges') }}
            </button>
            <button type="button"
              class="inline-flex items-center justify-center rounded-lg border border-edge-subtle bg-surface-subtle px-4 py-2 text-sm font-medium text-content-secondary transition hover:border-edge hover:bg-surface-raised disabled:opacity-50"
              :disabled="savingPoemEdit" @click="cancelPoemEdit">
              {{ t('viewer.cancelPoemEdit') }}
            </button>
          </div>
        </div>
      </template>
      <PoemReader v-else :poem="poem" variant="pdp" :show-tags="true">
        <template v-if="allowPoemEdit && !autoPoemEdit" #titleAside>
          <button type="button"
            class="inline-flex items-center gap-1.5 rounded-full border border-edge-subtle bg-surface-raised px-3 py-1.5 text-xs font-medium text-content-secondary shadow-sm transition-colors hover:border-brand/40 hover:text-brand md:px-4 md:py-2 md:text-sm"
            @click="startPoemEdit">
            <Icon icon="heroicons:pencil-square" class="h-3.5 w-3.5 md:h-4 md:w-4" aria-hidden="true" />
            {{ t('viewer.editPoem') }}
          </button>
        </template>
      </PoemReader>

    </div>
  </div>
</template>
