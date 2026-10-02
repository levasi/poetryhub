<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] })

const { t } = useI18n()
useSeoMeta({ title: computed(() => t('seo.adminImport')) })

// ── PoetryDB import ──────────────────────────────────────────────────────────
const pdbLoading = ref(false)
const pdbCount = ref(20)
const pdbResult = ref<{ imported: number; skipped: number; errors: number } | null>(null)
const pdbError = ref('')

async function importPoetryDB() {
  pdbLoading.value = true
  pdbResult.value = null
  pdbError.value = ''
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
const roResult = ref<{ imported: number; skipped: number; errors: number } | null>(null)
const roError = ref('')

async function importRomanian() {
  roLoading.value = true
  roResult.value = null
  roError.value = ''
  try {
    roResult.value = await $fetch('/api/import/romanian', { method: 'POST' })
  } catch (err: unknown) {
    roError.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? String(err)
  } finally {
    roLoading.value = false
  }
}

// ── Bulk JSON import ─────────────────────────────────────────────────────────
const jsonText = ref('')
const jsonLoading = ref(false)
const jsonResult = ref<{ imported: number; skipped: number; errors: number } | null>(null)
const jsonError = ref('')

// Paste example (format illustration)
const jsonExample = JSON.stringify(
  [{ title: 'Ozymandias', content: 'I met a traveller from an antique land…', author: 'Percy Shelley', language: 'en', tags: ['classic', 'ruins'] }],
  null,
  2,
)

async function importJSON() {
  jsonLoading.value = true
  jsonResult.value = null
  jsonError.value = ''
  let parsed
  try {
    parsed = JSON.parse(jsonText.value)
  } catch {
    jsonError.value = t('admin.import.invalidJson')
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
<div class="admin-page">
    <h1 class="admin-page__title" style="margin-bottom:2rem">{{ t('admin.import.title') }}</h1>

    <!-- ── PoetryDB ────────────────────────────────────────────────────────── -->
    <section class="admin-page__section">
      <h2 class="admin-page__section-title">{{ t('admin.import.poetryDbTitle') }}</h2>
      <p class="admin-page__section-desc">{{ t('admin.import.poetryDbDesc') }}</p>

      <div class="admin-page__inline-field">
        <label class="admin-page__inline-label">{{ t('admin.import.poemsToImport') }}</label>
        <input v-model.number="pdbCount" type="number" min="1" max="100"
          class="admin-page__num-input" />
      </div>

      <button type="button" :disabled="pdbLoading"
        class="admin-page__btn-emerald"
        @click="importPoetryDB">
        {{ pdbLoading ? t('admin.import.importing') : t('admin.import.importFromPdb') }}
      </button>

      <div v-if="pdbResult"
        class="admin-page__result-box admin-page__result-box--ok">
        {{ formatResult(pdbResult) }}
      </div>
      <div v-if="pdbError" class="admin-page__result-box admin-page__result-box--err">
        {{ pdbError }}
      </div>
    </section>

    <!-- ── Romanian Classics ───────────────────────────────────────────────── -->
    <section class="admin-page__section">
      <h2 class="admin-page__section-title">{{ t('admin.import.roTitle') }}</h2>
      <p class="admin-page__section-desc">
        {{ t('admin.import.roDesc') }}
      </p>

      <button type="button" :disabled="roLoading"
        class="admin-page__btn-blue"
        @click="importRomanian">
        {{ roLoading ? t('admin.import.importing') : t('admin.import.roButton') }}
      </button>

      <div v-if="roResult" class="admin-page__result-box admin-page__result-box--ok">
        {{ formatResult(roResult) }}
      </div>
      <div v-if="roError" class="admin-page__result-box admin-page__result-box--err">
        {{ roError }}
      </div>
    </section>

    <!-- ── Bulk JSON ───────────────────────────────────────────────────────── -->
    <section class="admin-page__section admin-page__section--last">
      <h2 class="admin-page__section-title">{{ t('admin.import.jsonTitle') }}</h2>
      <p class="admin-page__section-desc">
        {{ t('admin.import.jsonDesc') }}
      </p>

      <textarea v-model="jsonText" rows="12"
        class="admin-page__json"
        :placeholder="jsonExample" />

      <button type="button" :disabled="jsonLoading || !jsonText.trim()"
        class="admin-page__btn-violet"
        @click="importJSON">
        {{ jsonLoading ? t('admin.import.importing') : t('admin.import.importJson') }}
      </button>

      <div v-if="jsonResult"
        class="admin-page__result-box admin-page__result-box--ok">
        {{ formatResult(jsonResult) }}
      </div>
      <div v-if="jsonError" class="admin-page__result-box admin-page__result-box--err">
        {{ jsonError }}
      </div>
    </section>
  </div>
</template>
