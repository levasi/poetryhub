<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  /** Set true while the fetch is in-flight; face changes when it flips back to false. */
  rolling?: boolean
}>()

type Pip = { x: number; y: number }

// Pip centre coordinates in a 48×48 viewBox
const FACES: Record<number, Pip[]> = {
  1: [{ x: 24, y: 24 }],
  2: [{ x: 15, y: 15 }, { x: 33, y: 33 }],
  3: [{ x: 15, y: 15 }, { x: 24, y: 24 }, { x: 33, y: 33 }],
  4: [{ x: 15, y: 15 }, { x: 33, y: 15 }, { x: 15, y: 33 }, { x: 33, y: 33 }],
  5: [{ x: 15, y: 15 }, { x: 33, y: 15 }, { x: 24, y: 24 }, { x: 15, y: 33 }, { x: 33, y: 33 }],
  6: [{ x: 15, y: 13 }, { x: 33, y: 13 }, { x: 15, y: 24 }, { x: 33, y: 24 }, { x: 15, y: 35 }, { x: 33, y: 35 }],
}

const face = ref(Math.floor(Math.random() * 6) + 1)
const phase = ref<'idle' | 'squish' | 'expand'>('idle')
const pipKey = ref(0)

function nextFace(): number {
  const prev = face.value
  let n = Math.floor(Math.random() * 6) + 1
  while (n === prev) n = Math.floor(Math.random() * 6) + 1
  return n
}

// When the fetch resolves (rolling goes false), squish → swap face → spring back
watch(() => props.rolling, (curr, prev) => {
  if (!curr && prev) {
    phase.value = 'squish'
    setTimeout(() => {
      face.value = nextFace()
      pipKey.value++
      phase.value = 'expand'
      setTimeout(() => { phase.value = 'idle' }, 160)
    }, 110)
  }
})

const pips = computed(() => FACES[face.value] ?? [])
</script>

<template>
  <div class="die-root" :class="`die-root--${phase}`">
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="die-svg">
      <defs>
        <filter id="die-drop" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#3d3730" flood-opacity="0.16" />
        </filter>
        <linearGradient id="die-body-fill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fdfcf9" />
          <stop offset="100%" stop-color="#ece6db" />
        </linearGradient>
        <!-- Subtle inner highlight -->
        <linearGradient id="die-shine" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="white" stop-opacity="0.55" />
          <stop offset="55%" stop-color="white" stop-opacity="0" />
        </linearGradient>
      </defs>

      <!-- Body -->
      <rect x="3" y="3" width="42" height="42" rx="9" ry="9"
        fill="url(#die-body-fill)" stroke="#ccc4b8" stroke-width="1.5"
        filter="url(#die-drop)"
      />
      <!-- Inner shine overlay -->
      <rect x="3" y="3" width="42" height="21" rx="9" ry="9"
        fill="url(#die-shine)"
      />

      <!-- Pips — each blooms in with a staggered delay -->
      <circle
        v-for="(p, i) in pips"
        :key="`${pipKey}-${i}`"
        :cx="p.x"
        :cy="p.y"
        r="3.3"
        fill="#2d2924"
        class="pip"
        :style="{ '--delay': `${i * 30}ms` }"
      />
    </svg>
  </div>
</template>

<style scoped>
.die-root {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Idle: gentle organic float ─────────────────────────────────────────── */
.die-svg {
  width: 100%;
  height: 100%;
  transform-origin: center bottom;
  animation: die-float 3.2s ease-in-out infinite;
}

@keyframes die-float {
  0%,  100% { transform: translateY(0px)   rotate(-1.5deg); }
  30%       { transform: translateY(-4px)  rotate( 0.4deg); }
  65%       { transform: translateY(-1.5px) rotate( 1.5deg); }
}

/* ── Squish: die flattens vertically (face swap happens at frame 0 of expand) */
.die-root--squish .die-svg {
  animation: die-squish 110ms cubic-bezier(0.55, 0, 1, 0.45) forwards;
}

@keyframes die-squish {
  0%   { transform: scaleY(1)    scaleX(1); }
  100% { transform: scaleY(0.07) scaleX(1.18); }
}

/* ── Expand: spring back up with a small overshoot ─────────────────────── */
.die-root--expand .die-svg {
  animation: die-expand 160ms cubic-bezier(0.2, 1.6, 0.4, 1) forwards;
}

@keyframes die-expand {
  0%   { transform: scaleY(0.07) scaleX(1.18); }
  100% { transform: scaleY(1)    scaleX(1); }
}

/* ── Pips: bloom in with stagger ──────────────────────────────────────── */
.pip {
  transform-origin: center;
  transform-box: fill-box;
  animation: pip-bloom 220ms ease-out var(--delay, 0ms) both;
}

@keyframes pip-bloom {
  0%  { opacity: 0; transform: scale(0); }
  65% { opacity: 1; transform: scale(1.35); }
  100%{ opacity: 1; transform: scale(1); }
}
</style>
