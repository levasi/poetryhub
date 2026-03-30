import { _ as _sfc_main$4 } from './TagBadge-Da4rTycV.mjs';
import { defineComponent, computed, withAsyncContext, watch, ref, mergeProps, unref, reactive, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderClass, ssrRenderAttr, ssrRenderComponent, ssrRenderList, ssrRenderTeleport } from 'vue/server-renderer';
import { a as useI18n, b as useSeoMeta, d as useRoute, c as useRouter } from './server.mjs';
import { _ as _sfc_main$2 } from './PoetryCard-BDrc1LQe.mjs';
import { _ as _sfc_main$3 } from './PaginationNav-CVj9bPmG.mjs';
import { a as usePoems } from './usePoems-CKpnvTjR.mjs';
import { u as useTagLabel } from './useTagLabel-DPQ2hw0Y.mjs';
import { u as useFetch } from './fetch-B6hZG8jW.mjs';
import { _ as _export_sfc } from './_plugin-vue_export-helper-1tPrXgE0.mjs';
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
import './nuxt-link-BHo5EKPq.mjs';
import './useFavorites-CibuQ2Wz.mjs';
import './useAuth-ClZa9bEg.mjs';
import './authorAvatar-BAkG-5wq.mjs';
import '@vue/shared';
import 'perfect-debounce';

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "FilterPanel",
  __ssrInlineRender: true,
  props: {
    moodTags: {},
    themeTags: {},
    languages: {},
    filters: {},
    hasActiveFilters: { type: Boolean }
  },
  emits: ["apply", "clear"],
  setup(__props, { emit: __emit }) {
    const { t } = useI18n();
    const emit = __emit;
    const sources = computed(() => [
      { value: "classic", label: t("filters.classic") },
      { value: "imported", label: t("filters.imported") },
      { value: "ai-generated", label: t("filters.ai") }
    ]);
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b;
      const _component_TagBadge = _sfc_main$4;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-6" }, _attrs))}>`);
      if ((_a = __props.moodTags) == null ? void 0 : _a.length) {
        _push(`<div><p class="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-600">${ssrInterpolate(unref(t)("filters.mood"))}</p><div class="flex flex-wrap gap-1.5"><!--[-->`);
        ssrRenderList(__props.moodTags, (tag) => {
          _push(ssrRenderComponent(_component_TagBadge, {
            key: tag.id,
            name: tag.name,
            slug: tag.slug,
            link: false,
            color: tag.color,
            active: __props.filters.tag === tag.slug,
            clickable: "",
            onClick: ($event) => emit("apply", { tag: __props.filters.tag === tag.slug ? void 0 : tag.slug })
          }, null, _parent));
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if ((_b = __props.themeTags) == null ? void 0 : _b.length) {
        _push(`<div><p class="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-600">${ssrInterpolate(unref(t)("filters.theme"))}</p><div class="flex flex-wrap gap-1.5"><!--[-->`);
        ssrRenderList(__props.themeTags, (tag) => {
          _push(ssrRenderComponent(_component_TagBadge, {
            key: tag.id,
            name: tag.name,
            slug: tag.slug,
            link: false,
            color: tag.color,
            active: __props.filters.tag === tag.slug,
            clickable: "",
            onClick: ($event) => emit("apply", { tag: __props.filters.tag === tag.slug ? void 0 : tag.slug })
          }, null, _parent));
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div><p class="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-600">${ssrInterpolate(unref(t)("filters.language"))}</p><div class="flex flex-wrap gap-1.5"><!--[-->`);
      ssrRenderList(__props.languages, (lang) => {
        _push(ssrRenderComponent(_component_TagBadge, {
          key: lang.value,
          name: lang.label,
          active: __props.filters.language === lang.value,
          clickable: "",
          onClick: ($event) => emit("apply", { language: __props.filters.language === lang.value ? void 0 : lang.value })
        }, null, _parent));
      });
      _push(`<!--]--></div></div><div><p class="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-600">${ssrInterpolate(unref(t)("filters.source"))}</p><div class="flex flex-wrap gap-1.5"><!--[-->`);
      ssrRenderList(unref(sources), (src) => {
        _push(ssrRenderComponent(_component_TagBadge, {
          key: src.value,
          name: src.label,
          active: __props.filters.source === src.value,
          clickable: "",
          onClick: ($event) => emit("apply", { source: __props.filters.source === src.value ? void 0 : src.value })
        }, null, _parent));
      });
      _push(`<!--]--></div></div>`);
      if (__props.hasActiveFilters) {
        _push(`<button class="w-full rounded-lg border border-ink-200 bg-white py-2 text-xs text-ink-600 shadow-sm transition-colors hover:border-ink-300 hover:text-ink-900">${ssrInterpolate(unref(t)("filters.clearAllFilters"))}</button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/FilterPanel.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
function useFilters() {
  const route = useRoute();
  const router = useRouter();
  const filters = reactive({
    tag: route.query.tag || void 0,
    language: route.query.language || void 0,
    source: route.query.source || void 0,
    author: route.query.author || void 0,
    search: route.query.search || void 0,
    page: route.query.page ? parseInt(route.query.page) : 1
  });
  function applyFilters(newFilters) {
    Object.assign(filters, { ...newFilters, page: 1 });
    const q = {};
    if (filters.tag) q.tag = filters.tag;
    if (filters.language) q.language = filters.language;
    if (filters.source) q.source = filters.source;
    if (filters.author) q.author = filters.author;
    if (filters.search) q.search = filters.search;
    router.push({ query: q });
  }
  function clearFilters() {
    Object.assign(filters, { tag: void 0, language: void 0, source: void 0, author: void 0, search: void 0, page: 1 });
    router.push({ query: {} });
  }
  const hasActiveFilters = computed(
    () => !!(filters.tag || filters.language || filters.source || filters.author || filters.search)
  );
  return { filters, applyFilters, clearFilters, hasActiveFilters };
}
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  async setup(__props) {
    var _a;
    let __temp, __restore;
    const { t } = useI18n();
    const { labelForTag } = useTagLabel();
    useSeoMeta({ title: computed(() => t("seo.poemsTitle")) });
    const { filters, applyFilters, clearFilters, hasActiveFilters } = useFilters();
    const { poems, meta, totalPages, loading, fetch } = usePoems(filters);
    const { data: moodTags } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      "/api/tags",
      { params: { category: "mood" } },
      "$7bgmmg7lKl"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    const { data: themeTags } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      "/api/tags",
      { params: { category: "theme" } },
      "$PtNcIA1AFT"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    [__temp, __restore] = withAsyncContext(() => fetch()), await __temp, __restore();
    watch(filters, () => fetch(), { deep: true });
    function onPageChange(page) {
      fetch({ page });
    }
    const languages = computed(() => [
      { value: "en", label: t("lang.en") },
      { value: "ro", label: t("lang.ro") },
      { value: "fr", label: t("lang.fr") },
      { value: "de", label: t("lang.de") },
      { value: "es", label: t("lang.es") }
    ]);
    const viewMode = ref("grid");
    const filterOpen = ref(false);
    const searchQuery = ref((_a = filters.search) != null ? _a : "");
    const debouncedSearch = ref(searchQuery.value);
    let searchTimer;
    watch(searchQuery, (val) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        debouncedSearch.value = val;
        applyFilters({ search: val || void 0, page: 1 });
      }, 350);
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a2, _b, _c, _d;
      const _component_FilterPanel = _sfc_main$1;
      const _component_PoetryCard = _sfc_main$2;
      const _component_PaginationNav = _sfc_main$3;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "animate-fade-in" }, _attrs))} data-v-b61a8b88><div class="mb-6 flex items-center justify-between" data-v-b61a8b88><div data-v-b61a8b88><h1 class="font-serif text-3xl font-bold text-ink-900" data-v-b61a8b88>${ssrInterpolate(unref(t)("poems.title"))}</h1><p class="mt-0.5 text-sm text-ink-600" data-v-b61a8b88>${ssrInterpolate(unref(t)("poems.count", (_b = (_a2 = unref(meta)) == null ? void 0 : _a2.total) != null ? _b : 0))}</p></div><div class="flex items-center gap-2" data-v-b61a8b88><button class="flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs text-ink-600 shadow-sm transition-colors hover:border-ink-300 hover:text-ink-900 md:hidden" data-v-b61a8b88><svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" data-v-b61a8b88><path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" data-v-b61a8b88></path></svg> ${ssrInterpolate(unref(t)("poems.filters"))} `);
      if (unref(hasActiveFilters)) {
        _push(`<span class="h-1.5 w-1.5 rounded-full bg-gold-400" data-v-b61a8b88></span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</button><div class="hidden items-center overflow-hidden rounded-lg border border-ink-200 bg-white shadow-sm sm:flex" data-v-b61a8b88><button class="${ssrRenderClass([unref(viewMode) === "grid" ? "bg-ink-100 text-ink-900" : "text-ink-500 hover:text-ink-800", "rounded-l-lg px-2.5 py-2 text-xs transition-colors"])}"${ssrRenderAttr("aria-label", unref(t)("poems.gridView"))} data-v-b61a8b88><svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" data-v-b61a8b88><path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" data-v-b61a8b88></path></svg></button><button class="${ssrRenderClass([unref(viewMode) === "list" ? "bg-ink-100 text-ink-900" : "text-ink-500 hover:text-ink-800", "rounded-r-lg px-2.5 py-2 text-xs transition-colors"])}"${ssrRenderAttr("aria-label", unref(t)("poems.listView"))} data-v-b61a8b88><svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" data-v-b61a8b88><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" data-v-b61a8b88></path></svg></button></div></div></div><div class="relative mb-8" data-v-b61a8b88><svg class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" data-v-b61a8b88><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" data-v-b61a8b88></path></svg><input${ssrRenderAttr("value", unref(searchQuery))} type="text"${ssrRenderAttr("placeholder", unref(t)("poems.searchPlaceholder"))} class="w-full rounded-xl border border-ink-200 bg-white py-3 pl-10 pr-10 text-sm text-ink-900 placeholder-ink-400 shadow-sm outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-300/40" data-v-b61a8b88>`);
      if (unref(searchQuery)) {
        _push(`<button class="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700" data-v-b61a8b88><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" data-v-b61a8b88><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" data-v-b61a8b88></path></svg></button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="grid gap-8 md:grid-cols-[200px,1fr]" data-v-b61a8b88><aside class="hidden space-y-6 md:block" data-v-b61a8b88>`);
      _push(ssrRenderComponent(_component_FilterPanel, {
        "mood-tags": unref(moodTags),
        "theme-tags": unref(themeTags),
        languages: unref(languages),
        filters: unref(filters),
        "has-active-filters": unref(hasActiveFilters),
        onApply: unref(applyFilters),
        onClear: unref(clearFilters)
      }, null, _parent));
      _push(`</aside><div data-v-b61a8b88>`);
      if (unref(hasActiveFilters)) {
        _push(`<div class="mb-5 flex flex-wrap gap-2" data-v-b61a8b88><span class="text-xs text-ink-600 self-center" data-v-b61a8b88>${ssrInterpolate(unref(t)("poems.filteredBy"))}</span>`);
        if (unref(filters).tag) {
          _push(`<button class="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-900 hover:bg-amber-100" data-v-b61a8b88>${ssrInterpolate(unref(labelForTag)(unref(filters).tag, unref(filters).tag))} \u2715 </button>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(filters).language) {
          _push(`<button class="flex items-center gap-1 rounded-full border border-ink-200 bg-white px-3 py-1 text-xs text-ink-700 shadow-sm hover:bg-ink-50" data-v-b61a8b88>${ssrInterpolate(unref(filters).language)} \u2715 </button>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(filters).source) {
          _push(`<button class="flex items-center gap-1 rounded-full border border-ink-200 bg-white px-3 py-1 text-xs text-ink-700 shadow-sm hover:bg-ink-50" data-v-b61a8b88>${ssrInterpolate(unref(filters).source)} \u2715 </button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<button class="text-xs text-ink-600 underline hover:text-ink-900" data-v-b61a8b88>${ssrInterpolate(unref(t)("poems.clearAll"))}</button></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(loading)) {
        _push(`<!--[-->`);
        if (unref(viewMode) === "grid") {
          _push(`<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-v-b61a8b88><!--[-->`);
          ssrRenderList(9, (i) => {
            _push(`<div class="h-52 animate-pulse rounded-2xl bg-ink-200/80" data-v-b61a8b88></div>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<div class="space-y-1" data-v-b61a8b88><!--[-->`);
          ssrRenderList(9, (i) => {
            _push(`<div class="h-20 animate-pulse rounded-xl bg-ink-200/60" data-v-b61a8b88></div>`);
          });
          _push(`<!--]--></div>`);
        }
        _push(`<!--]-->`);
      } else if (!unref(poems).length) {
        _push(`<div class="py-20 text-center" data-v-b61a8b88><p class="font-serif text-xl text-ink-600" data-v-b61a8b88>${ssrInterpolate(unref(t)("poems.noPoems"))}</p>`);
        if (unref(hasActiveFilters)) {
          _push(`<button class="mt-3 text-sm text-ink-600 underline hover:text-ink-900" data-v-b61a8b88>${ssrInterpolate(unref(t)("poems.clearFilters"))}</button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else if (unref(viewMode) === "grid") {
        _push(`<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-v-b61a8b88><!--[-->`);
        ssrRenderList(unref(poems), (poem) => {
          _push(ssrRenderComponent(_component_PoetryCard, {
            key: poem.id,
            poem,
            view: "grid"
          }, null, _parent));
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<div class="divide-y divide-ink-200/80" data-v-b61a8b88><!--[-->`);
        ssrRenderList(unref(poems), (poem) => {
          _push(ssrRenderComponent(_component_PoetryCard, {
            key: poem.id,
            poem,
            view: "list"
          }, null, _parent));
        });
        _push(`<!--]--></div>`);
      }
      if (unref(totalPages) > 1) {
        _push(`<div class="mt-10" data-v-b61a8b88>`);
        _push(ssrRenderComponent(_component_PaginationNav, {
          page: (_d = (_c = unref(meta)) == null ? void 0 : _c.page) != null ? _d : 1,
          "total-pages": unref(totalPages),
          loading: unref(loading),
          "onUpdate:page": onPageChange
        }, null, _parent));
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
      ssrRenderTeleport(_push, (_push2) => {
        if (unref(filterOpen)) {
          _push2(`<div class="fixed inset-0 z-50 flex md:hidden" data-v-b61a8b88><div class="absolute inset-0 bg-ink-900/30 backdrop-blur-[2px]" data-v-b61a8b88></div><div class="relative ml-auto h-full w-72 overflow-y-auto border-l border-ink-200 bg-white p-6 shadow-2xl" data-v-b61a8b88><div class="mb-6 flex items-center justify-between" data-v-b61a8b88><h2 class="font-serif text-lg font-bold text-ink-900" data-v-b61a8b88>${ssrInterpolate(unref(t)("poems.filters"))}</h2><button type="button" class="text-ink-500 hover:text-ink-800"${ssrRenderAttr("aria-label", unref(t)("a11y.closeFilters"))} data-v-b61a8b88><svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" data-v-b61a8b88><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" data-v-b61a8b88></path></svg></button></div>`);
          _push2(ssrRenderComponent(_component_FilterPanel, {
            "mood-tags": unref(moodTags),
            "theme-tags": unref(themeTags),
            languages: unref(languages),
            filters: unref(filters),
            "has-active-filters": unref(hasActiveFilters),
            onApply: (f) => {
              unref(applyFilters)(f);
              filterOpen.value = false;
            },
            onClear: () => {
              unref(clearFilters)();
              filterOpen.value = false;
            }
          }, null, _parent));
          _push2(`</div></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/poems/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-b61a8b88"]]);

export { index as default };
//# sourceMappingURL=index-B1nfOWIy.mjs.map
