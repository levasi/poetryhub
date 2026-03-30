import { _ as _sfc_main$1 } from './LanguageSwitch-BQbsmeO0.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-BHo5EKPq.mjs';
import { defineComponent, computed, withAsyncContext, reactive, ref, mergeProps, withCtx, createTextVNode, createVNode, unref, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderAttr, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import { a as useI18n, b as useSeoMeta, d as useRoute, n as navigateTo } from './server.mjs';
import { u as useAuth } from './useAuth-ClZa9bEg.mjs';
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
  async setup(__props) {
    let __temp, __restore;
    const { t } = useI18n();
    useSeoMeta({ title: computed(() => t("seo.loginTitle")) });
    const { loading, isLoggedIn } = useAuth();
    useRoute();
    if (isLoggedIn.value) [__temp, __restore] = withAsyncContext(() => navigateTo("/")), await __temp, __restore();
    const form = reactive({ email: "", password: "" });
    const error = ref("");
    return (_ctx, _push, _parent, _attrs) => {
      const _component_LanguageSwitch = _sfc_main$1;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "relative flex min-h-screen items-center justify-center bg-ink-50 px-4" }, _attrs))}><div class="absolute right-4 top-4 z-10">`);
      _push(ssrRenderComponent(_component_LanguageSwitch, null, null, _parent));
      _push(`</div><div class="w-full max-w-md"><div class="mb-8 text-center">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "font-serif text-2xl font-bold text-gold-700"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Poetry<span class="text-ink-900"${_scopeId}>Hub</span>`);
          } else {
            return [
              createTextVNode(" Poetry"),
              createVNode("span", { class: "text-ink-900" }, "Hub")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<p class="mt-2 text-sm text-ink-600">${ssrInterpolate(unref(t)("auth.signInSubtitle"))}</p></div><form class="rounded-xl border border-ink-200 bg-white p-8 shadow-lg"><div class="space-y-5"><div><label class="mb-1.5 block text-xs font-medium uppercase tracking-widest text-ink-600">${ssrInterpolate(unref(t)("auth.email"))}</label><input${ssrRenderAttr("value", unref(form).email)} type="email" placeholder="you@example.com" required autocomplete="email" class="w-full rounded-lg border border-ink-200 bg-ink-50/50 px-4 py-3 text-sm text-ink-900 placeholder-ink-400 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-300/40"></div><div><label class="mb-1.5 block text-xs font-medium uppercase tracking-widest text-ink-600">${ssrInterpolate(unref(t)("auth.password"))}</label><input${ssrRenderAttr("value", unref(form).password)} type="password"${ssrRenderAttr("placeholder", unref(t)("auth.passwordPlaceholder"))} required autocomplete="current-password" class="w-full rounded-lg border border-ink-200 bg-ink-50/50 px-4 py-3 text-sm text-ink-900 placeholder-ink-400 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-300/40"></div>`);
      if (unref(error)) {
        _push(`<p class="text-sm text-red-600">${ssrInterpolate(unref(error))}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<button type="submit"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""} class="w-full rounded-lg bg-gold-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gold-700 disabled:opacity-50">${ssrInterpolate(unref(loading) ? unref(t)("auth.signingIn") : unref(t)("auth.signIn"))}</button></div><p class="mt-6 text-center text-sm text-ink-600">${ssrInterpolate(unref(t)("auth.noAccount"))} `);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/signup",
        class: "text-gold-800 underline hover:text-gold-900"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`${ssrInterpolate(unref(t)("auth.signUpLink"))}`);
          } else {
            return [
              createTextVNode(toDisplayString(unref(t)("auth.signUpLink")), 1)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</p></form></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/login.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=login-Cr5puSYl.mjs.map
