<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { storeToRefs } from 'pinia'
import {
  READER_FONT_I18N_KEYS,
  READER_FONT_OPTIONS_ORDER,
  READER_FONT_STACKS,
} from '~/composables/useReaderPreferences'
import type { WriteFolder, WriteProject } from '~/stores/writeProjects'

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
const {
  fontKey,
  fontSizePx,
  lineHeight,
  fontFamilyCss,
  decSize,
  incSize,
  decLine,
  incLine,
  sizeAtMin,
  sizeAtMax,
  lineAtMin,
  lineAtMax,
} = useWriteCardFont()
const fontMenuOpen = ref(false)
const fontMenuRef = ref<HTMLElement | null>(null)
const icons = {
  folder: 'heroicons:folder',
  folderOpen: 'heroicons:folder-open',
  plus: 'heroicons:plus',
  magnifyingGlass: 'heroicons:magnifying-glass',
  check: 'heroicons:check',
  trash: 'heroicons:trash',
  chevronRight: 'heroicons:chevron-right',
  chevronDown: 'heroicons:chevron-down',
} as const

const projectStore = useWriteProjectsStore()
const { projects: projectList, folders: folderList } = storeToRefs(projectStore)

const dropdownOpen = ref(false)
const projectSearch = ref('')
const rootRef = ref<HTMLElement | null>(null)

const newProjectModalOpen = ref(false)
const newProjectNameDraft = ref('')
const newProjectFolderId = ref<string | null>(null)
const newProjectInputRef = ref<HTMLInputElement | null>(null)

const newFolderModalOpen = ref(false)
const newFolderNameDraft = ref('')
const newFolderInputRef = ref<HTMLInputElement | null>(null)

const deleteModalOpen = ref(false)
const deleteTarget = ref<{ id: string; name: string } | null>(null)

const deleteFolderModalOpen = ref(false)
const deleteFolderTarget = ref<{ id: string; name: string } | null>(null)

const moveMenuProjectId = ref<string | null>(null)
const draggingProjectId = ref<string | null>(null)
/** Folder id, or `'unfiled'` when hovering the unfiled drop zone. */
const dropTargetKey = ref<string | null>(null)
/** Insert marker while reordering over another project. */
const dropInsert = ref<{ id: string; place: 'before' | 'after' } | null>(null)
let suppressNextProjectClick = false

function resolvedFolderId(p: WriteProject): string | null {
  if (!p.folderId) return null
  return folderList.value.some((f) => f.id === p.folderId) ? p.folderId : null
}

const filteredProjects = computed(() => {
  const q = projectSearch.value.trim().toLowerCase()
  const list = projectList.value
  if (!q) return list
  return list.filter((p) => p.name.toLowerCase().includes(q))
})

const unfiledProjects = computed(() =>
  filteredProjects.value.filter((p) => !p.folderId || !folderList.value.some((f) => f.id === p.folderId)),
)

const folderSections = computed(() => {
  const q = projectSearch.value.trim().toLowerCase()
  return folderList.value
    .map((folder) => {
      const projects = filteredProjects.value.filter((p) => p.folderId === folder.id)
      const nameMatch = !q || folder.name.toLowerCase().includes(q)
      if (!nameMatch && projects.length === 0) return null
      return { folder, projects }
    })
    .filter((x): x is { folder: WriteFolder; projects: WriteProject[] } => x != null)
})

const triggerLabel = computed(() => {
  return projectStore.displayProjectName ?? 'Proiect'
})

const triggerMeta = computed(() => {
  return projectStore.displayProjectName ? 'Proiect activ' : 'Niciun proiect selectat'
})

const hasAnyProjects = computed(() => projectList.value.length > 0)
const hasAnyFolders = computed(() => folderList.value.length > 0)
const listIsEmpty = computed(
  () => !unfiledProjects.value.length && !folderSections.value.length,
)

function isActiveProject(p: { id: string }) {
  const cid = projectStore.currentProjectId
  return typeof p.id === 'string' && p.id.length > 0 && cid != null && cid === p.id
}

