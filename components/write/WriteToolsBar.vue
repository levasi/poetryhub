<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { storeToRefs } from 'pinia'

const props = withDefaults(
  defineProps<{
    saveLoading?: boolean
    canSave?: boolean
    autosaveEnabled?: boolean
    /** Flush pending autosave before leaving the current project. */
    flushBeforeProjectChange?: () => Promise<void>
  }>(),
  { saveLoading: false, canSave: false, autosaveEnabled: false },
)

const emit = defineEmits<{
  save: []
  publish: []
  'update:autosaveEnabled': [value: boolean]
}>()

const { t } = useI18n()
const icons = {
  folder: 'heroicons:folder',
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
  return projectStore.displayProjectName ?? 'Proiect'
})

const triggerMeta = computed(() => {
  return projectStore.displayProjectName ? 'Proiect activ' : 'Niciun proiect selectat'
})

const hasAnyProjects = computed(() => projectList.value.length > 0)

function isActiveProject(p: { id: string }) {
  const cid = projectStore.currentProjectId
  return typeof p.id === 'string' && p.id.length > 0 && cid != null && cid === p.id
}

const canSubmitNewProject = computed(() => newProjectNameDraft.value.trim().length > 0)

const saveButtonDisabled = computed(
  () => props.autosaveEnabled || !props.canSave || props.saveLoading,
)

const showSaveIdleTip = computed(
  () => !props.autosaveEnabled && !props.canSave && !props.saveLoading,
)

const showSaveTip = computed(
  () => (props.autosaveEnabled && !props.saveLoading) || showSaveIdleTip.value,
)

const saveTipText = computed(() =>
  props.autosaveEnabled ? t('write.autosaveToggle') : t('write.saveNoChanges'),
)

function toggleAutosave() {
  emit('update:autosaveEnabled', !props.autosaveEnabled)
}

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

async function executeDelete() {
  const p = deleteTarget.value
  if (!p) return
  await props.flushBeforeProjectChange?.()
  const full = projectStore.projects.find((x) => x.id === p.id)
  if (full?.draftId) {
    try {
      await $fetch(`/api/user/drafts/${encodeURIComponent(full.draftId)}`, {
        method: 'DELETE',
        credentials: 'include',
      })
    } catch {
      /* still remove local */
    }
  }
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

async function selectProject(id: string) {
  if (isActiveProject({ id })) {
    dropdownOpen.value = false
    projectSearch.value = ''
    return
  }
  await props.flushBeforeProjectChange?.()
  projectStore.selectProject(id)
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

async function confirmNewProject() {
  const name = newProjectNameDraft.value.trim()
  if (!name) return
  await props.flushBeforeProjectChange?.()
  projectStore.createProject(name)
  closeNewProjectModal()
}

async function refreshRemoteProjects() {
  try {
    await projectStore.syncRemoteDrafts()
  } catch {
    /* ignore */
  }
}

watch(dropdownOpen, (open) => {
  if (open) void refreshRemoteProjects()
})

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

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointerDown)
  document.addEventListener('keydown', onGlobalKeydown)
})
onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocPointerDown)
  document.removeEventListener('keydown', onGlobalKeydown)
  if (import.meta.client) document.body.style.overflow = ''
})
</script>

