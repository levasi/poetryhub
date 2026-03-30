import { _ as __nuxt_component_0 } from './nuxt-link-BHo5EKPq.mjs';
import { _ as _sfc_main$1 } from './TagBadge-Da4rTycV.mjs';
import { _ as _sfc_main$2 } from './PoetryCard-BDrc1LQe.mjs';
import { defineComponent, computed, withAsyncContext, mergeProps, unref, withCtx, createTextVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderAttr, ssrRenderComponent, ssrRenderList } from 'vue/server-renderer';
import { u as useFetch } from './fetch-B6hZG8jW.mjs';
import { a as useI18n, b as useSeoMeta, c as useRouter } from './server.mjs';
import { a as authorAvatarUrl } from './authorAvatar-BAkG-5wq.mjs';
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
import './useTagLabel-DPQ2hw0Y.mjs';
import './useFavorites-CibuQ2Wz.mjs';
import './useAuth-ClZa9bEg.mjs';
import '@vue/shared';
import 'perfect-debounce';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/plugins';
import 'unhead/utils';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const { t } = useI18n();
    useSeoMeta({
      title: computed(() => t("seo.homeTitle")),
      description: computed(() => t("seo.homeDesc"))
    });
    const { data: dailyPoem } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      "/api/poems/daily",
      "$cY9otznH82"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    const { data: featuredRes } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      "/api/poems",
      {
        params: { featured: "true", limit: 3 }
      },
      "$OTnoLLlvNh"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    const { data: recentRes } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      "/api/poems",
      {
        params: { limit: 8 }
      },
      "$_fPlqIQZaQ"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    const { data: moodTags } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      "/api/tags",
      { params: { category: "mood" } },
      "$RdYh3MnOlq"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    const { data: themeTags } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      "/api/tags",
      { params: { category: "theme" } },
      "$ExLz4T8Iss"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    const featured = computed(() => {
      var _a, _b;
      return (_b = (_a = featuredRes.value) == null ? void 0 : _a.data) != null ? _b : [];
    });
    const recent = computed(() => {
      var _a, _b;
      return (_b = (_a = recentRes.value) == null ? void 0 : _a.data) != null ? _b : [];
    });
    const dailyPreview = computed(() => {
      var _a;
      const p = dailyPoem.value;
      if (!p) return "";
      const raw = ((_a = p.excerpt) == null ? void 0 : _a.trim()) || p.content;
      return raw.length > 320 ? `${raw.slice(0, 320).trim()}\u2026` : raw;
    });
    const dailyAuthor = computed(() => {
      var _a;
      return (_a = dailyPoem.value) == null ? void 0 : _a.author;
    });
    const dailyAuthorAvatar = computed(
      () => dailyPoem.value ? authorAvatarUrl(dailyAuthor.value) : ""
    );
    useRouter();
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d;
      const _component_NuxtLink = __nuxt_component_0;
      const _component_TagBadge = _sfc_main$1;
      const _component_PoetryCard = _sfc_main$2;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "animate-fade-in" }, _attrs))}>`);
      if (unref(dailyPoem)) {
        _push(`<section class="mb-16 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-white via-ink-50 to-amber-50/40 px-6 py-12 shadow-sm md:px-10 md:py-16"><div class="mx-auto max-w-3xl text-center"><div class="mb-6 flex items-center justify-center gap-2"><span class="inline-block h-1.5 w-1.5 rounded-full bg-gold-500 animate-pulse-soft"></span><span class="text-xs font-medium uppercase tracking-widest text-gold-800">${ssrInterpolate(unref(t)("home.poemOfDay"))}</span></div><h1 class="font-serif text-3xl font-bold leading-tight tracking-tight text-ink-900 md:text-5xl">${ssrInterpolate(unref(dailyPoem).title)}</h1><div class="mt-3 flex items-center justify-center gap-3 text-sm text-ink-600 md:text-base"><img${ssrRenderAttr("src", unref(dailyAuthorAvatar))}${ssrRenderAttr("alt", (_b = (_a = unref(dailyAuthor)) == null ? void 0 : _a.name) != null ? _b : "")} loading="lazy" class="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-ink-200/80">`);
        if (unref(dailyAuthor)) {
          _push(`<span>\u2014 ${ssrInterpolate(unref(dailyAuthor).name)}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><p class="poem-text mx-auto mt-8 max-w-xl text-left text-[1.05rem] md:text-center">${ssrInterpolate(unref(dailyPreview))}</p><div class="mt-10 flex flex-wrap items-center justify-center gap-3">`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: `/poems/${unref(dailyPoem).slug}`,
          class: "rounded-full bg-gold-600 px-6 py-3 text-sm font-medium text-white shadow-md transition hover:bg-gold-700"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(unref(t)("home.readFull"))}`);
            } else {
              return [
                createTextVNode(toDisplayString(unref(t)("home.readFull")), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/poems",
          class: "rounded-full border border-ink-200 bg-white px-6 py-3 text-sm text-ink-700 shadow-sm transition-colors hover:border-ink-300 hover:bg-ink-50"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(unref(t)("home.explorePoems"))}`);
            } else {
              return [
                createTextVNode(toDisplayString(unref(t)("home.explorePoems")), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<button type="button" class="flex items-center gap-2 rounded-full border border-ink-200 bg-white px-6 py-3 text-sm text-ink-700 shadow-sm transition-colors hover:border-ink-300 hover:bg-ink-50"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> ${ssrInterpolate(unref(t)("home.randomPoem"))}</button></div></div></section>`);
      } else {
        _push(`<section class="mb-16 py-16 text-center md:py-20"><h1 class="font-serif text-4xl font-bold leading-tight text-ink-900 md:text-6xl">${ssrInterpolate(unref(t)("home.heroLine1"))}<br><span class="text-gold-700">${ssrInterpolate(unref(t)("home.heroLine2"))}</span></h1><p class="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-600">${ssrInterpolate(unref(t)("home.subtitle"))}</p><div class="mt-8 flex flex-wrap items-center justify-center gap-3">`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/poems",
          class: "rounded-full bg-gold-600 px-6 py-3 text-sm font-medium text-white shadow-md transition hover:bg-gold-700"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(unref(t)("home.explorePoems"))}`);
            } else {
              return [
                createTextVNode(toDisplayString(unref(t)("home.explorePoems")), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div></section>`);
      }
      if ((_c = unref(moodTags)) == null ? void 0 : _c.length) {
        _push(`<section class="mb-16"><h2 class="mb-6 font-serif text-2xl font-bold text-ink-900">${ssrInterpolate(unref(t)("home.browseByMood"))}</h2><div class="flex flex-wrap gap-2"><!--[-->`);
        ssrRenderList(unref(moodTags), (tag) => {
          _push(ssrRenderComponent(_component_TagBadge, {
            key: tag.id,
            name: tag.name,
            slug: tag.slug,
            color: tag.color
          }, null, _parent));
        });
        _push(`<!--]--></div></section>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(featured).length) {
        _push(`<section class="mb-16"><div class="mb-6 flex items-center justify-between"><h2 class="font-serif text-2xl font-bold text-ink-900">${ssrInterpolate(unref(t)("home.featured"))}</h2>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/poems?featured=true",
          class: "text-sm text-ink-600 hover:text-ink-900"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(unref(t)("home.seeAll"))}`);
            } else {
              return [
                createTextVNode(toDisplayString(unref(t)("home.seeAll")), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div><div class="grid gap-4 md:grid-cols-3"><!--[-->`);
        ssrRenderList(unref(featured), (poem) => {
          _push(ssrRenderComponent(_component_PoetryCard, {
            key: poem.id,
            poem,
            featured: true
          }, null, _parent));
        });
        _push(`<!--]--></div></section>`);
      } else {
        _push(`<!---->`);
      }
      if ((_d = unref(themeTags)) == null ? void 0 : _d.length) {
        _push(`<section class="mb-16"><h2 class="mb-6 font-serif text-2xl font-bold text-ink-900">${ssrInterpolate(unref(t)("home.themes"))}</h2><div class="flex flex-wrap gap-2"><!--[-->`);
        ssrRenderList(unref(themeTags), (tag) => {
          _push(ssrRenderComponent(_component_TagBadge, {
            key: tag.id,
            name: tag.name,
            slug: tag.slug,
            color: tag.color
          }, null, _parent));
        });
        _push(`<!--]--></div></section>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(recent).length) {
        _push(`<section class="mb-16"><div class="mb-6 flex items-center justify-between"><h2 class="font-serif text-2xl font-bold text-ink-900">${ssrInterpolate(unref(t)("home.recentPoems"))}</h2>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/poems",
          class: "text-sm text-ink-600 hover:text-ink-900"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(unref(t)("home.allPoemsLink"))}`);
            } else {
              return [
                createTextVNode(toDisplayString(unref(t)("home.allPoemsLink")), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div><div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><!--[-->`);
        ssrRenderList(unref(recent), (poem) => {
          _push(ssrRenderComponent(_component_PoetryCard, {
            key: poem.id,
            poem
          }, null, _parent));
        });
        _push(`<!--]--></div></section>`);
      } else {
        _push(`<!---->`);
      }
      if (!unref(featured).length && !unref(recent).length) {
        _push(`<section class="py-24 text-center"><p class="font-serif text-xl text-ink-600">${ssrInterpolate(unref(t)("home.emptyLibrary"))}</p><p class="mt-2 text-sm text-ink-500">${ssrInterpolate(unref(t)("home.emptyHintBefore"))}`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/admin",
          class: "underline hover:text-ink-800"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(unref(t)("home.emptyHintLink"))}`);
            } else {
              return [
                createTextVNode(toDisplayString(unref(t)("home.emptyHintLink")), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`${ssrInterpolate(unref(t)("home.emptyHintAfter"))}</p></section>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-BHf6vc-P.mjs.map
