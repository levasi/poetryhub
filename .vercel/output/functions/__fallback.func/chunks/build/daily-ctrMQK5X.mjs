import { _ as __nuxt_component_1 } from './PoetryViewer-CL6_LsRF.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-BHo5EKPq.mjs';
import { defineComponent, computed, withAsyncContext, mergeProps, unref, withCtx, createTextVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent } from 'vue/server-renderer';
import { u as useDailyPoem } from './usePoems-CKpnvTjR.mjs';
import { a as useI18n, b as useSeoMeta } from './server.mjs';
import './useFavorites-CibuQ2Wz.mjs';
import './useAuth-ClZa9bEg.mjs';
import './useTagLabel-DPQ2hw0Y.mjs';
import './authorAvatar-BAkG-5wq.mjs';
import './_plugin-vue_export-helper-1tPrXgE0.mjs';
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
import './fetch-B6hZG8jW.mjs';
import '@vue/shared';
import 'perfect-debounce';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/plugins';
import 'unhead/utils';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "daily",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const { t, locale } = useI18n();
    useSeoMeta({ title: computed(() => t("seo.dailyTitle")) });
    const { data: poem, error } = ([__temp, __restore] = withAsyncContext(() => useDailyPoem()), __temp = await __temp, __restore(), __temp);
    const dateLabel = computed(
      () => (/* @__PURE__ */ new Date()).toLocaleDateString(locale.value === "ro" ? "ro-RO" : "en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
      })
    );
    const badgeText = computed(() => t("daily.badge", { date: dateLabel.value }));
    return (_ctx, _push, _parent, _attrs) => {
      const _component_PoetryViewer = __nuxt_component_1;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "animate-fade-in" }, _attrs))}><div class="mb-4 flex items-center gap-2"><span class="inline-block h-2 w-2 rounded-full bg-gold-500 animate-pulse-soft"></span><span class="text-xs font-semibold uppercase tracking-widest text-gold-800">${ssrInterpolate(unref(badgeText))}</span></div>`);
      if (unref(poem)) {
        _push(`<div>`);
        _push(ssrRenderComponent(_component_PoetryViewer, { poem: unref(poem) }, null, _parent));
        _push(`</div>`);
      } else {
        _push(`<div class="py-24 text-center text-ink-600"><p class="font-serif text-xl">${ssrInterpolate(unref(t)("daily.empty"))}</p>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/poems",
          class: "mt-4 inline-block text-sm underline hover:text-ink-900"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(unref(t)("daily.browse"))}`);
            } else {
              return [
                createTextVNode(toDisplayString(unref(t)("daily.browse")), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/daily.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=daily-ctrMQK5X.mjs.map
