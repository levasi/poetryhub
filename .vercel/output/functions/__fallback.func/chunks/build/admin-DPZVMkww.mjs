import { _ as __nuxt_component_0 } from './nuxt-link-BHo5EKPq.mjs';
import { defineComponent, computed, mergeProps, withCtx, createVNode, unref, openBlock, createBlock, createTextVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrRenderAttr, ssrRenderSlot } from 'vue/server-renderer';
import { u as useAdmin } from './useAdmin-gAmstxDv.mjs';
import { a as useI18n, d as useRoute } from './server.mjs';
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
  __name: "admin",
  __ssrInlineRender: true,
  setup(__props) {
    const { t } = useI18n();
    const { user } = useAdmin();
    const route = useRoute();
    const navItems = computed(() => [
      { label: t("admin.nav.dashboard"), to: "/admin", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
      { label: t("admin.nav.poems"), to: "/admin/poems", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
      { label: t("admin.nav.authors"), to: "/admin/authors", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
      { label: t("admin.nav.import"), to: "/admin/import", icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" }
    ]);
    return (_ctx, _push, _parent, _attrs) => {
      var _a;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen w-full bg-ink-50" }, _attrs))}><div class="flex w-full"><aside class="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-ink-200 bg-white md:flex"><div class="border-b border-ink-200 px-6 py-5">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "font-serif text-lg font-bold"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<span class="text-gold-700"${_scopeId}>Poetry</span><span class="text-ink-900"${_scopeId}>Hub</span>`);
          } else {
            return [
              createVNode("span", { class: "text-gold-700" }, "Poetry"),
              createVNode("span", { class: "text-ink-900" }, "Hub")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<p class="mt-0.5 text-xs text-ink-500">${ssrInterpolate(unref(t)("admin.panel"))}</p></div><nav class="flex-1 space-y-1 px-3 py-4"><!--[-->`);
      ssrRenderList(unref(navItems), (item) => {
        _push(ssrRenderComponent(_component_NuxtLink, {
          key: item.to,
          to: item.to,
          class: ["flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-900", { "bg-amber-50 text-ink-900": unref(route).path === item.to || item.to !== "/admin" && unref(route).path.startsWith(item.to) }],
          exact: item.to === "/admin"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round"${ssrRenderAttr("d", item.icon)}${_scopeId}></path></svg> ${ssrInterpolate(item.label)}`);
            } else {
              return [
                (openBlock(), createBlock("svg", {
                  class: "h-4 w-4 shrink-0",
                  fill: "none",
                  viewBox: "0 0 24 24",
                  stroke: "currentColor",
                  "stroke-width": "1.5"
                }, [
                  createVNode("path", {
                    "stroke-linecap": "round",
                    "stroke-linejoin": "round",
                    d: item.icon
                  }, null, 8, ["d"])
                ])),
                createTextVNode(" " + toDisplayString(item.label), 1)
              ];
            }
          }),
          _: 2
        }, _parent));
      });
      _push(`<!--]--></nav><div class="border-t border-ink-200 px-4 py-4"><p class="mb-2 truncate text-xs text-ink-500">${ssrInterpolate((_a = unref(user)) == null ? void 0 : _a.email)}</p><button type="button" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs text-ink-600 transition-colors hover:border-red-200 hover:text-red-600">${ssrInterpolate(unref(t)("admin.signOut"))}</button></div></aside><main class="min-h-screen flex-1 overflow-auto p-6 md:p-8">`);
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`</main></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/admin.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=admin-DPZVMkww.mjs.map
