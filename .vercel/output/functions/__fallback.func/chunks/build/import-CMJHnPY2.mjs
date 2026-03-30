import { defineComponent, computed, ref, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderAttr, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import { a as useI18n, b as useSeoMeta } from './server.mjs';
import '../nitro/nitro.mjs';
import 'jose';
import '@prisma/client';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'vue-router';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/plugins';
import 'unhead/utils';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "import",
  __ssrInlineRender: true,
  setup(__props) {
    const { t } = useI18n();
    useSeoMeta({ title: computed(() => t("seo.adminImport")) });
    const pdbLoading = ref(false);
    const pdbCount = ref(20);
    const pdbResult = ref(null);
    const pdbError = ref("");
    const roLoading = ref(false);
    const roResult = ref(null);
    const roError = ref("");
    const jsonText = ref("");
    const jsonLoading = ref(false);
    const jsonResult = ref(null);
    const jsonError = ref("");
    const jsonExample = JSON.stringify(
      [{ title: "Ozymandias", content: "I met a traveller from an antique land\u2026", author: "Percy Shelley", language: "en", tags: ["classic", "ruins"] }],
      null,
      2
    );
    function formatResult(r) {
      return t("admin.import.resultLine", {
        imported: r.imported,
        skipped: r.skipped,
        errors: r.errors
      });
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "w-full" }, _attrs))}><h1 class="mb-8 font-serif text-2xl font-bold text-ink-900">${ssrInterpolate(unref(t)("admin.import.title"))}</h1><section class="mb-8 rounded-2xl border border-ink-200 bg-white p-6 shadow-sm"><h2 class="mb-1 font-serif text-lg font-bold text-ink-900">${ssrInterpolate(unref(t)("admin.import.poetryDbTitle"))}</h2><p class="mb-4 text-xs text-ink-600">${ssrInterpolate(unref(t)("admin.import.poetryDbDesc"))}</p><div class="mb-4 flex items-center gap-4"><label class="text-xs text-ink-600">${ssrInterpolate(unref(t)("admin.import.poemsToImport"))}</label><input${ssrRenderAttr("value", unref(pdbCount))} type="number" min="1" max="100" class="w-20 rounded-lg border border-ink-200 bg-ink-50 px-3 py-1.5 text-sm text-ink-900 outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-300/40"></div><button type="button"${ssrIncludeBooleanAttr(unref(pdbLoading)) ? " disabled" : ""} class="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">${ssrInterpolate(unref(pdbLoading) ? unref(t)("admin.import.importing") : unref(t)("admin.import.importFromPdb"))}</button>`);
      if (unref(pdbResult)) {
        _push(`<div class="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">${ssrInterpolate(formatResult(unref(pdbResult)))}</div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(pdbError)) {
        _push(`<div class="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">${ssrInterpolate(unref(pdbError))}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</section><section class="mb-8 rounded-2xl border border-ink-200 bg-white p-6 shadow-sm"><h2 class="mb-1 font-serif text-lg font-bold text-ink-900">${ssrInterpolate(unref(t)("admin.import.roTitle"))}</h2><p class="mb-4 text-xs text-ink-600">${ssrInterpolate(unref(t)("admin.import.roDesc"))}</p><button type="button"${ssrIncludeBooleanAttr(unref(roLoading)) ? " disabled" : ""} class="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">${ssrInterpolate(unref(roLoading) ? unref(t)("admin.import.importing") : unref(t)("admin.import.roButton"))}</button>`);
      if (unref(roResult)) {
        _push(`<div class="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">${ssrInterpolate(formatResult(unref(roResult)))}</div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(roError)) {
        _push(`<div class="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">${ssrInterpolate(unref(roError))}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</section><section class="rounded-2xl border border-ink-200 bg-white p-6 shadow-sm"><h2 class="mb-1 font-serif text-lg font-bold text-ink-900">${ssrInterpolate(unref(t)("admin.import.jsonTitle"))}</h2><p class="mb-4 text-xs text-ink-600">${ssrInterpolate(unref(t)("admin.import.jsonDesc"))}</p><textarea rows="12" class="mb-4 w-full rounded-lg border border-ink-200 bg-ink-50 px-3 py-2.5 font-mono text-xs text-ink-900 outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-300/40"${ssrRenderAttr("placeholder", unref(jsonExample))}>${ssrInterpolate(unref(jsonText))}</textarea><button type="button"${ssrIncludeBooleanAttr(unref(jsonLoading) || !unref(jsonText).trim()) ? " disabled" : ""} class="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50">${ssrInterpolate(unref(jsonLoading) ? unref(t)("admin.import.importing") : unref(t)("admin.import.importJson"))}</button>`);
      if (unref(jsonResult)) {
        _push(`<div class="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">${ssrInterpolate(formatResult(unref(jsonResult)))}</div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(jsonError)) {
        _push(`<div class="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">${ssrInterpolate(unref(jsonError))}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</section></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/admin/import.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=import-CMJHnPY2.mjs.map
