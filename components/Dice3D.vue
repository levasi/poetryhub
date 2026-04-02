<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    /** When true, plays a tumbling animation (e.g. while fetching). */
    rolling?: boolean
  }>(),
  { rolling: false },
)

const FACE_TO_FRONT = [
  { x: 0, y: 0 },
  { x: 0, y: 180 },
  { x: -90, y: 0 },
  { x: 90, y: 0 },
  { x: 0, y: -90 },
  { x: 0, y: 90 },
] as const

const Z_TWISTS = [0, 90, 180, 270] as const

function pickTargetEuler(): { x: number; y: number; z: number } {
  const f = FACE_TO_FRONT[Math.floor(Math.random() * FACE_TO_FRONT.length)]!
  const z = Z_TWISTS[Math.floor(Math.random() * Z_TWISTS.length)]!
  return { x: f.x, y: f.y, z }
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

/** Shortest angular delta in degrees toward `to` (wraps ±180°). */
function shortestDelta(from: number, to: number): number {
  const a = ((from % 360) + 360) % 360
  const b = ((to % 360) + 360) % 360
  let d = b - a
  if (d > 180) d -= 360
  if (d < -180) d += 360
  return d
}

function eulerNearlySame(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number },
  eps = 2,
): boolean {
  return (
    Math.abs(shortestDelta(a.x, b.x)) < eps
    && Math.abs(shortestDelta(a.y, b.y)) < eps
    && Math.abs(shortestDelta(a.z, b.z)) < eps
  )
}

function pickTargetDifferentFrom(cur: { x: number; y: number; z: number }): { x: number; y: number; z: number } {
  let next = pickTargetEuler()
  let guard = 0
  while (eulerNearlySame(cur, next) && guard++ < 40) {
    next = pickTargetEuler()
  }
  return next
}

const rx = ref(0)
const ry = ref(0)
const rz = ref(0)

const settling = ref(false)

const landedStyle = computed(() => ({
  transform: `rotateX(${rx.value}deg) rotateY(${ry.value}deg) rotateZ(${rz.value}deg)`,
}))

const reduceMotion = ref(false)
let mqListener: ((this: MediaQueryList, ev: MediaQueryListEvent) => void) | null = null
let motionMql: MediaQueryList | null = null

let rollRaf = 0
let settleRaf = 0
let lastFrameTime = 0

function cancelRoll() {
  if (rollRaf) {
    cancelAnimationFrame(rollRaf)
    rollRaf = 0
  }
}

function cancelSettle() {
  if (settleRaf) {
    cancelAnimationFrame(settleRaf)
    settleRaf = 0
  }
}

function rollLoop(now: number) {
  if (!props.rolling) return
  const dt = Math.min(1 / 30, Math.max(0, (now - lastFrameTime) / 1000))
  lastFrameTime = now

  const t = now * 0.001
  const slow = reduceMotion.value ? 0.32 : 1
  const wx = 1 + 0.11 * Math.sin(t * 1.55 + 0.3)
  const wy = 1 + 0.09 * Math.cos(t * 1.22 - 0.2)
  const wz = 1 + 0.07 * Math.sin(t * 1.8 + 1.1)

  rx.value += 255 * dt * wx * slow
  ry.value += 345 * dt * wy * slow
  rz.value += 140 * dt * wz * slow

  rollRaf = requestAnimationFrame(rollLoop)
}

function runSettle() {
  cancelSettle()
  settling.value = true

  const start = { x: rx.value, y: ry.value, z: rz.value }
  const end = pickTargetDifferentFrom(start)
  const duration = reduceMotion.value ? 420 : 720
  const t0 = performance.now()

  function settleLoop(now: number) {
    const u = Math.min(1, (now - t0) / duration)
    const e = easeOutCubic(u)
    rx.value = start.x + shortestDelta(start.x, end.x) * e
    ry.value = start.y + shortestDelta(start.y, end.y) * e
    rz.value = start.z + shortestDelta(start.z, end.z) * e

    if (u < 1) {
      settleRaf = requestAnimationFrame(settleLoop)
    } else {
      settling.value = false
      settleRaf = 0
    }
  }

  settleRaf = requestAnimationFrame(settleLoop)
}

watch(
  () => props.rolling,
  (isRolling, wasRolling) => {
    if (isRolling) {
      cancelSettle()
      settling.value = false
      lastFrameTime = performance.now()
      cancelRoll()
      rollRaf = requestAnimationFrame(rollLoop)
      return
    }
    if (wasRolling) {
      cancelRoll()
      rollRaf = 0
      runSettle()
    }
  },
)

