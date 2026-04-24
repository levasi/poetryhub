<script setup lang="ts">
import { useAutosizeTextarea } from '~/composables/useAutosizeTextarea'
import { useWriteLyricsStore } from '~/stores/writeLyrics'
import { useWriteProjectsStore } from '~/stores/writeProjects'

const projects = useWriteProjectsStore()
const lyrics = useWriteLyricsStore()
const { title, text: lyricsText } = storeToRefs(lyrics)

const taRef = ref<HTMLTextAreaElement | null>(null)
useAutosizeTextarea(taRef, lyricsText)
</script>

<template>
  <div class="flex min-w-0 flex-col gap-4">
    <div class="rounded-2xl border border-edge-subtle bg-surface-raised p-4 shadow-ds-card">
      <label for="lyrics-title" class="font-serif text-sm font-semibold uppercase tracking-wide text-content-muted">
        Titlu
      </label>
      <input
        id="lyrics-title"
        v-model="title"
        type="text"
        autocomplete="off"
        class="mt-2 w-full rounded-xl border border-edge-subtle bg-surface-subtle/50 px-3 py-2 text-sm text-content outline-none focus:border-brand focus:ring-2 focus:ring-brand/25"
        placeholder="Titlul poeziei…"
      />

      <label for="lyrics-editor" class="mt-4 font-serif text-sm font-semibold uppercase tracking-wide text-content-muted">
        Versuri
      </label>
      <textarea
        id="lyrics-editor"
        ref="taRef"
        v-model="lyricsText"
        rows="6"
        class="mt-2 w-full resize-y rounded-xl border border-edge-subtle bg-surface-subtle/50 px-3 py-2 font-serif text-sm leading-relaxed text-content outline-none focus:border-brand focus:ring-2 focus:ring-brand/25"
        placeholder="Scrie versuri aici…"
        spellcheck="true"
      />
      <button
        type="button"
        class="mt-2 text-xs text-content-muted hover:text-content"
        @click="lyrics.clearAllLyrics()"
      >
        Golește versurile
      </button>
    </div>

    <div v-if="projects.currentProject" class="rounded-2xl border border-edge-subtle bg-surface-raised p-4 shadow-ds-card">
      <h3 class="font-serif text-sm font-semibold uppercase tracking-wide text-content-muted">
        Cuvinte salvate
      </h3>
      <p class="mt-1 text-[11px] text-content-muted">
        Din rezultatele căutării, butonul + adaugă cuvântul la proiectul selectat.
      </p>
      <ul v-if="projects.currentProject.savedWords.length" class="mt-3 flex flex-wrap gap-1.5">
        <li
          v-for="w in projects.currentProject.savedWords"
          :key="w"
          class="inline-flex items-center gap-1 rounded-full border border-edge-subtle bg-surface-subtle px-2 py-0.5 text-xs text-content-secondary"
        >
          <span>{{ w }}</span>
          <button
            type="button"
            class="rounded p-0.5 text-content-muted hover:bg-surface-subtle hover:text-content"
            title="Elimină"
            @click="projects.removeSavedWord(w)"
          >
            ×
          </button>
        </li>
      </ul>
      <p v-else class="mt-3 text-xs text-content-muted">Niciun cuvânt salvat încă.</p>
    </div>
  </div>
</template>
