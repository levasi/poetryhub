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
      class="ds-sheet"
      @keydown="onKeydown"
    >
      <button
        type="button"
        class="ds-sheet__backdrop"
        aria-label="Închide"
        @click="close"
      />

      <div
        ref="panelRef"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="title ? titleId : undefined"
        class="ds-sheet-panel"
      >
        <div
          class="ds-sheet__handle"
          aria-hidden="true"
        />

        <header class="ds-sheet__header">
          <h2
            v-if="title"
            :id="titleId"
            class="ds-sheet__title"
          >
            {{ title }}
          </h2>
          <div
            v-else
            class="ds-sheet__title-spacer"
          />
          <CloseButton
            label="Închide panoul"
            @click="close"
          />
        </header>

        <div class="ds-sheet__body pb-mobile-tab">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>
