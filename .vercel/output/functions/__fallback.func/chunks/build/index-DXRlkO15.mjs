import { _ as __nuxt_component_0 } from './nuxt-link-BHo5EKPq.mjs';
import { _ as _sfc_main$1 } from './SearchBar-C4Xkzn-D.mjs';
import { _ as _sfc_main$2 } from './PaginationNav-CVj9bPmG.mjs';
import { defineComponent, computed, ref, withAsyncContext, watch, unref, withCtx, createTextVNode, toDisplayString, isRef, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrRenderList, ssrRenderAttr, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import { u as useTagLabel } from './useTagLabel-DPQ2hw0Y.mjs';
import { a as useI18n, b as useSeoMeta } from './server.mjs';
import { u as useFetch } from './fetch-B6hZG8jW.mjs';
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
import '@vue/shared';
import 'perfect-debounce';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const { t } = useI18n();
    const { labelForTag } = useTagLabel();
    useSeoMeta({ title: computed(() => t("seo.adminPoems")) });
    const page = ref(1);
    const search = ref("");
    const deleting = ref(null);
    const { data, refresh } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      "/api/poems",
      {
        params: computed(() => ({ page: page.value, limit: 20, search: search.value || void 0 }))
      },
      "$hGzK9oz4rI"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    let searchTimer;
    watch(search, () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        page.value = 1;
        refresh();
      }, 350);
    });
    watch(page, () => refresh());
    const poems = computed(() => {
      var _a, _b;
      return (_b = (_a = data.value) == null ? void 0 : _a.data) != null ? _b : [];
    });
    const meta = computed(() => {
      var _a;
      return (_a = data.value) == null ? void 0 : _a.meta;
    });
    const totalPages = computed(() => {
      var _a, _b;
      return (_b = (_a = meta.value) == null ? void 0 : _a.totalPages) != null ? _b : 1;
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_SearchBar = _sfc_main$1;
      const _component_PaginationNav = _sfc_main$2;
      _push(`<div${ssrRenderAttrs(_attrs)}><div class="mb-6 flex items-center justify-between"><h1 class="font-serif text-2xl font-bold text-ink-900">${ssrInterpolate(unref(t)("admin.poems.title"))}</h1>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/admin/poems/new",
        class: "rounded-lg bg-gold-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gold-700"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`${ssrInterpolate(unref(t)("admin.poems.new"))}`);
          } else {
            return [
              createTextVNode(toDisplayString(unref(t)("admin.poems.new")), 1)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="mb-4 w-full">`);
      _push(ssrRenderComponent(_component_SearchBar, {
        modelValue: unref(search),
        "onUpdate:modelValue": ($event) => isRef(search) ? search.value = $event : null,
        placeholder: unref(t)("admin.poems.searchPlaceholder")
      }, null, _parent));
      _push(`</div><div class="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-sm"><table class="w-full text-sm"><thead class="border-b border-ink-200 bg-ink-50"><tr><th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-500">${ssrInterpolate(unref(t)("admin.poems.colTitle"))}</th><th class="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-500 md:table-cell">${ssrInterpolate(unref(t)("admin.poems.colAuthor"))}</th><th class="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-500 lg:table-cell">${ssrInterpolate(unref(t)("admin.poems.colTags"))}</th><th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-500">${ssrInterpolate(unref(t)("admin.poems.colActions"))}</th></tr></thead><tbody class="divide-y divide-ink-100 bg-white"><!--[-->`);
      ssrRenderList(unref(poems), (poem) => {
        var _a;
        _push(`<tr class="hover:bg-ink-50"><td class="max-w-[280px] truncate px-4 py-3 font-medium text-ink-900"><div class="flex items-center gap-2">`);
        if (poem.featured) {
          _push(`<span class="h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500"${ssrRenderAttr("title", unref(t)("admin.poems.featuredTitle"))}></span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<span class="truncate">${ssrInterpolate(poem.title)}</span></div></td><td class="hidden px-4 py-3 text-ink-600 md:table-cell">${ssrInterpolate(poem.author.name)}</td><td class="hidden px-4 py-3 lg:table-cell"><div class="flex flex-wrap gap-1"><!--[-->`);
        ssrRenderList((_a = poem.poemTags) == null ? void 0 : _a.slice(0, 3), (pt) => {
          _push(`<span class="rounded-full bg-ink-100 px-2 py-0.5 text-xs text-ink-600">${ssrInterpolate(unref(labelForTag)(pt.tag.slug, pt.tag.name))}</span>`);
        });
        _push(`<!--]--></div></td><td class="px-4 py-3"><div class="flex items-center gap-2">`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: `/admin/poems/${poem.slug}`,
          class: "rounded px-2 py-1 text-xs text-ink-600 hover:bg-ink-100 hover:text-ink-900"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(unref(t)("admin.poems.edit"))}`);
            } else {
              return [
                createTextVNode(toDisplayString(unref(t)("admin.poems.edit")), 1)
              ];
            }
          }),
          _: 2
        }, _parent));
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: `/poems/${poem.slug}`,
          target: "_blank",
          class: "rounded px-2 py-1 text-xs text-ink-500 hover:bg-ink-100 hover:text-ink-800"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(unref(t)("admin.poems.view"))}`);
            } else {
              return [
                createTextVNode(toDisplayString(unref(t)("admin.poems.view")), 1)
              ];
            }
          }),
          _: 2
        }, _parent));
        _push(`<button type="button" class="rounded px-2 py-1 text-xs text-red-700 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"${ssrIncludeBooleanAttr(unref(deleting) === poem.slug) ? " disabled" : ""}>${ssrInterpolate(unref(deleting) === poem.slug ? unref(t)("admin.poems.deleting") : unref(t)("admin.poems.delete"))}</button></div></td></tr>`);
      });
      _push(`<!--]--></tbody></table>`);
      if (!unref(poems).length) {
        _push(`<div class="py-10 text-center text-sm text-ink-500">${ssrInterpolate(unref(t)("admin.poems.none"))}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (unref(totalPages) > 1) {
        _push(`<div class="mt-6">`);
        _push(ssrRenderComponent(_component_PaginationNav, {
          page: unref(page),
          "total-pages": unref(totalPages),
          "onUpdate:page": (p) => {
            page.value = p;
          }
        }, null, _parent));
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/admin/poems/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-DXRlkO15.mjs.map
