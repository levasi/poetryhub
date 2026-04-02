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
  pencilSquare: 'heroicons:pencil-square',
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

const editingId = ref<string | null>(null)
const editDraft = ref('')

function startRename(p: { id: string; name: string }, ev?: Event) {
  ev?.stopPropagation()
  if (editingId.value && editingId.value !== p.id) commitRename()
  editingId.value = p.id
  editDraft.value = p.name
}

function commitRename() {
  if (!editingId.value) return
  projectStore.renameProject(editingId.value, editDraft.value)
  editingId.value = null
}

function cancelRename() {
  editingId.value = null
}

function requestDeleteProject(p: { id: string; name: string }, ev?: Event) {
  ev?.stopPropagation()
  if (editingId.value && editingId.value !== p.id) commitRename()
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
  if (editingId.value === p.id) editingId.value = null
  projectStore.deleteProject(p.id)
  projectSearch.value = ''
  closeDeleteModal()
}

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value
  if (dropdownOpen.value) projectSearch.value = ''
}

watch(dropdownOpen, (open) => {
  if (!open && editingId.value) commitRename()
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
  <div class="shrink-0 px-4 py-2 backdrop-blur-sm" aria-label="Instrumente">
    <div class="flex w-full min-w-0 items-center justify-between gap-3">
      <div ref="rootRef" class="relative min-w-0">
        <button type="button"
          class="flex min-w-[10.5rem] max-w-[min(100%,16rem)] items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-left shadow-sm ring-slate-950/5 transition hover:border-slate-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2"
          :aria-expanded="dropdownOpen" aria-haspopup="listbox" @click.stop="toggleDropdown">
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600"
            aria-hidden="true">
            <Icon :icon="icons.folder" class="h-4 w-4 shrink-0" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-semibold leading-tight text-slate-900">{{ triggerLabel }}</span>
            <span class="mt-0.5 block text-[10px] font-medium uppercase tracking-wide text-slate-400">Proiect
              activ</span>
          </span>
          <Icon
            :icon="icons.chevronDown"
            class="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200"
            :class="dropdownOpen ? 'rotate-180' : ''"
            aria-hidden="true"
          />
        </button>

        <Transition enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 -translate-y-1 scale-[0.98]" enter-to-class="opacity-100 translate-y-0 scale-100"
          leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100 translate-y-0 scale-100"
          leave-to-class="opacity-0 -translate-y-0.5 scale-[0.99]">
          <div v-show="dropdownOpen"
            class="absolute left-0 z-50 mt-2 w-[min(100vw-2rem,20rem)] origin-top overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-xl shadow-slate-900/10 ring-1 ring-slate-950/[0.04] backdrop-blur-md"
            role="listbox" @click.stop>
            <div class="border-b border-slate-100/90 bg-gradient-to-b from-slate-50/80 to-white px-3 pb-3 pt-3">
              <button type="button"
                class="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2"
                @click="openNewProjectModal">
                <Icon :icon="icons.plus" class="h-5 w-5 shrink-0" aria-hidden="true" />
                Proiect nou
              </button>
            </div>

            <div class="px-3 pt-3">
              <label class="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Caută</label>
              <div class="relative">
                <span class="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-slate-400"
                  aria-hidden="true">
                  <Icon :icon="icons.magnifyingGlass" class="h-4 w-4 shrink-0" />
                </span>
                <label class="sr-only">Caută proiecte</label>
                <input v-model="projectSearch" type="search" placeholder="Filtră după nume…" autocomplete="off"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none ring-blue-500/20 transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2"
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
                    : 'hover:border-slate-200/80 hover:bg-slate-50'
                    ">
                  <template v-if="editingId === p.id">
                    <input v-model="editDraft" type="text"
                      class="min-w-0 flex-1 rounded-lg border border-blue-300 bg-white px-2.5 py-2 text-sm text-slate-900 outline-none ring-2 ring-blue-500/20"
                      autocomplete="off" :aria-label="'Redenumește: ' + p.name" @click.stop
                      @keydown.enter.prevent="commitRename" @keydown.escape.prevent="cancelRename" />
                  </template>
                  <template v-else>
                    <button type="button"
                      class="flex min-w-0 flex-1 items-center gap-2 rounded-lg py-2 pl-2 pr-1 text-left text-sm text-slate-800 transition"
                      :class="isActiveProject(p) ? 'font-semibold text-blue-950' : 'font-medium'" role="option"
                      :aria-selected="isActiveProject(p)" @click="selectProject(p.id)">
                      <span v-if="isActiveProject(p)"
                        class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm"
                        aria-hidden="true">
                        <Icon :icon="icons.check" class="h-3 w-3 shrink-0" />
                      </span>
                      <span v-else class="h-5 w-5 shrink-0 rounded-full border border-slate-200/80 bg-white"
                        aria-hidden="true" />
                      <span class="min-w-0 flex-1 truncate">{{ p.name }}</span>
                    </button>
                    <div
                      class="flex shrink-0 items-center gap-0.5 pr-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                      <button type="button"
                        class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-slate-900"
                        title="Redenumește" aria-label="Redenumește" @click="startRename(p, $event)">
                        <Icon :icon="icons.pencilSquare" class="h-4 w-4 shrink-0" aria-hidden="true" />
                      </button>
                      <button type="button"
                        class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-600/90 transition hover:bg-red-50 hover:text-red-700"
                        title="Șterge proiectul" aria-label="Șterge proiectul" @click="requestDeleteProject(p, $event)">
                        <Icon :icon="icons.trash" class="h-4 w-4 shrink-0" aria-hidden="true" />
                      </button>
                    </div>
                  </template>
                </div>
              </li>
              <li v-if="!filteredProjects.length"
                class="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-3 py-6 text-center">
                <p class="text-sm font-medium text-slate-600">Niciun rezultat</p>
                <p class="mt-1 text-xs text-slate-500">Încearcă alt termen de căutare.</p>
              </li>
            </ul>
          </div>
        </Transition>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <span v-if="saveFeedback" class="hidden max-w-[10rem] truncate text-xs font-medium sm:inline"
          :class="saveFeedback === 'Eroare la salvare' ? 'text-red-600' : 'text-slate-600'" role="status">
          {{ saveFeedback }}
        </span>
        <button type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="saveBusy" aria-label="Salvează proiectele" @click="onSaveClick">
          <Icon :icon="icons.arrowDownTray" class="h-4 w-4 shrink-0 text-slate-600" aria-hidden="true" />
          <span v-if="saveBusy">Se salvează…</span>
          <span v-else>Salvează</span>
        </button>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div v-if="deleteModalOpen && deleteTarget" class="fixed inset-0 z-[201] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" aria-hidden="true" @click="closeDeleteModal" />
      <div role="alertdialog" aria-modal="true" aria-labelledby="delete-project-title"
        aria-describedby="delete-project-desc"
        class="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl ring-1 ring-black/5"
        @click.stop>
        <h2 id="delete-project-title" class="font-display text-lg font-semibold text-slate-900">Ștergi proiectul?</h2>
        <p id="delete-project-desc" class="mt-2 text-sm text-slate-600">
          Proiectul <span class="font-medium text-slate-900">„{{ deleteTarget.name }}”</span> va fi șters definitiv
          (versuri și cuvinte salvate pentru acest proiect).
        </p>
        <div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button"
            class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
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
      <div class="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" aria-hidden="true"
        @click="closeNewProjectModal" />
      <div role="dialog" aria-modal="true" aria-labelledby="new-project-title"
        class="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl ring-1 ring-black/5"
        @click.stop>
        <h2 id="new-project-title" class="font-display text-lg font-semibold text-slate-900">Proiect nou</h2>
        <p class="mt-1 text-sm text-slate-600">Alege un nume pentru proiect. Îl poți schimba oricând din meniu.</p>
        <label for="new-project-name"
          class="mt-4 block text-xs font-medium uppercase tracking-wide text-slate-500">Nume</label>
        <input id="new-project-name" ref="newProjectInputRef" v-model="newProjectNameDraft" type="text"
          class="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
          placeholder="ex. Versuri aprilie" autocomplete="off"
          @keydown.enter.prevent="canSubmitNewProject && confirmNewProject()" />
        <div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button"
            class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            @click="closeNewProjectModal">
            Anulează
          </button>
          <button type="button"
            class="rounded-xl border border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-500"
            :disabled="!canSubmitNewProject" @click="confirmNewProject">
            Adaugă proiectul
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
