import { _ as __nuxt_component_0 } from './nuxt-link-BHo5EKPq.mjs';
import { defineComponent, computed, withAsyncContext, unref, withCtx, createVNode, openBlock, createBlock, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent } from 'vue/server-renderer';
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
    useSeoMeta({ title: computed(() => t("seo.adminDashboard")) });
    const { data: poemStats } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      "/api/poems",
      { params: { limit: 1 } },
      "$xf38fvuzcB"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    const { data: authorStats } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      "/api/authors",
      { params: { limit: 1 } },
      "$VyGac_csQ_"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    const { data: tags } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      "/api/tags",
      "$CqhW9ojZoY"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    const totalPoems = computed(() => {
      var _a, _b, _c;
      return (_c = (_b = (_a = poemStats.value) == null ? void 0 : _a.meta) == null ? void 0 : _b.total) != null ? _c : 0;
    });
    const totalAuthors = computed(() => {
      var _a, _b, _c;
      return (_c = (_b = (_a = authorStats.value) == null ? void 0 : _a.meta) == null ? void 0 : _b.total) != null ? _c : 0;
    });
    const totalTags = computed(() => {
      var _a, _b;
      return (_b = (_a = tags.value) == null ? void 0 : _a.length) != null ? _b : 0;
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(_attrs)}><h1 class="mb-8 font-serif text-3xl font-bold text-ink-900">${ssrInterpolate(unref(t)("admin.dashboard"))}</h1><div class="mb-10 grid gap-4 sm:grid-cols-3"><div class="rounded-2xl border border-ink-200 bg-white p-6 shadow-sm"><p class="text-xs font-medium uppercase tracking-widest text-ink-500">${ssrInterpolate(unref(t)("admin.stats.totalPoems"))}</p><p class="mt-2 font-serif text-4xl font-bold text-gold-700">${ssrInterpolate(unref(totalPoems))}</p></div><div class="rounded-2xl border border-ink-200 bg-white p-6 shadow-sm"><p class="text-xs font-medium uppercase tracking-widest text-ink-500">${ssrInterpolate(unref(t)("admin.stats.authors"))}</p><p class="mt-2 font-serif text-4xl font-bold text-ink-900">${ssrInterpolate(unref(totalAuthors))}</p></div><div class="rounded-2xl border border-ink-200 bg-white p-6 shadow-sm"><p class="text-xs font-medium uppercase tracking-widest text-ink-500">${ssrInterpolate(unref(t)("admin.stats.tags"))}</p><p class="mt-2 font-serif text-4xl font-bold text-ink-900">${ssrInterpolate(unref(totalTags))}</p></div></div><div class="grid gap-4 sm:grid-cols-2">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/admin/poems/new",
        class: "flex items-center gap-4 rounded-2xl border border-ink-200 bg-white p-5 shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-50/50"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800"${_scopeId}><svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"${_scopeId}></path></svg></div><div${_scopeId}><p class="font-medium text-ink-900"${_scopeId}>${ssrInterpolate(unref(t)("admin.quick.newPoem"))}</p><p class="text-xs text-ink-500"${_scopeId}>${ssrInterpolate(unref(t)("admin.quick.newPoemDesc"))}</p></div>`);
          } else {
            return [
              createVNode("div", { class: "flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800" }, [
                (openBlock(), createBlock("svg", {
                  class: "h-5 w-5",
                  fill: "none",
                  viewBox: "0 0 24 24",
                  stroke: "currentColor",
                  "stroke-width": "2"
                }, [
                  createVNode("path", {
                    "stroke-linecap": "round",
                    "stroke-linejoin": "round",
                    d: "M12 4v16m8-8H4"
                  })
                ]))
              ]),
              createVNode("div", null, [
                createVNode("p", { class: "font-medium text-ink-900" }, toDisplayString(unref(t)("admin.quick.newPoem")), 1),
                createVNode("p", { class: "text-xs text-ink-500" }, toDisplayString(unref(t)("admin.quick.newPoemDesc")), 1)
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/admin/authors/new",
        class: "flex items-center gap-4 rounded-2xl border border-ink-200 bg-white p-5 shadow-sm transition-colors hover:border-violet-200 hover:bg-violet-50/50"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-800"${_scopeId}><svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"${_scopeId}></path></svg></div><div${_scopeId}><p class="font-medium text-ink-900"${_scopeId}>${ssrInterpolate(unref(t)("admin.quick.newAuthor"))}</p><p class="text-xs text-ink-500"${_scopeId}>${ssrInterpolate(unref(t)("admin.quick.newAuthorDesc"))}</p></div>`);
          } else {
            return [
              createVNode("div", { class: "flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-800" }, [
                (openBlock(), createBlock("svg", {
                  class: "h-5 w-5",
                  fill: "none",
                  viewBox: "0 0 24 24",
                  stroke: "currentColor",
                  "stroke-width": "2"
                }, [
                  createVNode("path", {
                    "stroke-linecap": "round",
                    "stroke-linejoin": "round",
                    d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  })
                ]))
              ]),
              createVNode("div", null, [
                createVNode("p", { class: "font-medium text-ink-900" }, toDisplayString(unref(t)("admin.quick.newAuthor")), 1),
                createVNode("p", { class: "text-xs text-ink-500" }, toDisplayString(unref(t)("admin.quick.newAuthorDesc")), 1)
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/admin/import",
        class: "flex items-center gap-4 rounded-2xl border border-ink-200 bg-white p-5 shadow-sm transition-colors hover:border-emerald-200 hover:bg-emerald-50/50"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800"${_scopeId}><svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"${_scopeId}></path></svg></div><div${_scopeId}><p class="font-medium text-ink-900"${_scopeId}>${ssrInterpolate(unref(t)("admin.quick.importPoems"))}</p><p class="text-xs text-ink-500"${_scopeId}>${ssrInterpolate(unref(t)("admin.quick.importPoemsDesc"))}</p></div>`);
          } else {
            return [
              createVNode("div", { class: "flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800" }, [
                (openBlock(), createBlock("svg", {
                  class: "h-5 w-5",
                  fill: "none",
                  viewBox: "0 0 24 24",
                  stroke: "currentColor",
                  "stroke-width": "2"
                }, [
                  createVNode("path", {
                    "stroke-linecap": "round",
                    "stroke-linejoin": "round",
                    d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  })
                ]))
              ]),
              createVNode("div", null, [
                createVNode("p", { class: "font-medium text-ink-900" }, toDisplayString(unref(t)("admin.quick.importPoems")), 1),
                createVNode("p", { class: "text-xs text-ink-500" }, toDisplayString(unref(t)("admin.quick.importPoemsDesc")), 1)
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/poems",
        target: "_blank",
        class: "flex items-center gap-4 rounded-2xl border border-ink-200 bg-white p-5 shadow-sm transition-colors hover:border-ink-300 hover:bg-ink-50"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-100 text-ink-700"${_scopeId}><svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"${_scopeId}></path></svg></div><div${_scopeId}><p class="font-medium text-ink-900"${_scopeId}>${ssrInterpolate(unref(t)("admin.quick.viewSite"))}</p><p class="text-xs text-ink-500"${_scopeId}>${ssrInterpolate(unref(t)("admin.quick.viewSiteDesc"))}</p></div>`);
          } else {
            return [
              createVNode("div", { class: "flex h-10 w-10 items-center justify-center rounded-xl bg-ink-100 text-ink-700" }, [
                (openBlock(), createBlock("svg", {
                  class: "h-5 w-5",
                  fill: "none",
                  viewBox: "0 0 24 24",
                  stroke: "currentColor",
                  "stroke-width": "2"
                }, [
                  createVNode("path", {
                    "stroke-linecap": "round",
                    "stroke-linejoin": "round",
                    d: "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  })
                ]))
              ]),
              createVNode("div", null, [
                createVNode("p", { class: "font-medium text-ink-900" }, toDisplayString(unref(t)("admin.quick.viewSite")), 1),
                createVNode("p", { class: "text-xs text-ink-500" }, toDisplayString(unref(t)("admin.quick.viewSiteDesc")), 1)
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/admin/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-bp_mbANh.mjs.map
