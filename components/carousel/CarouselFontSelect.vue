<script setup lang="ts">
import type { ReaderFontKey } from '~/composables/useReaderPreferences'
import { READER_FONT_I18N_KEYS, READER_FONT_OPTIONS_ORDER } from '~/composables/useReaderPreferences'

const props = defineProps<{
  modelValue: ReaderFontKey
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ReaderFontKey]
}>()

const { t } = useI18n()

const fontOrder = READER_FONT_OPTIONS_ORDER as readonly ReaderFontKey[]

function onChange(e: Event) {
  const v = (e.target as HTMLSelectElement).value
  if (fontOrder.includes(v as ReaderFontKey)) {
    emit('update:modelValue', v as ReaderFontKey)
  }
}
</script>

<template>
  <select
    class="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-ink-900 outline-none focus:border-gold-500"
    :value="props.modelValue"
    @change="onChange"
  >
    <option v-for="key in READER_FONT_OPTIONS_ORDER" :key="key" :value="key">
      {{ t(READER_FONT_I18N_KEYS[key]) }}
    </option>
  </select>
</template>
