<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { storeToRefs } from 'pinia'

/** Heroicons (Iconify) — folosim același set ca restul aplicației */
const icons = {
  folder: 'heroicons:folder',
  chevronDown: 'heroicons:chevron-down',
  plus: 'heroicons:plus',
  magnifyingGlass: 'heroicons:magnifying-glass',
  check: 'heroicons:check',
  trash: 'heroicons:trash',
  arrowDownTray: 'heroicons:arrow-down-tray',
} as const

const projectStore = useWriteProjectsStore()
const { projects: projectList } = storeToRefs(projectStore)

const dropdownOpen = ref(false)
const projectSearch = ref('')
const rootRef = ref<HTMLElement | null>(null)

const newProjectModalOpen = ref(false)
const newProjectNameDraft = ref('')
const newProjectInputRef = ref<HTMLInputElement | null>(null)

const deleteModalOpen = ref(false)
const deleteTarget = ref<{ id: string; name: string } | null>(null)

const filteredProjects = computed(() => {
  const q = projectSearch.value.trim().toLowerCase()
  const list = projectList.value
  if (!q) return list
  return list.filter((p) => p.name.toLowerCase().includes(q))
})

const triggerLabel = computed(() => {
  return projectStore.currentProject?.name ?? 'Proiect'
})

function isActiveProject(p: { id: string }) {
  const cid = projectStore.currentProjectId
  return typeof p.id === 'string' && p.id.length > 0 && cid != null && cid === p.id
}

const canSubmitNewProject = computed(() => newProjectNameDraft.value.trim().length > 0)

function requestDeleteProject(p: { id: string; name: string }, ev?: Event) {
  ev?.stopPropagation()
  dropdownOpen.value = false
  projectSearch.value = ''
  deleteTarget.value = { id: p.id, name: p.name }
  deleteModalOpen.value = true
}

function closeDeleteModal() {
  deleteModalOpen.value = false
  deleteTarget.value = null
}

function executeDelete() {
  const p = deleteTarget.value
  if (!p) return
  projectStore.deleteProject(p.id)
  projectSearch.value = ''
  closeDeleteModal()
}

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value
  if (dropdownOpen.value) projectSearch.value = ''
}

watch(dropdownOpen, (open) => {
  // no-op (rename removed)
})

function selectProject(id: string) {
  projectStore.currentProjectId = id
  dropdownOpen.value = false
  projectSearch.value = ''
}

function openNewProjectModal() {
  dropdownOpen.value = false
  projectSearch.value = ''
  newProjectNameDraft.value = ''
  newProjectModalOpen.value = true
  nextTick(() => {
    newProjectInputRef.value?.focus()
    newProjectInputRef.value?.select()
  })
}

function closeNewProjectModal() {
  newProjectModalOpen.value = false
  newProjectNameDraft.value = ''
}

function confirmNewProject() {
  const name = newProjectNameDraft.value.trim()
  if (!name) return
  projectStore.createProject(name)
  closeNewProjectModal()
}

function onDocPointerDown(e: PointerEvent) {
  if (!dropdownOpen.value || !rootRef.value) return
  if (!rootRef.value.contains(e.target as Node)) {
    dropdownOpen.value = false
  }
}

function onGlobalKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && deleteModalOpen.value) {
    e.preventDefault()
    closeDeleteModal()
    return
  }
  if (e.key === 'Escape' && newProjectModalOpen.value) {
    e.preventDefault()
    closeNewProjectModal()
  }
}

watch([newProjectModalOpen, deleteModalOpen], ([openNew, openDel]) => {
  if (!import.meta.client) return
  document.body.style.overflow = openNew || openDel ? 'hidden' : ''
})

const saveBusy = ref(false)
const saveFeedback = ref<string | null>(null)
let saveFeedbackTimer: ReturnType<typeof setTimeout> | null = null

async function onSaveClick() {
  if (saveBusy.value) return
  saveBusy.value = true
  saveFeedback.value = null
  try {
    const r = await projectStore.saveNow()
    saveFeedback.value = r.ok ? 'Salvat' : 'Eroare la salvare'
  } finally {
    saveBusy.value = false
    if (saveFeedbackTimer) clearTimeout(saveFeedbackTimer)
    saveFeedbackTimer = setTimeout(() => {
      saveFeedback.value = null
      saveFeedbackTimer = null
    }, 2200)
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointerDown)
  document.addEventListener('keydown', onGlobalKeydown)
})
onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocPointerDown)
  document.removeEventListener('keydown', onGlobalKeydown)
  if (import.meta.client) document.body.style.overflow = ''
  if (saveFeedbackTimer) clearTimeout(saveFeedbackTimer)
})
</script>

