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
  <form
    class="search-bar"
    @submit.prevent="onSubmit"
  >
    <svg
      class="search-bar__icon"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>

    <input
      ref="input"
      v-model="value"
      type="text"
      :placeholder="placeholder ?? t('search.placeholder')"
      class="search-bar__input"
    >

    <CloseButton
      v-if="value"
      class="search-bar__clear"
      :label="t('search.clear')"
      @click="clear"
    />
  </form>
</template>
