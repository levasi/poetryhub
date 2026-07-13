<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })

const props = withDefaults(
  defineProps<{
    title?: string
    /** id prefix for aria-labelledby */
    idPrefix?: string
  }>(),
  { idPrefix: 'ds-sheet' },
)

const panelRef = ref<HTMLElement | null>(null)

const titleId = computed(() => `${props.idPrefix}-title`)

function close() {
  open.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
  }
}

watch(open, (isOpen) => {
  if (!import.meta.client) return
  if (isOpen) {
    document.body.style.overflow = 'hidden'
    nextTick(() => {
      const focusable = panelRef.value?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      focusable?.focus()
    })
  } else {
    document.body.style.overflow = ''
  }
})

onUnmounted(() => {
  if (import.meta.client) document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex"
      :class="[
        'md:justify-end md:items-stretch',
        'items-end justify-center',
      ]"
      @keydown="onKeydown"
    >
      <button
        type="button"
        class="absolute inset-0 bg-content/25 backdrop-blur-[1px]"
        aria-label="Închide"
        @click="close"
      />

      <div
        ref="panelRef"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="title ? titleId : undefined"
        class="ds-sheet-panel relative z-10 w-full max-h-[85dvh] rounded-t-ds-xl border-t border-edge-subtle md:h-full md:max-h-none md:w-[380px] md:max-w-[90vw] md:rounded-none md:border-l md:border-t-0"
      >
        <div
          class="mx-auto mb-3 mt-2 h-1 w-10 rounded-full bg-edge-strong md:hidden"
          aria-hidden="true"
        />

        <header class="flex items-center justify-between gap-3 border-b border-edge-subtle px-4 py-3 md:px-5">
          <h2
            v-if="title"
            :id="titleId"
            class="font-serif text-lg font-semibold tracking-tight text-content"
          >
            {{ title }}
          </h2>
          <div
            v-else
            class="flex-1"
          />
          <CloseButton
            label="Închide panoul"
            @click="close"
          />
        </header>

        <div class="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-5">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>
