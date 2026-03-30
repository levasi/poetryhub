import { _ as _sfc_main$1 } from './PoetryCard-BDrc1LQe.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-BHo5EKPq.mjs';
import { defineComponent, computed, withAsyncContext, mergeProps, unref, withCtx, createTextVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderList, ssrRenderComponent } from 'vue/server-renderer';
import { u as useFavorites } from './useFavorites-CibuQ2Wz.mjs';
import { a as useI18n, b as useSeoMeta } from './server.mjs';
import { u as useFetch } from './fetch-B6hZG8jW.mjs';
import './useTagLabel-DPQ2hw0Y.mjs';
import './authorAvatar-BAkG-5wq.mjs';
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
import './useAuth-ClZa9bEg.mjs';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/plugins';
import 'unhead/utils';
import '@vue/shared';
import 'perfect-debounce';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "favorites",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const { t } = useI18n();
    useSeoMeta({ title: computed(() => t("seo.favoritesTitle")) });
    const { favoriteIds, count } = useFavorites();
    const { data: allPoems } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      "/api/poems",
      {
        params: { limit: 200 }
      },
      "$jTZzqJGWp5"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    const favorites = computed(
      () => {
        var _a, _b;
        return ((_b = (_a = allPoems.value) == null ? void 0 : _a.data) != null ? _b : []).filter((p) => favoriteIds.value.has(p.id));
      }
    );
    return (_ctx, _push, _parent, _attrs) => {
      const _component_PoetryCard = _sfc_main$1;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "animate-fade-in" }, _attrs))}><div class="mb-8 flex items-center justify-between"><div><h1 class="font-serif text-3xl font-bold text-ink-900">${ssrInterpolate(unref(t)("favorites.title"))}</h1><p class="mt-1 text-sm text-ink-600">${ssrInterpolate(unref(t)("favorites.count", unref(count)))}</p></div>`);
      if (unref(count) > 0) {
        _push(`<button class="text-xs text-ink-600 underline hover:text-red-600">${ssrInterpolate(unref(t)("favorites.clearAll"))}</button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (unref(favorites).length) {
        _push(`<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><!--[-->`);
        ssrRenderList(unref(favorites), (poem) => {
          _push(ssrRenderComponent(_component_PoetryCard, {
            key: poem.id,
            poem
          }, null, _parent));
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<div class="py-24 text-center"><svg class="mx-auto mb-4 h-12 w-12 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg><p class="font-serif text-lg text-ink-600">${ssrInterpolate(unref(t)("favorites.empty"))}</p>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/poems",
          class: "mt-3 inline-block text-sm text-ink-600 underline hover:text-ink-900"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(unref(t)("favorites.hint"))}`);
            } else {
              return [
                createTextVNode(toDisplayString(unref(t)("favorites.hint")), 1)
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/favorites.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=favorites-dAna0Jra.mjs.map
