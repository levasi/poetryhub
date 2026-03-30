import { _ as __nuxt_component_0 } from './nuxt-link-BHo5EKPq.mjs';
import { _ as __nuxt_component_1 } from './PoetryViewer-CL6_LsRF.mjs';
import { _ as _sfc_main$1 } from './PoetryCard-BDrc1LQe.mjs';
import { defineComponent, withAsyncContext, computed, mergeProps, unref, withCtx, openBlock, createBlock, createVNode, createTextVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderList } from 'vue/server-renderer';
import { a as useI18n, d as useRoute, e as createError, b as useSeoMeta } from './server.mjs';
import { u as useFetch, a as useAsyncData } from './fetch-B6hZG8jW.mjs';
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
import './_plugin-vue_export-helper-1tPrXgE0.mjs';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/plugins';
import 'unhead/utils';
import '@vue/shared';
import 'perfect-debounce';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[slug]",
  __ssrInlineRender: true,
  async setup(__props) {
    var _a, _b;
    let __temp, __restore;
    const { t } = useI18n();
    const route = useRoute();
    const slug = route.params.slug;
    const { data: poem, error } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      `/api/poems/${slug}`,
      "$I919KH9tiL"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    if (error.value || !poem.value) {
      throw createError({ statusCode: 404, statusMessage: t("poem.notFound") });
    }
    useSeoMeta({
      title: computed(() => {
        var _a2, _b2;
        return t("seo.poemTitle", { title: (_b2 = (_a2 = poem.value) == null ? void 0 : _a2.title) != null ? _b2 : "" });
      }),
      description: computed(() => {
        var _a2, _b2, _c;
        return (_c = (_a2 = poem.value) == null ? void 0 : _a2.excerpt) != null ? _c : (_b2 = poem.value) == null ? void 0 : _b2.content.slice(0, 160);
      }),
      ogTitle: computed(() => {
        var _a2, _b2;
        return (_b2 = (_a2 = poem.value) == null ? void 0 : _a2.title) != null ? _b2 : "";
      }),
      ogDescription: computed(() => {
        var _a2, _b2, _c;
        return (_c = (_a2 = poem.value) == null ? void 0 : _a2.excerpt) != null ? _c : (_b2 = poem.value) == null ? void 0 : _b2.content.slice(0, 160);
      })
    });
    const authorSlug = (_b = (_a = poem.value.author) == null ? void 0 : _a.slug) != null ? _b : "";
    const { data: relatedRes } = ([__temp, __restore] = withAsyncContext(() => useAsyncData(
      `poem-related-${slug}`,
      () => authorSlug ? $fetch("/api/poems", {
        params: { author: authorSlug, excludeSlug: slug, limit: 6 }
      }) : Promise.resolve({ data: [] }),
      { default: () => ({ data: [] }) }
    )), __temp = await __temp, __restore(), __temp);
    const related = computed(() => {
      var _a2, _b2;
      return (_b2 = (_a2 = relatedRes.value) == null ? void 0 : _a2.data) != null ? _b2 : [];
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_PoetryViewer = __nuxt_component_1;
      const _component_PoetryCard = _sfc_main$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "animate-fade-in" }, _attrs))}>`);
      if (unref(poem)) {
        _push(`<div>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/poems",
          class: "mb-8 inline-flex items-center gap-1 text-sm text-ink-600 hover:text-ink-900"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"${_scopeId}></path></svg> ${ssrInterpolate(unref(t)("poem.back"))}`);
            } else {
              return [
                (openBlock(), createBlock("svg", {
                  class: "h-3.5 w-3.5",
                  fill: "none",
                  viewBox: "0 0 24 24",
                  stroke: "currentColor",
                  "stroke-width": "2"
                }, [
                  createVNode("path", {
                    "stroke-linecap": "round",
                    "stroke-linejoin": "round",
                    d: "M15 19l-7-7 7-7"
                  })
                ])),
                createTextVNode(" " + toDisplayString(unref(t)("poem.back")), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(ssrRenderComponent(_component_PoetryViewer, { poem: unref(poem) }, null, _parent));
        if (unref(related).length && unref(poem).author) {
          _push(`<section class="mt-20 border-t border-ink-200/80 pt-16"><div class="mb-6 flex flex-wrap items-end justify-between gap-3"><h2 class="font-serif text-xl font-bold text-ink-800">${ssrInterpolate(unref(t)("poem.moreBy", { name: unref(poem).author.name }))}</h2>`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/authors/${unref(poem).author.slug}`,
            class: "text-sm text-ink-500 transition-colors hover:text-gold-700"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`${ssrInterpolate(unref(t)("poem.viewAllPoems"))}`);
              } else {
                return [
                  createTextVNode(toDisplayString(unref(t)("poem.viewAllPoems")), 1)
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(`</div><div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><!--[-->`);
          ssrRenderList(unref(related), (p) => {
            _push(ssrRenderComponent(_component_PoetryCard, {
              key: p.id,
              poem: p,
              view: "grid"
            }, null, _parent));
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/poems/[slug].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_slug_-BYldfdYy.mjs.map