const newProjectFolderSelect = computed({
  get: () => newProjectFolderId.value ?? '',
  set: (v: string | null) => {
    newProjectFolderId.value = v ? String(v) : null
  },
})

const canSubmitNewProject = computed(() => newProjectNameDraft.value.trim().length > 0)
const canSubmitNewFolder = computed(() => newFolderNameDraft.value.trim().length > 0)

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
  moveMenuProjectId.value = null
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

function requestDeleteFolder(folder: WriteFolder, ev?: Event) {
  ev?.stopPropagation()
  deleteFolderTarget.value = { id: folder.id, name: folder.name }
  deleteFolderModalOpen.value = true
}

function closeDeleteFolderModal() {
  deleteFolderModalOpen.value = false
  deleteFolderTarget.value = null
}

async function executeDeleteFolder() {
  const f = deleteFolderTarget.value
  if (!f) return
  await projectStore.deleteFolder(f.id)
  closeDeleteFolderModal()
}

function toggleFontMenu() {
  fontMenuOpen.value = !fontMenuOpen.value
  if (fontMenuOpen.value) dropdownOpen.value = false
}

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value
  if (dropdownOpen.value) {
    fontMenuOpen.value = false
    projectSearch.value = ''
    moveMenuProjectId.value = null
  } else {
    draggingProjectId.value = null
    dropTargetKey.value = null
    dropInsert.value = null
  }
}

async function selectProject(id: string) {
  if (suppressNextProjectClick) {
    suppressNextProjectClick = false
    return
  }
  if (isActiveProject({ id })) {
    dropdownOpen.value = false
    projectSearch.value = ''
    return
  }
  await props.flushBeforeProjectChange?.()
  projectStore.selectProject(id)
  dropdownOpen.value = false
  projectSearch.value = ''
  moveMenuProjectId.value = null
}

function openNewProjectModal(folderId: string | null = null) {
  dropdownOpen.value = false
  projectSearch.value = ''
  newProjectNameDraft.value = ''
  newProjectFolderId.value = folderId
  newProjectModalOpen.value = true
  nextTick(() => {
    newProjectInputRef.value?.focus()
    newProjectInputRef.value?.select()
  })
}

function closeNewProjectModal() {
  newProjectModalOpen.value = false
  newProjectNameDraft.value = ''
  newProjectFolderId.value = null
}

async function confirmNewProject() {
  const name = newProjectNameDraft.value.trim()
  if (!name) return
  await props.flushBeforeProjectChange?.()
  projectStore.createProject(name, newProjectFolderId.value)
  closeNewProjectModal()
}

function openNewFolderModal() {
  dropdownOpen.value = false
  projectSearch.value = ''
  newFolderNameDraft.value = ''
  newFolderModalOpen.value = true
  nextTick(() => {
    newFolderInputRef.value?.focus()
    newFolderInputRef.value?.select()
  })
}

function closeNewFolderModal() {
  newFolderModalOpen.value = false
  newFolderNameDraft.value = ''
}

async function confirmNewFolder() {
  const name = newFolderNameDraft.value.trim()
  if (!name) return
  await projectStore.createFolder(name)
  closeNewFolderModal()
}

function toggleMoveMenu(projectId: string, ev?: Event) {
  ev?.stopPropagation()
  moveMenuProjectId.value = moveMenuProjectId.value === projectId ? null : projectId
}

async function moveProjectToFolder(projectId: string, folderId: string | null) {
  await projectStore.setProjectFolder(projectId, folderId)
  moveMenuProjectId.value = null
}

function onProjectDragStart(p: WriteProject, e: DragEvent) {
  if (!e.dataTransfer) return
  draggingProjectId.value = p.id
  dropTargetKey.value = null
  dropInsert.value = null
  moveMenuProjectId.value = null
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', p.id)
  e.dataTransfer.setData('application/x-poetryhub-project', p.id)
}

function onProjectDragEnd() {
  draggingProjectId.value = null
  dropTargetKey.value = null
  dropInsert.value = null
}

