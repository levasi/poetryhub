<script setup lang="ts">
const { t } = useI18n()

const props = defineProps<{
  modelValue?: string
  placeholder?: string
  autofocus?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: [value: string]
  clear: []
}>()

const input = ref<HTMLInputElement | null>(null)

const value = computed({
  get: () => props.modelValue ?? '',
  set: (v) => emit('update:modelValue', v),
})

function onSubmit() {
  emit('search', value.value)
}

function clear() {
  value.value = ''
  emit('clear')
  nextTick(() => input.value?.focus())
}

onMounted(() => {
  if (props.autofocus) input.value?.focus()
})
</script>

<template>
  <form class="relative w-full" @submit.prevent="onSubmit">
    <!-- Search icon -->
    <svg
      class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-content-soft"
      fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>

    <input
      ref="input"
      v-model="value"
      type="text"
      :placeholder="placeholder ?? t('search.placeholder')"
      class="w-full rounded-full border border-edge-subtle bg-surface-raised py-3 pl-11 pr-10 text-sm text-content placeholder-content-soft shadow-ds-card outline-none ring-0 transition-colors focus:border-brand focus:ring-2 focus:ring-brand/25"
    />

    <!-- Clear button -->
    <button
      v-if="value"
      type="button"
      class="absolute right-4 top-1/2 -translate-y-1/2 text-content-soft hover:text-content-secondary"
      @click="clear"
    >
      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </form>
</template>
