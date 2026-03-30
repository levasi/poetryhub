import { _ as _sfc_main$1 } from './SearchBar-C4Xkzn-D.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-BHo5EKPq.mjs';
import { _ as _sfc_main$2 } from './PoetryCard-BDrc1LQe.mjs';
import { defineComponent, computed, mergeProps, unref, isRef, withCtx, createTextVNode, toDisplayString, ref, watch, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrRenderList } from 'vue/server-renderer';
import { a as useI18n, b as useSeoMeta, d as useRoute } from './server.mjs';
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
import './useFavorites-CibuQ2Wz.mjs';
import './useAuth-ClZa9bEg.mjs';
import './useTagLabel-DPQ2hw0Y.mjs';
import './authorAvatar-BAkG-5wq.mjs';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/plugins';
import 'unhead/utils';

function useSearch() {
  const { t } = useI18n();
  const query = ref("");
  const results = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const searched = ref(false);
  let debounceTimer = null;
  async function search(q) {
    var _a;
    const term = (q != null ? q : query.value).trim();
    if (!term) {
      results.value = [];
      searched.value = false;
      return;
    }
    loading.value = true;
    error.value = null;
    try {
      const res = await $fetch("/api/poems", {
        params: { search: term, limit: 30, page: 1 }
      });
      results.value = res.data;
      searched.value = true;
    } catch (err) {
      error.value = (_a = err.message) != null ? _a : t("search.error");
    } finally {
      loading.value = false;
    }
  }
  watch(query, (val) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (!val.trim()) {
      results.value = [];
      searched.value = false;
      return;
    }
    debounceTimer = setTimeout(() => search(val), 350);
  });
  function clear() {
    query.value = "";
    results.value = [];
    searched.value = false;
  }
  return { query, results, loading, error, searched, search, clear };
}
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "search",
  __ssrInlineRender: true,
  setup(__props) {
    const { t } = useI18n();
    useSeoMeta({ title: computed(() => t("seo.searchTitle")) });
    const { query, results, loading, error, searched, search, clear } = useSearch();
    useRoute();
    return (_ctx, _push, _parent, _attrs) => {
      const _component_SearchBar = _sfc_main$1;
      const _component_NuxtLink = __nuxt_component_0;
      const _component_PoetryCard = _sfc_main$2;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "animate-fade-in" }, _attrs))}><h1 class="mb-8 font-serif text-3xl font-bold text-ink-900">${ssrInterpolate(unref(t)("search.title"))}</h1><div class="w-full">`);
      _push(ssrRenderComponent(_component_SearchBar, {
        modelValue: unref(query),
        "onUpdate:modelValue": ($event) => isRef(query) ? query.value = $event : null,
        placeholder: unref(t)("search.placeholder"),
        autofocus: "",
        onSearch: unref(search),
        onClear: unref(clear)
      }, null, _parent));
      _push(`</div><div class="mt-10">`);
      if (unref(loading)) {
        _push(`<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><!--[-->`);
        ssrRenderList(6, (i) => {
          _push(`<div class="h-48 animate-pulse rounded-2xl bg-ink-200/80"></div>`);
        });
        _push(`<!--]--></div>`);
      } else if (unref(error)) {
        _push(`<div class="text-center text-red-600">${ssrInterpolate(unref(error))}</div>`);
      } else if (unref(searched) && !unref(results).length) {
        _push(`<div class="py-16 text-center"><p class="font-serif text-xl text-ink-600">${ssrInterpolate(unref(t)("search.noResults", { q: unref(query) }))}</p><p class="mt-2 text-sm text-ink-500">${ssrInterpolate(unref(t)("search.tryBrowse"))} `);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/poems",
          class: "underline hover:text-ink-800"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(unref(t)("search.category"))}`);
            } else {
              return [
                createTextVNode(toDisplayString(unref(t)("search.category")), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`. </p></div>`);
      } else if (unref(results).length) {
        _push(`<div><p class="mb-5 text-sm text-ink-600">${ssrInterpolate(unref(results).length === 1 ? unref(t)("search.oneResult", { q: unref(query) }) : unref(t)("search.manyResults", { q: unref(query), count: unref(results).length }))}</p><div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><!--[-->`);
        ssrRenderList(unref(results), (poem) => {
          _push(ssrRenderComponent(_component_PoetryCard, {
            key: poem.id,
            poem
          }, null, _parent));
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<div class="py-16 text-center"><p class="font-serif text-lg text-ink-600">${ssrInterpolate(unref(t)("search.prompt"))}</p></div>`);
      }
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/search.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=search-C--bEAmt.mjs.map
