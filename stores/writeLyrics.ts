import { defineStore } from 'pinia'
import { useWriteProjectsStore } from './writeProjects'

export const useWriteLyricsStore = defineStore('writeLyrics', () => {
  const projects = useWriteProjectsStore()

  const text = computed({
    get: () => projects.currentProject?.lyrics ?? '',
    set: (v: string) => projects.setLyrics(v),
  })

  function appendToActive(word: string) {
    projects.appendToLyrics(word)
  }

  function clearAllLyrics() {
    projects.clearLyrics()
  }

  return {
    text,
    appendToActive,
    clearAllLyrics,
  }
})
