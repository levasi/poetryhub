<script setup lang="ts">
import type { Poem } from '~/composables/usePoems'
import { useFavorites } from '~/composables/useFavorites'

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
  }>(),
  { allowPoemEdit: false, autoPoemEdit: false, showPoemEditToolbar: true },
)

const emit = defineEmits<{ updated: [poem: Poem] }>()

const readerSettingsOpen = ref(false)

const { poemBodyStyle } = useReaderPreferences()

const { toggle, isFavorite } = useFavorites()
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
    await $fetch(`/api/poems/${encodeURIComponent(props.poem.slug)}/content`, {
      method: 'PUT',
      body,
    })
    const fresh = await $fetch<Poem>(`/api/poems/${encodeURIComponent(props.poem.slug)}`)
    emit('updated', fresh)
    editingPoem.value = false
    titleDraft.value = fresh.title
    contentDraft.value = fresh.content
  } catch (err: unknown) {
    const msg =
      err && typeof err === 'object' && 'data' in err
        ? String((err as { data?: { statusMessage?: string } }).data?.statusMessage ?? '')
        : ''
    alert(msg || t('viewer.poemEditFailed'))
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

    <!-- Fixed cog: reading appearance (font + size) -->
    <button type="button"
      class="fixed right-3 top-1/2 z-[45] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-edge-subtle bg-surface-raised/95 text-content-secondary shadow-ds-card backdrop-blur-sm transition hover:border-brand/45 hover:text-brand md:right-6"
      :aria-label="t('viewer.openReadingSettings')" @click="readerSettingsOpen = true">
      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>

    <ReaderSettingsSidebar v-model:open="readerSettingsOpen" id-prefix="poem-pdp" />

    <!-- ── Standard reading view — reading measure matches poem column ─────── -->
    <div class="animate-fade-in mx-auto w-full max-w-reading">
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
            <svg class="h-3.5 w-3.5 md:h-4 md:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
              stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {{ t('viewer.editPoem') }}
          </button>
        </template>
      </PoemReader>

      <!-- Actions bar -->
      <div class="mt-12 flex w-full flex-wrap items-center gap-2 pt-8 md:mt-16 sm:gap-3">
        <button class="flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition-all md:px-5"
          :class="liked
            ? 'border-rose-300 bg-rose-50 text-rose-700 shadow-ds-card'
            : 'border-edge-subtle bg-surface-raised text-content-secondary shadow-ds-card hover:border-rose-300/80 hover:text-rose-700'" @click="toggle(poem.id)">
          <svg class="h-4 w-4" viewBox="0 0 24 24" :fill="liked ? 'currentColor' : 'none'" stroke="currentColor"
            stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {{ liked ? t('viewer.saved') : t('viewer.savePoem') }}
        </button>

        <button type="button"
          class="flex items-center gap-2 rounded-full border border-edge-subtle bg-surface-raised px-4 py-2.5 text-sm text-content-secondary shadow-ds-card transition-all hover:border-brand/40 hover:text-brand md:px-5"
          @click="sharePoem">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          {{ copied ? t('viewer.linkCopied') : t('viewer.sharePoem') }}
        </button>
      </div>
    </div>
  </div>
</template>
