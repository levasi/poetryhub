<script setup lang="ts">
import { useAutosizeTextarea } from '~/composables/useAutosizeTextarea'
import { useWriteLyricsStore } from '~/stores/writeLyrics'
import { useWriteProjectsStore } from '~/stores/writeProjects'

const projects = useWriteProjectsStore()
const lyrics = useWriteLyricsStore()
const { text: lyricsText } = storeToRefs(lyrics)

const taRef = ref<HTMLTextAreaElement | null>(null)
useAutosizeTextarea(taRef, lyricsText)
</script>

<template>
  <div class="flex min-w-0 flex-col gap-4">
    <div class="rounded-2xl border border-ink-200 bg-white p-4 shadow-sm">
      <label for="lyrics-editor" class="font-serif text-sm font-semibold uppercase tracking-wide text-ink-500">
        Versuri
      </label>
      <textarea
        id="lyrics-editor"
        ref="taRef"
        v-model="lyricsText"
        rows="6"
        class="mt-2 w-full resize-y rounded-xl border border-ink-200 bg-ink-50/50 px-3 py-2 font-serif text-sm leading-relaxed text-ink-900 outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20"
        placeholder="Scrie versuri aici…"
        spellcheck="true"
      />
      <button
        type="button"
        class="mt-2 text-xs text-ink-600 hover:text-ink-900"
        @click="lyrics.clearAllLyrics()"
      >
        Golește versurile
      </button>
    </div>

    <div v-if="projects.currentProject" class="rounded-2xl border border-ink-200 bg-white p-4 shadow-sm">
      <h3 class="font-serif text-sm font-semibold uppercase tracking-wide text-ink-500">
        Cuvinte salvate
      </h3>
      <p class="mt-1 text-[11px] text-ink-500">
        Din rezultatele căutării, butonul + adaugă cuvântul la proiectul selectat.
      </p>
      <ul v-if="projects.currentProject.savedWords.length" class="mt-3 flex flex-wrap gap-1.5">
        <li
          v-for="w in projects.currentProject.savedWords"
          :key="w"
          class="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-ink-50 px-2 py-0.5 text-xs text-ink-800"
        >
          <span>{{ w }}</span>
          <button
            type="button"
            class="rounded p-0.5 text-ink-500 hover:bg-ink-200 hover:text-ink-900"
            title="Elimină"
            @click="projects.removeSavedWord(w)"
          >
            ×
          </button>
        </li>
      </ul>
      <p v-else class="mt-3 text-xs text-ink-500">Niciun cuvânt salvat încă.</p>
    </div>
  </div>
</template>
