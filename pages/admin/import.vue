<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] })

const { t } = useI18n()
useSeoMeta({ title: computed(() => t('seo.adminImport')) })

// ── PoetryDB import ──────────────────────────────────────────────────────────
const pdbLoading = ref(false)
const pdbCount   = ref(20)
const pdbResult  = ref<{ imported: number; skipped: number; errors: number } | null>(null)
const pdbError   = ref('')

async function importPoetryDB() {
  pdbLoading.value = true
  pdbResult.value  = null
  pdbError.value   = ''
  try {
    pdbResult.value = await $fetch('/api/import/poetrydb', {
      method: 'POST',
      body: { count: pdbCount.value },
    })
  } catch (err: unknown) {
    pdbError.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? String(err)
  } finally {
    pdbLoading.value = false
  }
}

// ── Romanian classics import ─────────────────────────────────────────────────
const roLoading = ref(false)
const roResult  = ref<{ imported: number; skipped: number; errors: number } | null>(null)
const roError   = ref('')

async function importRomanian() {
  roLoading.value = true
  roResult.value  = null
  roError.value   = ''
  try {
    roResult.value = await $fetch('/api/import/romanian', { method: 'POST' })
  } catch (err: unknown) {
    roError.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? String(err)
  } finally {
    roLoading.value = false
  }
}

// ── Bulk JSON import ─────────────────────────────────────────────────────────
const jsonText   = ref('')
const jsonLoading = ref(false)
const jsonResult  = ref<{ imported: number; skipped: number; errors: number } | null>(null)
const jsonError   = ref('')

// Paste example (format illustration)
const jsonExample = JSON.stringify(
  [{ title: 'Ozymandias', content: 'I met a traveller from an antique land…', author: 'Percy Shelley', language: 'en', tags: ['classic', 'ruins'] }],
  null,
  2,
)

async function importJSON() {
  jsonLoading.value = true
  jsonResult.value  = null
  jsonError.value   = ''
  let parsed
  try {
    parsed = JSON.parse(jsonText.value)
  } catch {
    jsonError.value   = t('admin.import.invalidJson')
    jsonLoading.value = false
    return
  }
  try {
    jsonResult.value = await $fetch('/api/import/bulk', { method: 'POST', body: parsed })
  } catch (err: unknown) {
    jsonError.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? String(err)
  } finally {
    jsonLoading.value = false
  }
}

function formatResult(r: { imported: number; skipped: number; errors: number }) {
  return t('admin.import.resultLine', {
    imported: r.imported,
    skipped: r.skipped,
    errors: r.errors,
  })
}
</script>

<template>
  <div class="w-full">
    <h1 class="mb-8 font-serif text-2xl font-bold text-ink-900">{{ t('admin.import.title') }}</h1>

    <!-- ── PoetryDB ────────────────────────────────────────────────────────── -->
    <section class="mb-8 rounded-2xl border border-ink-200 bg-white p-6 shadow-sm">
      <h2 class="mb-1 font-serif text-lg font-bold text-ink-900">{{ t('admin.import.poetryDbTitle') }}</h2>
      <p class="mb-4 text-xs text-ink-600">{{ t('admin.import.poetryDbDesc') }}</p>

      <div class="mb-4 flex items-center gap-4">
        <label class="text-xs text-ink-600">{{ t('admin.import.poemsToImport') }}</label>
        <input
          v-model.number="pdbCount"
          type="number"
          min="1"
          max="100"
          class="w-20 rounded-lg border border-ink-200 bg-ink-50 px-3 py-1.5 text-sm text-ink-900 outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-300/40"
        />
      </div>

      <button
        type="button"
        :disabled="pdbLoading"
        class="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        @click="importPoetryDB"
      >
        {{ pdbLoading ? t('admin.import.importing') : t('admin.import.importFromPdb') }}
      </button>

      <div v-if="pdbResult" class="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
        {{ formatResult(pdbResult) }}
      </div>
      <div v-if="pdbError" class="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        {{ pdbError }}
      </div>
    </section>

    <!-- ── Romanian Classics ───────────────────────────────────────────────── -->
    <section class="mb-8 rounded-2xl border border-ink-200 bg-white p-6 shadow-sm">
      <h2 class="mb-1 font-serif text-lg font-bold text-ink-900">{{ t('admin.import.roTitle') }}</h2>
      <p class="mb-4 text-xs text-ink-600">
        {{ t('admin.import.roDesc') }}
      </p>

      <button
        type="button"
        :disabled="roLoading"
        class="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        @click="importRomanian"
      >
        {{ roLoading ? t('admin.import.importing') : t('admin.import.roButton') }}
      </button>

      <div v-if="roResult" class="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
        {{ formatResult(roResult) }}
      </div>
      <div v-if="roError" class="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        {{ roError }}
      </div>
    </section>

    <!-- ── Bulk JSON ───────────────────────────────────────────────────────── -->
    <section class="rounded-2xl border border-ink-200 bg-white p-6 shadow-sm">
      <h2 class="mb-1 font-serif text-lg font-bold text-ink-900">{{ t('admin.import.jsonTitle') }}</h2>
      <p class="mb-4 text-xs text-ink-600">
        {{ t('admin.import.jsonDesc') }}
      </p>

      <textarea
        v-model="jsonText"
        rows="12"
        class="mb-4 w-full rounded-lg border border-ink-200 bg-ink-50 px-3 py-2.5 font-mono text-xs text-ink-900 outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-300/40"
        :placeholder="jsonExample"
      />

      <button
        type="button"
        :disabled="jsonLoading || !jsonText.trim()"
        class="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
        @click="importJSON"
      >
        {{ jsonLoading ? t('admin.import.importing') : t('admin.import.importJson') }}
      </button>

      <div v-if="jsonResult" class="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
        {{ formatResult(jsonResult) }}
      </div>
      <div v-if="jsonError" class="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        {{ jsonError }}
      </div>
    </section>
  </div>
</template>
