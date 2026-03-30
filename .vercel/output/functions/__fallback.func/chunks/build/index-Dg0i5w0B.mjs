import { _ as __nuxt_component_0 } from './nuxt-link-BHo5EKPq.mjs';
import { _ as _sfc_main$1 } from './SearchBar-C4Xkzn-D.mjs';
import { _ as _sfc_main$2 } from './PaginationNav-CVj9bPmG.mjs';
import { defineComponent, computed, ref, withAsyncContext, watch, unref, withCtx, createTextVNode, toDisplayString, isRef, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrRenderList, ssrIncludeBooleanAttr } from 'vue/server-renderer';
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
    useSeoMeta({ title: computed(() => t("seo.adminAuthors")) });
    const page = ref(1);
    const search = ref("");
    const deleting = ref(null);
    const { data, refresh } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      "/api/authors",
      {
        params: computed(() => ({ page: page.value, limit: 20, search: search.value || void 0 }))
      },
      "$jn7K4flWuP"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    let timer;
    watch(search, () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        page.value = 1;
        refresh();
      }, 350);
    });
    watch(page, () => refresh());
    const authors = computed(() => {
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
      _push(`<div${ssrRenderAttrs(_attrs)}><div class="mb-6 flex items-center justify-between"><h1 class="font-serif text-2xl font-bold text-ink-900">${ssrInterpolate(unref(t)("admin.authors.title"))}</h1>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/admin/authors/new",
        class: "rounded-lg bg-gold-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gold-700"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`${ssrInterpolate(unref(t)("admin.authors.new"))}`);
          } else {
            return [
              createTextVNode(toDisplayString(unref(t)("admin.authors.new")), 1)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="mb-4 w-full">`);
      _push(ssrRenderComponent(_component_SearchBar, {
        modelValue: unref(search),
        "onUpdate:modelValue": ($event) => isRef(search) ? search.value = $event : null,
        placeholder: unref(t)("admin.authors.searchPlaceholder")
      }, null, _parent));
      _push(`</div><div class="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-sm"><table class="w-full text-sm"><thead class="border-b border-ink-200 bg-ink-50"><tr><th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-500">${ssrInterpolate(unref(t)("admin.authors.colName"))}</th><th class="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-500 md:table-cell">${ssrInterpolate(unref(t)("admin.authors.colNationality"))}</th><th class="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-500 sm:table-cell">${ssrInterpolate(unref(t)("admin.authors.colPoems"))}</th><th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-500">${ssrInterpolate(unref(t)("admin.authors.colActions"))}</th></tr></thead><tbody class="divide-y divide-ink-100 bg-white"><!--[-->`);
      ssrRenderList(unref(authors), (author) => {
        var _a, _b, _c;
        _push(`<tr class="hover:bg-ink-50"><td class="px-4 py-3 font-medium text-ink-900">${ssrInterpolate(author.name)}</td><td class="hidden px-4 py-3 text-ink-600 md:table-cell">${ssrInterpolate((_a = author.nationality) != null ? _a : "\u2014")}</td><td class="hidden px-4 py-3 text-ink-600 sm:table-cell">${ssrInterpolate((_c = (_b = author._count) == null ? void 0 : _b.poems) != null ? _c : 0)}</td><td class="px-4 py-3"><div class="flex gap-2">`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: `/admin/authors/${author.slug}`,
          class: "rounded px-2 py-1 text-xs text-ink-600 hover:bg-ink-100 hover:text-ink-900"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(unref(t)("admin.authors.edit"))}`);
            } else {
              return [
                createTextVNode(toDisplayString(unref(t)("admin.authors.edit")), 1)
              ];
            }
          }),
          _: 2
        }, _parent));
        _push(`<button type="button" class="rounded px-2 py-1 text-xs text-red-700 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"${ssrIncludeBooleanAttr(unref(deleting) === author.slug) ? " disabled" : ""}>${ssrInterpolate(unref(deleting) === author.slug ? unref(t)("admin.poems.deleting") : unref(t)("admin.authors.delete"))}</button></div></td></tr>`);
      });
      _push(`<!--]--></tbody></table>`);
      if (!unref(authors).length) {
        _push(`<div class="py-10 text-center text-sm text-ink-500">${ssrInterpolate(unref(t)("admin.authors.none"))}</div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/admin/authors/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-Dg0i5w0B.mjs.map