function onFolderDragOver(folderId: string | null, e: DragEvent) {
  if (!draggingProjectId.value) return
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  dropTargetKey.value = folderId ?? 'unfiled'
  dropInsert.value = null
  // Expand collapsed folders so drop feedback is clear.
  if (folderId && projectStore.isFolderCollapsed(folderId)) {
    projectStore.toggleFolderCollapsed(folderId)
  }
}

function onFolderDragLeave(folderId: string | null, e: DragEvent) {
  const related = e.relatedTarget as Node | null
  const current = e.currentTarget as HTMLElement | null
  if (current && related && current.contains(related)) return
  const key = folderId ?? 'unfiled'
  if (dropTargetKey.value === key) dropTargetKey.value = null
}

async function onFolderDrop(folderId: string | null, e: DragEvent) {
  e.preventDefault()
  const id =
    e.dataTransfer?.getData('application/x-poetryhub-project')
    || e.dataTransfer?.getData('text/plain')
    || draggingProjectId.value
  draggingProjectId.value = null
  dropTargetKey.value = null
  dropInsert.value = null
  if (!id) return
  suppressNextProjectClick = true
  await moveProjectToFolder(id, folderId)
  // Append to the end of that folder / unfiled group.
  const siblings = projectStore.projects.filter(
    (p) => p.id !== id && resolvedFolderId(p) === folderId,
  )
  const last = siblings[siblings.length - 1]
  if (last) projectStore.reorderProject(id, last.id, 'after')
}

function onProjectItemDragOver(target: WriteProject, e: DragEvent) {
  if (!draggingProjectId.value || draggingProjectId.value === target.id) return
  e.preventDefault()
  e.stopPropagation()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  dropTargetKey.value = null
  const el = e.currentTarget as HTMLElement | null
  if (!el) return
  const rect = el.getBoundingClientRect()
  const place: 'before' | 'after' = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
  dropInsert.value = { id: target.id, place }
}

function onProjectItemDragLeave(target: WriteProject, e: DragEvent) {
  const related = e.relatedTarget as Node | null
  const current = e.currentTarget as HTMLElement | null
  if (current && related && current.contains(related)) return
  if (dropInsert.value?.id === target.id) dropInsert.value = null
}

async function onProjectItemDrop(target: WriteProject, e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  const id =
    e.dataTransfer?.getData('application/x-poetryhub-project')
    || e.dataTransfer?.getData('text/plain')
    || draggingProjectId.value
  const place =
    dropInsert.value?.id === target.id ? dropInsert.value.place : 'after'
  draggingProjectId.value = null
  dropTargetKey.value = null
  dropInsert.value = null
  if (!id || id === target.id) return
  suppressNextProjectClick = true
  const source = projectStore.projects.find((p) => p.id === id)
  if (!source) return
  const targetFolder = resolvedFolderId(target)
  if (resolvedFolderId(source) !== targetFolder) {
    await projectStore.setProjectFolder(id, targetFolder)
  }
  projectStore.reorderProject(id, target.id, place)
  moveMenuProjectId.value = null
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
  const target = e.target as Node
  if (dropdownOpen.value && rootRef.value && !rootRef.value.contains(target)) {
    dropdownOpen.value = false
    moveMenuProjectId.value = null
  }
  if (fontMenuOpen.value && fontMenuRef.value && !fontMenuRef.value.contains(target)) {
    fontMenuOpen.value = false
  }
}

function onGlobalKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && deleteFolderModalOpen.value) {
    e.preventDefault()
    closeDeleteFolderModal()
    return
  }
  if (e.key === 'Escape' && deleteModalOpen.value) {
    e.preventDefault()
    closeDeleteModal()
    return
  }
  if (e.key === 'Escape' && newFolderModalOpen.value) {
    e.preventDefault()
    closeNewFolderModal()
    return
  }
  if (e.key === 'Escape' && newProjectModalOpen.value) {
    e.preventDefault()
    closeNewProjectModal()
    return
  }
  if (e.key === 'Escape' && fontMenuOpen.value) {
    e.preventDefault()
    fontMenuOpen.value = false
  }
}