onMounted(() => {
  const t = pickTargetEuler()
  rx.value = t.x
  ry.value = t.y
  rz.value = t.z

  if (typeof window !== 'undefined' && window.matchMedia) {
    motionMql = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduceMotion.value = motionMql.matches
    mqListener = () => {
      reduceMotion.value = motionMql!.matches
    }
    motionMql.addEventListener('change', mqListener)
  }
})

onUnmounted(() => {
  cancelRoll()
  cancelSettle()
  if (motionMql && mqListener) {
    motionMql.removeEventListener('change', mqListener)
  }
})
</script>

<template>
  <div class="dice-scene" aria-hidden="true">
    <div class="dice-landed" :style="landedStyle">
      <div
        class="dice-cube"
        :class="{
          'dice-cube--idle': !rolling && !settling && !reduceMotion,
          'dice-cube--idle-reduced': !rolling && !settling && reduceMotion,
        }"
      >
        <div class="face face-front">
          <div class="pip-grid pip-grid--1" />
        </div>
        <div class="face face-back">
          <div class="pip-grid pip-grid--6" />
        </div>
        <div class="face face-right">
          <div class="pip-grid pip-grid--3" />
        </div>
        <div class="face face-left">
          <div class="pip-grid pip-grid--4" />
        </div>
        <div class="face face-top">
          <div class="pip-grid pip-grid--2" />
        </div>
        <div class="face face-bottom">
          <div class="pip-grid pip-grid--5" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dice-scene {
  --dice-size: 2.5rem;
  --dice-half: calc(var(--dice-size) / 2);
  width: var(--dice-size);
  height: var(--dice-size);
  perspective: 15rem;
  perspective-origin: 50% 42%;
}

@media (min-width: 768px) {
  .dice-scene {
    --dice-size: 2.75rem;
  }
}

.dice-landed {
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  will-change: transform;
}

.dice-cube {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
}

.dice-cube--idle {
  animation: dice-idle 30s ease-in-out infinite;
}

.dice-cube--idle-reduced {
  transform: rotateX(-14deg) rotateY(20deg);
}

@keyframes dice-idle {
  0%,
  100% {
    transform: rotateX(-10deg) rotateY(-14deg) rotateZ(0deg);
  }
  33% {
    transform: rotateX(-6deg) rotateY(16deg) rotateZ(1.5deg);
  }
  66% {
    transform: rotateX(-15deg) rotateY(4deg) rotateZ(-1deg);
  }
}

.face {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.35rem;
  border: 1px solid rgb(203 200 194 / 0.95);
  background: linear-gradient(145deg, #fdfcfa 0%, #f0ebe3 45%, #e8e2d8 100%);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.85),
    inset 0 -1px 0 rgb(0 0 0 / 0.06);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.pip-grid {
  width: 72%;
  height: 72%;
  background-repeat: no-repeat;
  background-size: 26% 26%;
  --pip: radial-gradient(circle closest-side, #2d2a26 0 92%, transparent 93%);
}

.pip-grid--1 {
  background-image: var(--pip);
  background-position: center center;
}

.pip-grid--2 {
  background-image: var(--pip), var(--pip);
  background-position:
    15% 15%,
    85% 85%;
}

.pip-grid--3 {
  background-image: var(--pip), var(--pip), var(--pip);
  background-position:
    15% 15%,
    center center,
    85% 85%;
}

.pip-grid--4 {
  background-image: var(--pip), var(--pip), var(--pip), var(--pip);
  background-position:
    15% 15%,
    85% 15%,
    15% 85%,
    85% 85%;
}

.pip-grid--5 {
  background-image: var(--pip), var(--pip), var(--pip), var(--pip), var(--pip);
  background-position:
    15% 15%,
    85% 15%,
    center center,
    15% 85%,
    85% 85%;
}

.pip-grid--6 {
  background-image: var(--pip), var(--pip), var(--pip), var(--pip), var(--pip), var(--pip);
  background-position:
    22% 15%,
    22% 50%,
    22% 85%,
    78% 15%,
    78% 50%,
    78% 85%;
}

.face-front {
  transform: rotateY(0deg) translateZ(var(--dice-half));
}

.face-back {
  transform: rotateY(180deg) translateZ(var(--dice-half));
}

.face-right {
  transform: rotateY(90deg) translateZ(var(--dice-half));
}

.face-left {
  transform: rotateY(-90deg) translateZ(var(--dice-half));
}

.face-top {
  transform: rotateX(90deg) translateZ(var(--dice-half));
}

.face-bottom {
  transform: rotateX(-90deg) translateZ(var(--dice-half));
}
</style>