<template>
  <div class="shrink-0 py-2 backdrop-blur-sm" aria-label="Instrumente">
    <div class="flex w-full min-w-0 items-center justify-between gap-3">
      <div ref="rootRef" class="relative min-w-0">
        <button type="button"
          class="flex min-w-[10.5rem] max-w-[min(100%,16rem)] items-center gap-2 rounded-xl border border-edge-subtle/90 bg-surface-raised px-3 py-2 text-left shadow-sm ring-black/5 transition hover:border-edge hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2"
          :aria-expanded="dropdownOpen" aria-haspopup="listbox" @click.stop="toggleDropdown">
          <span
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-subtle text-content-muted"
            aria-hidden="true">
            <Icon :icon="icons.folder" class="h-4 w-4 shrink-0" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-semibold leading-tight text-content">{{ triggerLabel }}</span>
            <span class="mt-0.5 block text-[10px] font-medium uppercase tracking-wide text-content-soft">Proiect
              activ</span>
          </span>
          <Icon :icon="icons.chevronDown" class="h-5 w-5 shrink-0 text-content-soft transition-transform duration-200"
            :class="dropdownOpen ? 'rotate-180' : ''" aria-hidden="true" />
        </button>

        <Transition enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 -translate-y-1 scale-[0.98]" enter-to-class="opacity-100 translate-y-0 scale-100"
          leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100 translate-y-0 scale-100"
          leave-to-class="opacity-0 -translate-y-0.5 scale-[0.99]">
          <div v-show="dropdownOpen"
            class="absolute left-0 z-50 mt-2 w-[min(100vw-2rem,20rem)] origin-top overflow-hidden rounded-2xl border border-edge-subtle/90 bg-surface-overlay/95 shadow-xl shadow-black/10 ring-1 ring-black/[0.04] backdrop-blur-md"
            role="listbox" @click.stop>
            <div
              class="border-b border-edge-subtle/90 bg-gradient-to-b from-surface-subtle/80 to-surface-raised px-3 pb-3 pt-3">
              <button type="button"
                class="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-3 py-2.5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-overlay"
                @click="openNewProjectModal">
                <Icon :icon="icons.plus" class="h-5 w-5 shrink-0 text-brand-foreground" aria-hidden="true" />
                Proiect nou
              </button>
            </div>

            <div class="px-3 pt-3">
              <label
                class="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-content-muted">Caută</label>
              <div class="relative">
                <span class="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-content-soft"
                  aria-hidden="true">
                  <Icon :icon="icons.magnifyingGlass" class="h-4 w-4 shrink-0" />
                </span>
                <label class="sr-only">Caută proiecte</label>
                <input v-model="projectSearch" type="search" placeholder="Filtră după nume…" autocomplete="off"
                  class="w-full rounded-xl border border-edge-subtle bg-surface-subtle/80 py-2 pl-9 pr-3 text-sm text-content outline-none ring-blue-500/20 transition placeholder:text-content-soft focus:border-blue-500 focus:bg-surface-overlay focus:ring-2"
                  @keydown.escape="dropdownOpen = false" />
              </div>
            </div>

            <ul class="flex max-h-56 flex-col gap-3 overflow-y-auto p-3 [scrollbar-width:thin]"
              aria-label="Lista proiectelor">
              <li v-for="p in filteredProjects" :key="p.id" class="group">
                <div
                  class="flex min-w-0 items-stretch gap-0.5 rounded-xl border border-transparent px-1 py-0.5 transition-colors"
                  :class="isActiveProject(p)
                    ? 'border-blue-200/80 bg-blue-50/90 shadow-sm shadow-blue-900/5'
                    : 'hover:border-edge-subtle/80 hover:bg-surface-subtle'
                    ">
                  <button type="button"
                    class="flex min-w-0 flex-1 items-center gap-2 rounded-lg py-2 pl-2 pr-1 text-left text-sm text-content-secondary transition"
                    :class="isActiveProject(p) ? 'font-semibold text-blue-950' : 'font-medium'" role="option"
                    :aria-selected="isActiveProject(p)" @click="selectProject(p.id)">
                    <span v-if="isActiveProject(p)"
                      class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm"
                      aria-hidden="true">
                      <Icon :icon="icons.check" class="h-3 w-3 shrink-0" />
                    </span>
                    <span v-else class="h-5 w-5 shrink-0 rounded-full border border-edge-subtle/80 bg-surface-raised"
                      aria-hidden="true" />
                    <span class="min-w-0 flex-1 truncate">{{ p.name }}</span>
                  </button>
                  <div
                    class="flex shrink-0 items-center gap-0.5 pr-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    <button type="button"
                      class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-600/90 transition hover:bg-red-50 hover:text-red-700"
                      title="Șterge proiectul" aria-label="Șterge proiectul" @click="requestDeleteProject(p, $event)">
                      <Icon :icon="icons.trash" class="h-4 w-4 shrink-0" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </li>
              <li v-if="!filteredProjects.length"
                class="rounded-xl border border-dashed border-edge-subtle bg-surface-subtle/50 px-3 py-6 text-center">
                <p class="text-sm font-medium text-content-muted">Niciun rezultat</p>
                <p class="mt-1 text-xs text-content-muted">Încearcă alt termen de căutare.</p>
              </li>
            </ul>
          </div>
        </Transition>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div v-if="deleteModalOpen && deleteTarget" class="fixed inset-0 z-[201] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/45 backdrop-blur-[2px]" aria-hidden="true" @click="closeDeleteModal" />
      <div role="alertdialog" aria-modal="true" aria-labelledby="delete-project-title"
        aria-describedby="delete-project-desc"
        class="relative z-10 w-full max-w-md rounded-2xl border border-edge-subtle bg-surface-raised p-5 shadow-2xl ring-1 ring-black/5"
        @click.stop>
        <h2 id="delete-project-title" class="font-display text-lg font-semibold text-content">Ștergi proiectul?</h2>
        <p id="delete-project-desc" class="mt-2 text-sm text-content-muted">
          Proiectul <span class="font-medium text-content">„{{ deleteTarget.name }}”</span> va fi șters definitiv
          (versuri și cuvinte salvate pentru acest proiect).
        </p>
        <div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button"
            class="rounded-xl border border-edge-subtle bg-surface-raised px-4 py-2.5 text-sm font-medium text-content-secondary hover:bg-surface-subtle"
            @click="closeDeleteModal">
            Anulează
          </button>
          <button type="button"
            class="rounded-xl border border-red-600 bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-red-700"
            @click="executeDelete">
            Șterge proiectul
          </button>
        </div>
      </div>
    </div>

    <div v-if="newProjectModalOpen" class="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/45 backdrop-blur-[2px]" aria-hidden="true" @click="closeNewProjectModal" />
      <div role="dialog" aria-modal="true" aria-labelledby="new-project-title"
        class="relative z-10 w-full max-w-md rounded-2xl border border-edge-subtle bg-surface-raised p-5 shadow-2xl ring-1 ring-black/5"
        @click.stop>
        <h2 id="new-project-title" class="font-display text-lg font-semibold text-content">Proiect nou</h2>
        <p class="mt-1 text-sm text-content-muted">Alege un nume pentru proiect. Îl poți schimba oricând din meniu.</p>
        <label for="new-project-name"
          class="mt-4 block text-xs font-medium uppercase tracking-wide text-content-muted">Nume</label>
        <input id="new-project-name" ref="newProjectInputRef" v-model="newProjectNameDraft" type="text"
          class="mt-1.5 w-full rounded-xl border border-edge-subtle px-3 py-2.5 text-sm text-content outline-none placeholder:text-content-soft focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
          placeholder="ex. Versuri aprilie" autocomplete="off"
          @keydown.enter.prevent="canSubmitNewProject && confirmNewProject()" />
        <div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button"
            class="rounded-xl border border-edge-subtle bg-surface-raised px-4 py-2.5 text-sm font-medium text-content-secondary hover:bg-surface-subtle"
            @click="closeNewProjectModal">
            Anulează
          </button>
          <button type="button"
            class="rounded-xl border border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:border-edge-subtle disabled:bg-surface-subtle disabled:text-content-muted"
            :disabled="!canSubmitNewProject" @click="confirmNewProject">
            Adaugă proiectul
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