watch(
  [newProjectModalOpen, newFolderModalOpen, deleteModalOpen, deleteFolderModalOpen],
  ([openNew, openFolder, openDel, openDelFolder]) => {
    if (!import.meta.client) return
    document.body.style.overflow = openNew || openFolder || openDel || openDelFolder ? 'hidden' : ''
  },
)

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
              <button type="button" class="write-tools__new-btn" @click="openNewProjectModal(null)">
                <Icon :icon="icons.plus" class="write-tools__new-icon" aria-hidden="true" />
                {{ t('write.newProject') }}
              </button>
              <button type="button" class="write-tools__new-folder-btn" @click="openNewFolderModal">
                <Icon :icon="icons.folder" class="write-tools__new-folder-icon" aria-hidden="true" />
                {{ t('write.newFolder') }}
              </button>
            </div>

            <div class="write-tools__search-section">
              <label class="write-tools__search-label">{{ t('write.searchProjects') }}</label>
              <div class="write-tools__search-field">
                <span class="write-tools__search-icon-wrap" aria-hidden="true">
                  <Icon :icon="icons.magnifyingGlass" class="write-tools__icon" />
                </span>
                <label class="sr-only">{{ t('write.searchProjects') }}</label>
                <input v-model="projectSearch" type="search" :placeholder="t('write.filterByName')" autocomplete="off"
                  class="write-tools__search-input" @keydown.escape="dropdownOpen = false" />
              </div>
            </div>

            <ul
              class="write-tools__list"
              :class="{ 'write-tools__list--dragging': !!draggingProjectId }"
              aria-label="Lista proiectelor"
            >
              <template v-for="section in folderSections" :key="section.folder.id">
                <li
                  class="write-tools__folder"
                  :class="{ 'write-tools__folder--drop': dropTargetKey === section.folder.id }"
                  @dragover="onFolderDragOver(section.folder.id, $event)"
                  @dragleave="onFolderDragLeave(section.folder.id, $event)"
                  @drop="onFolderDrop(section.folder.id, $event)"
                >
                  <div class="write-tools__folder-row">
                    <button
                      type="button"
                      class="write-tools__folder-toggle"
                      :aria-expanded="!projectStore.isFolderCollapsed(section.folder.id)"
                      @click="projectStore.toggleFolderCollapsed(section.folder.id)"
                    >
                      <Icon
                        :icon="projectStore.isFolderCollapsed(section.folder.id) ? icons.chevronRight : icons.chevronDown"
                        class="write-tools__folder-chevron"
                        aria-hidden="true"
                      />
                      <Icon
                        :icon="projectStore.isFolderCollapsed(section.folder.id) ? icons.folder : icons.folderOpen"
                        class="write-tools__folder-icon"
                        aria-hidden="true"
                      />
                      <span class="write-tools__folder-name">{{ section.folder.name }}</span>
                    </button>
                    <div class="write-tools__folder-actions">
                      <button
                        type="button"
                        class="write-tools__folder-add"
                        :title="t('write.newProject')"
                        :aria-label="t('write.newProject')"
                        @click="openNewProjectModal(section.folder.id)"
                      >
                        <Icon :icon="icons.plus" class="write-tools__icon" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        class="write-tools__item-delete"
                        :title="t('write.deleteFolder')"
                        :aria-label="t('write.deleteFolder')"
                        @click="requestDeleteFolder(section.folder, $event)"
                      >
                        <Icon :icon="icons.trash" class="write-tools__icon" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <ul
                    v-if="!projectStore.isFolderCollapsed(section.folder.id)"
                    class="write-tools__folder-list"
                  >
                    <li v-for="p in section.projects" :key="p.id" class="write-tools__item write-tools__item--nested">
                      <div
                        class="write-tools__item-row"
                        :class="{
                          'write-tools__item-row--active': isActiveProject(p),
                          'write-tools__item-row--dragging': draggingProjectId === p.id,
                          'write-tools__item-row--drop-before': dropInsert?.id === p.id && dropInsert.place === 'before',
                          'write-tools__item-row--drop-after': dropInsert?.id === p.id && dropInsert.place === 'after',
                        }"
                        draggable="true"
                        @dragstart="onProjectDragStart(p, $event)"
                        @dragend="onProjectDragEnd"
                        @dragover="onProjectItemDragOver(p, $event)"
                        @dragleave="onProjectItemDragLeave(p, $event)"
                        @drop="onProjectItemDrop(p, $event)"
                      >
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
                          <button
                            type="button"
                            class="write-tools__item-move"
                            :title="t('write.moveToFolder')"
                            :aria-label="t('write.moveToFolder')"
                            :aria-expanded="moveMenuProjectId === p.id"
                            @click="toggleMoveMenu(p.id, $event)"
                          >
                            <Icon :icon="icons.folder" class="write-tools__icon" aria-hidden="true" />
                          </button>
                          <button type="button" class="write-tools__item-delete" title="Șterge proiectul"
                            aria-label="Șterge proiectul" @click="requestDeleteProject(p, $event)">
                            <Icon :icon="icons.trash" class="write-tools__icon" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      <div v-if="moveMenuProjectId === p.id" class="write-tools__move-menu" @click.stop>
                        <button
                          type="button"
                          class="write-tools__move-option"
                          :class="{ 'write-tools__move-option--active': !p.folderId }"
                          @click="moveProjectToFolder(p.id, null)"
                        >
                          {{ t('write.noFolder') }}
                        </button>
                        <button
                          v-for="f in folderList"
                          :key="f.id"
                          type="button"
                          class="write-tools__move-option"
                          :class="{ 'write-tools__move-option--active': p.folderId === f.id }"
                          @click="moveProjectToFolder(p.id, f.id)"
                        >
                          {{ f.name }}
                        </button>
                      </div>
                    </li>
                    <li v-if="!section.projects.length" class="write-tools__folder-empty">
                      —
                    </li>
                  </ul>
                </li>
              </template>

              <li
                v-if="hasAnyFolders && (unfiledProjects.length || draggingProjectId)"
                class="write-tools__section-label"
                :class="{ 'write-tools__section-label--drop': dropTargetKey === 'unfiled' }"
                @dragover="onFolderDragOver(null, $event)"
                @dragleave="onFolderDragLeave(null, $event)"
                @drop="onFolderDrop(null, $event)"
              >
                {{ draggingProjectId ? t('write.noFolder') : t('write.unfiledProjects') }}
              </li>

              <li v-for="p in unfiledProjects" :key="p.id" class="write-tools__item">
                <div
                  class="write-tools__item-row"
                  :class="{
                    'write-tools__item-row--active': isActiveProject(p),
                    'write-tools__item-row--dragging': draggingProjectId === p.id,
                    'write-tools__item-row--drop-before': dropInsert?.id === p.id && dropInsert.place === 'before',
                    'write-tools__item-row--drop-after': dropInsert?.id === p.id && dropInsert.place === 'after',
                  }"
                  draggable="true"
                  @dragstart="onProjectDragStart(p, $event)"
                  @dragend="onProjectDragEnd"
                  @dragover="onProjectItemDragOver(p, $event)"
                  @dragleave="onProjectItemDragLeave(p, $event)"
                  @drop="onProjectItemDrop(p, $event)"
                >
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
                    <button
                      v-if="hasAnyFolders"
                      type="button"
                      class="write-tools__item-move"
                      :title="t('write.moveToFolder')"
                      :aria-label="t('write.moveToFolder')"
                      :aria-expanded="moveMenuProjectId === p.id"
                      @click="toggleMoveMenu(p.id, $event)"
                    >
                      <Icon :icon="icons.folder" class="write-tools__icon" aria-hidden="true" />
                    </button>
                    <button type="button" class="write-tools__item-delete" title="Șterge proiectul"
                      aria-label="Șterge proiectul" @click="requestDeleteProject(p, $event)">
                      <Icon :icon="icons.trash" class="write-tools__icon" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div v-if="moveMenuProjectId === p.id" class="write-tools__move-menu" @click.stop>
                  <button
                    type="button"
                    class="write-tools__move-option"
                    :class="{ 'write-tools__move-option--active': !p.folderId }"
                    @click="moveProjectToFolder(p.id, null)"
                  >
                    {{ t('write.noFolder') }}
                  </button>
                  <button
                    v-for="f in folderList"
                    :key="f.id"
                    type="button"
                    class="write-tools__move-option"
                    :class="{ 'write-tools__move-option--active': p.folderId === f.id }"
                    @click="moveProjectToFolder(p.id, f.id)"
                  >
                    {{ f.name }}
                  </button>
                </div>
              </li>

              <li v-if="listIsEmpty" class="write-tools__empty">
                <template v-if="!hasAnyProjects && !hasAnyFolders">
                  <p class="write-tools__empty-title">Niciun proiect încă</p>
                  <p class="write-tools__empty-hint">Salvează ciorna, creează un proiect sau un dosar.</p>
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
        <div ref="fontMenuRef" class="write-tools__card-font">
          <button
            type="button"
            class="write-tools__autosave-bulb"
            :class="{ 'write-tools__autosave-bulb--on': fontMenuOpen }"
            :aria-expanded="fontMenuOpen"
            aria-haspopup="dialog"
            aria-controls="write-card-font-menu"
            :aria-label="t('write.cardFontAria')"
            @click="toggleFontMenu"
          >
            <Icon icon="heroicons:cog-6-tooth" class="write-tools__autosave-bulb-icon" aria-hidden="true" />
          </button>
          <div
            v-show="fontMenuOpen"
            id="write-card-font-menu"
            class="write-tools__card-font-menu"
            role="dialog"
            :aria-label="t('write.cardFontSettings')"
          >
            <p class="write-tools__card-font-label">{{ t('viewer.font') }}</p>
            <select
              v-model="fontKey"
              class="write-tools__card-font-select"
              :style="{ fontFamily: fontFamilyCss }"
              :aria-label="t('viewer.font')"
            >
              <option
                v-for="f in READER_FONT_OPTIONS_ORDER"
                :key="f"
                :value="f"
                :style="{ fontFamily: READER_FONT_STACKS[f] }"
              >
                {{ t(READER_FONT_I18N_KEYS[f]) }}
              </option>
            </select>
            <div class="write-tools__card-font-row">
              <p class="write-tools__card-font-label">{{ t('viewer.fontSize') }}</p>
              <div class="write-tools__card-font-stepper">
                <button
                  type="button"
                  class="write-tools__card-font-step"
                  :disabled="sizeAtMin"
                  :aria-label="`${t('viewer.fontSize')} -`"
                  @click="decSize"
                >
                  <Icon icon="heroicons:minus" class="write-tools__icon write-tools__icon--sm" aria-hidden="true" />
                </button>
                <span class="write-tools__card-font-value">{{ fontSizePx }}</span>
                <button
                  type="button"
                  class="write-tools__card-font-step"
                  :disabled="sizeAtMax"
                  :aria-label="`${t('viewer.fontSize')} +`"
                  @click="incSize"
                >
                  <Icon icon="heroicons:plus" class="write-tools__icon write-tools__icon--sm" aria-hidden="true" />
                </button>
              </div>
            </div>
            <div class="write-tools__card-font-row">
              <p class="write-tools__card-font-label">{{ t('viewer.lineHeight') }}</p>
              <div class="write-tools__card-font-stepper">
                <button
                  type="button"
                  class="write-tools__card-font-step"
                  :disabled="lineAtMin"
                  :aria-label="`${t('viewer.lineHeight')} -`"
                  @click="decLine"
                >
                  <Icon icon="heroicons:minus" class="write-tools__icon write-tools__icon--sm" aria-hidden="true" />
                </button>
                <span class="write-tools__card-font-value">{{ lineHeight.toFixed(2) }}</span>
                <button
                  type="button"
                  class="write-tools__card-font-step"
                  :disabled="lineAtMax"
                  :aria-label="`${t('viewer.lineHeight')} +`"
                  @click="incLine"
                >
                  <Icon icon="heroicons:plus" class="write-tools__icon write-tools__icon--sm" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>

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
            Șterge
          </button>
        </div>
      </div>
    </div>

    <div v-if="deleteFolderModalOpen && deleteFolderTarget" class="write-tools__modal write-tools__modal--alert">
      <div class="write-tools__modal-backdrop" aria-hidden="true" @click="closeDeleteFolderModal" />
      <div role="alertdialog" aria-modal="true" aria-labelledby="delete-folder-title"
        aria-describedby="delete-folder-desc" class="write-tools__modal-panel" @click.stop>
        <h2 id="delete-folder-title" class="write-tools__modal-title">{{ t('write.deleteFolderTitle') }}</h2>
        <p id="delete-folder-desc" class="write-tools__modal-desc">
          {{ t('write.deleteFolderDesc', { name: deleteFolderTarget.name }) }}
        </p>
        <div class="write-tools__modal-actions">
          <button type="button" class="write-tools__modal-cancel" @click="closeDeleteFolderModal">
            Anulează
          </button>
          <button type="button" class="write-tools__modal-danger" @click="executeDeleteFolder">
            {{ t('write.deleteFolderConfirm') }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="newProjectModalOpen" class="write-tools__modal">
      <div class="write-tools__modal-backdrop" aria-hidden="true" @click="closeNewProjectModal" />
      <div role="dialog" aria-modal="true" aria-labelledby="new-project-title" class="write-tools__modal-panel"
        @click.stop>
        <h2 id="new-project-title" class="write-tools__modal-title">{{ t('write.newProject') }}</h2>
        <p class="write-tools__modal-desc">Alege un nume pentru proiect. Îl poți schimba oricând din meniu.</p>
        <label for="new-project-name" class="write-tools__modal-label">Nume</label>
        <input id="new-project-name" ref="newProjectInputRef" v-model="newProjectNameDraft" type="text"
          class="write-tools__modal-input" placeholder="ex. Versuri aprilie" autocomplete="off"
          @keydown.enter.prevent="canSubmitNewProject && confirmNewProject()" />
        <label v-if="folderList.length" for="new-project-folder" class="write-tools__modal-label">
          {{ t('write.moveToFolder') }}
        </label>
        <select
          v-if="folderList.length"
          id="new-project-folder"
          v-model="newProjectFolderSelect"
          class="write-tools__modal-input"
        >
          <option value="">{{ t('write.noFolder') }}</option>
          <option v-for="f in folderList" :key="f.id" :value="f.id">{{ f.name }}</option>
        </select>
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

    <div v-if="newFolderModalOpen" class="write-tools__modal">
      <div class="write-tools__modal-backdrop" aria-hidden="true" @click="closeNewFolderModal" />
      <div role="dialog" aria-modal="true" aria-labelledby="new-folder-title" class="write-tools__modal-panel"
        @click.stop>
        <h2 id="new-folder-title" class="write-tools__modal-title">{{ t('write.newFolder') }}</h2>
        <label for="new-folder-name" class="write-tools__modal-label">{{ t('write.folderName') }}</label>
        <input id="new-folder-name" ref="newFolderInputRef" v-model="newFolderNameDraft" type="text"
          class="write-tools__modal-input" :placeholder="t('write.folderNamePlaceholder')" autocomplete="off"
          @keydown.enter.prevent="canSubmitNewFolder && confirmNewFolder()" />
        <div class="write-tools__modal-actions">
          <button type="button" class="write-tools__modal-cancel" @click="closeNewFolderModal">
            Anulează
          </button>
          <button type="button" class="ds-btn-primary" :disabled="!canSubmitNewFolder" @click="confirmNewFolder">
            {{ t('write.addFolder') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