<template>
  <div class="write-tools" aria-label="Instrumente">
    <div class="write-tools__row">
      <div ref="rootRef" class="write-tools__project">
        <button type="button" class="write-tools__trigger" :aria-expanded="dropdownOpen" aria-haspopup="listbox"
          @click.stop="toggleDropdown">
          <span class="write-tools__trigger-icon-wrap" aria-hidden="true">
            <Icon :icon="icons.folder" class="write-tools__icon" />
          </span>
          <span class="write-tools__trigger-text">
            <span class="write-tools__trigger-name">{{ triggerLabel }}</span>
            <span class="write-tools__trigger-meta">{{ triggerMeta }}</span>
          </span>
        </button>

        <Transition name="write-tools-dropdown">
          <div v-show="dropdownOpen" class="write-tools__dropdown" role="listbox" @click.stop>
            <div class="write-tools__dropdown-head">
              <button type="button" class="write-tools__new-btn" @click="openNewProjectModal">
                <Icon :icon="icons.plus" class="write-tools__new-icon" aria-hidden="true" />
                Proiect nou
              </button>
            </div>

            <div class="write-tools__search-section">
              <label class="write-tools__search-label">Caută</label>
              <div class="write-tools__search-field">
                <span class="write-tools__search-icon-wrap" aria-hidden="true">
                  <Icon :icon="icons.magnifyingGlass" class="write-tools__icon" />
                </span>
                <label class="sr-only">Caută proiecte</label>
                <input v-model="projectSearch" type="search" placeholder="Filtră după nume…" autocomplete="off"
                  class="write-tools__search-input" @keydown.escape="dropdownOpen = false" />
              </div>
            </div>

            <ul class="write-tools__list" aria-label="Lista proiectelor">
              <li v-for="p in filteredProjects" :key="p.id" class="write-tools__item">
                <div class="write-tools__item-row" :class="{ 'write-tools__item-row--active': isActiveProject(p) }">
                  <button type="button" class="write-tools__item-btn"
                    :class="{ 'write-tools__item-btn--active': isActiveProject(p) }" role="option"
                    :aria-selected="isActiveProject(p)" @click="selectProject(p.id)">
                    <span v-if="isActiveProject(p)" class="write-tools__item-check" aria-hidden="true">
                      <Icon :icon="icons.check" class="write-tools__icon write-tools__icon--sm" />
                    </span>
                    <span v-else class="write-tools__item-check-empty" aria-hidden="true" />
                    <span class="write-tools__item-name">{{ p.name }}</span>
                  </button>
                  <div class="write-tools__item-actions">
                    <button type="button" class="write-tools__item-delete" title="Șterge proiectul"
                      aria-label="Șterge proiectul" @click="requestDeleteProject(p, $event)">
                      <Icon :icon="icons.trash" class="write-tools__icon" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </li>
              <li v-if="!filteredProjects.length" class="write-tools__empty">
                <template v-if="!hasAnyProjects">
                  <p class="write-tools__empty-title">Niciun proiect încă</p>
                  <p class="write-tools__empty-hint">Salvează ciorna sau creează un proiect nou.</p>
                </template>
                <template v-else>
                  <p class="write-tools__empty-title">Niciun rezultat</p>
                  <p class="write-tools__empty-hint">Încearcă alt termen de căutare.</p>
                </template>
              </li>
            </ul>
          </div>
        </Transition>
      </div>

      <div class="write-tools__actions">
        <div
          class="write-tools__save-wrap"
          :class="{
            'write-tools__save-wrap--idle': showSaveIdleTip,
            'write-tools__save-wrap--busy': props.saveLoading,
            'write-tools__save-wrap--autosave': props.autosaveEnabled && !props.saveLoading,
            'write-tools__save-wrap--tip': showSaveTip,
          }"
        >
          <button
            type="button"
            class="ds-btn-secondary write-tools__btn write-tools__btn--save"
            :class="{
              'write-tools__btn--save-idle': showSaveIdleTip || (props.autosaveEnabled && !props.saveLoading),
              'write-tools__btn--save-autosave': props.autosaveEnabled,
            }"
            :disabled="saveButtonDisabled"
            :aria-busy="props.saveLoading"
            :aria-describedby="showSaveTip ? 'write-save-tip' : undefined"
            @click="emit('save')"
          >
            <span
              v-if="props.saveLoading"
              class="ph-spinner write-tools__spinner"
              aria-hidden="true"
            />
            <Icon
              v-else
              icon="ph:floppy-disk"
              class="write-tools__icon"
              aria-hidden="true"
            />
            {{ t('write.saveBtn') }}
          </button>
          <span
            v-if="showSaveTip"
            id="write-save-tip"
            class="write-tools__save-tip"
            role="tooltip"
          >
            {{ saveTipText }}
          </span>
        </div>

        <div class="write-tools__autosave-bulb-wrap">
          <button
            type="button"
            class="write-tools__autosave-bulb"
            :class="{ 'write-tools__autosave-bulb--on': props.autosaveEnabled }"
            :aria-pressed="props.autosaveEnabled"
            :aria-label="t('write.autosaveToggle')"
            aria-describedby="write-autosave-tip"
            @click="toggleAutosave"
          >
            <Icon
              :icon="props.autosaveEnabled ? 'heroicons:light-bulb-solid' : 'heroicons:light-bulb'"
              class="write-tools__autosave-bulb-icon"
              aria-hidden="true"
            />
          </button>
          <span
            id="write-autosave-tip"
            class="write-tools__autosave-tip"
            role="tooltip"
          >
            {{ t('write.autosaveToggle') }}
          </span>
        </div>

        <button type="button" class="ds-btn-primary write-tools__btn" @click="emit('publish')">
          <Icon icon="heroicons:paper-airplane" class="write-tools__icon" aria-hidden="true" />
          {{ t('write.publishBtn') }}
        </button>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div v-if="deleteModalOpen && deleteTarget" class="write-tools__modal write-tools__modal--alert">
      <div class="write-tools__modal-backdrop" aria-hidden="true" @click="closeDeleteModal" />
      <div role="alertdialog" aria-modal="true" aria-labelledby="delete-project-title"
        aria-describedby="delete-project-desc" class="write-tools__modal-panel" @click.stop>
        <h2 id="delete-project-title" class="write-tools__modal-title">Ștergi proiectul?</h2>
        <p id="delete-project-desc" class="write-tools__modal-desc">
          Proiectul <span class="write-tools__modal-strong">„{{ deleteTarget.name }}”</span> va fi șters definitiv
          (versuri și cuvinte salvate pentru acest proiect).
        </p>
        <div class="write-tools__modal-actions">
          <button type="button" class="write-tools__modal-cancel" @click="closeDeleteModal">
            Anulează
          </button>
          <button type="button" class="write-tools__modal-danger" @click="executeDelete">
            Șterge proiectul
          </button>
        </div>
      </div>
    </div>

    <div v-if="newProjectModalOpen" class="write-tools__modal">
      <div class="write-tools__modal-backdrop" aria-hidden="true" @click="closeNewProjectModal" />
      <div role="dialog" aria-modal="true" aria-labelledby="new-project-title" class="write-tools__modal-panel"
        @click.stop>
        <h2 id="new-project-title" class="write-tools__modal-title">Proiect nou</h2>
        <p class="write-tools__modal-desc">Alege un nume pentru proiect. Îl poți schimba oricând din meniu.</p>
        <label for="new-project-name" class="write-tools__modal-label">Nume</label>
        <input id="new-project-name" ref="newProjectInputRef" v-model="newProjectNameDraft" type="text"
          class="write-tools__modal-input" placeholder="ex. Versuri aprilie" autocomplete="off"
          @keydown.enter.prevent="canSubmitNewProject && confirmNewProject()" />
        <div class="write-tools__modal-actions">
          <button type="button" class="write-tools__modal-cancel" @click="closeNewProjectModal">
            Anulează
          </button>
          <button type="button" class="ds-btn-primary" :disabled="!canSubmitNewProject" @click="confirmNewProject">
            Adaugă proiectul
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
