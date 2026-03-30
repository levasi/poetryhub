import { _ as __nuxt_component_0 } from './nuxt-link-BHo5EKPq.mjs';
import { defineComponent, computed, ref, mergeProps, withCtx, createVNode, unref, createTextVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderAttr, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import { a as useI18n, b as useSeoMeta, d as useRoute, c as useRouter } from './server.mjs';
import { u as useAdmin } from './useAdmin-gAmstxDv.mjs';
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
  __name: "login",
  __ssrInlineRender: true,
  setup(__props) {
    const { t } = useI18n();
    useSeoMeta({ title: computed(() => t("seo.adminLogin")) });
    const { loading } = useAdmin();
    useRoute();
    useRouter();
    const email = ref("");
    const password = ref("");
    const errorMsg = ref("");
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex min-h-screen items-center justify-center bg-ink-50 px-4" }, _attrs))}><div class="w-full"><div class="mb-8 text-center">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "font-serif text-2xl font-bold"
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
      _push(`<p class="mt-1 text-sm text-ink-600">${ssrInterpolate(unref(t)("admin.login.subtitle"))}</p></div><form class="rounded-2xl border border-ink-200 bg-white p-8 shadow-lg"><h1 class="mb-6 font-serif text-xl font-bold text-ink-900">${ssrInterpolate(unref(t)("admin.login.title"))}</h1>`);
      if (unref(errorMsg)) {
        _push(`<div class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">${ssrInterpolate(unref(errorMsg))}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="mb-4"><label class="mb-1.5 block text-xs font-medium text-ink-600">${ssrInterpolate(unref(t)("admin.login.email"))}</label><input${ssrRenderAttr("value", unref(email))} type="email" required autocomplete="email" class="w-full rounded-lg border border-ink-200 bg-ink-50/50 px-3 py-2.5 text-sm text-ink-900 placeholder-ink-400 outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-300/40" placeholder="admin@poetryhub.com"></div><div class="mb-6"><label class="mb-1.5 block text-xs font-medium text-ink-600">${ssrInterpolate(unref(t)("admin.login.password"))}</label><input${ssrRenderAttr("value", unref(password))} type="password" required autocomplete="current-password" class="w-full rounded-lg border border-ink-200 bg-ink-50/50 px-3 py-2.5 text-sm text-ink-900 placeholder-ink-400 outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-300/40"${ssrRenderAttr("placeholder", unref(t)("admin.login.passwordPlaceholder"))}></div><button type="submit"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""} class="w-full rounded-lg bg-gold-600 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:bg-gold-700 disabled:opacity-50">${ssrInterpolate(unref(loading) ? unref(t)("admin.login.signingIn") : unref(t)("admin.login.signIn"))}</button></form><p class="mt-4 text-center text-xs text-ink-500">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "hover:text-ink-800"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`${ssrInterpolate(unref(t)("admin.backToSite"))}`);
          } else {
            return [
              createTextVNode(toDisplayString(unref(t)("admin.backToSite")), 1)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</p></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/admin/login.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=login-B7kHdxZ7.mjs.map
