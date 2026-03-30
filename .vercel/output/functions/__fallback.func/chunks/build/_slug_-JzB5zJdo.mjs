import { _ as __nuxt_component_0 } from './nuxt-link-BHo5EKPq.mjs';
import { _ as _sfc_main$1 } from './PoetryCard-BDrc1LQe.mjs';
import { _ as _sfc_main$2 } from './PaginationNav-CVj9bPmG.mjs';
import { defineComponent, ref, withAsyncContext, computed, unref, mergeProps, withCtx, openBlock, createBlock, createVNode, createTextVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderAttr, ssrRenderList } from 'vue/server-renderer';
import { a as useI18n, d as useRoute, e as createError, b as useSeoMeta } from './server.mjs';
import { u as useFetch } from './fetch-B6hZG8jW.mjs';
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
import './useFavorites-CibuQ2Wz.mjs';
import './useAuth-ClZa9bEg.mjs';
import './useTagLabel-DPQ2hw0Y.mjs';
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
    let __temp, __restore;
    const { t } = useI18n();
    const route = useRoute();
    const slug = route.params.slug;
    const page = ref(1);
    const { data, error, refresh } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      `/api/authors/${slug}`,
      {
        params: computed(() => ({ page: page.value, limit: 10 })),
        watch: [page]
      },
      "$cvd3dt4bhU"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    if (error.value || !data.value) {
      throw createError({ statusCode: 404, statusMessage: t("authors.notFound") });
    }
    const author = computed(() => {
      var _a;
      return (_a = data.value) == null ? void 0 : _a.author;
    });
    const works = computed(() => {
      var _a, _b;
      return (_b = (_a = data.value) == null ? void 0 : _a.works) != null ? _b : [];
    });
    const poems = computed(() => {
      var _a, _b;
      return (_b = (_a = data.value) == null ? void 0 : _a.poems.data) != null ? _b : [];
    });
    const meta = computed(() => {
      var _a;
      return (_a = data.value) == null ? void 0 : _a.poems.meta;
    });
    useSeoMeta({
      title: computed(() => {
        var _a, _b;
        return t("seo.authorTitle", { name: (_b = (_a = author.value) == null ? void 0 : _a.name) != null ? _b : "" });
      }),
      description: computed(() => {
        var _a, _b, _c, _d;
        return (_d = (_a = author.value) == null ? void 0 : _a.bio) != null ? _d : t("seo.authorDesc", { name: (_c = (_b = author.value) == null ? void 0 : _b.name) != null ? _c : "" });
      })
    });
    function yearsLabel() {
      const a = author.value;
      if (!a) return "";
      if (a.birthYear && a.deathYear) return t("authors.lifeSpan", { birth: a.birthYear, death: a.deathYear });
      if (a.birthYear) return t("authors.born", { year: a.birthYear });
      return "";
    }
    const avatarSrc = computed(
      () => author.value ? authorAvatarUrl(author.value) : ""
    );
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d;
      const _component_NuxtLink = __nuxt_component_0;
      const _component_PoetryCard = _sfc_main$1;
      const _component_PaginationNav = _sfc_main$2;
      if (unref(author)) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "animate-fade-in" }, _attrs))}>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/authors",
          class: "mb-8 inline-flex items-center gap-1 text-sm text-ink-600 hover:text-ink-900"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"${_scopeId}></path></svg> ${ssrInterpolate(unref(t)("nav.allAuthors"))}`);
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
                createTextVNode(" " + toDisplayString(unref(t)("nav.allAuthors")), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<div class="mb-12 flex flex-col items-start gap-6 sm:flex-row"><div class="shrink-0"><img${ssrRenderAttr("src", unref(avatarSrc))}${ssrRenderAttr("alt", unref(author).name)} loading="eager" class="h-24 w-24 rounded-full object-cover ring-2 ring-gold-300/60"></div><div><h1 class="font-serif text-4xl font-bold text-ink-900">${ssrInterpolate(unref(author).name)}</h1><p class="mt-1 text-sm text-ink-600">`);
        if (unref(author).nationality) {
          _push(`<span>${ssrInterpolate(unref(author).nationality)}</span>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(author).nationality && yearsLabel()) {
          _push(`<span> \xB7 </span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<span>${ssrInterpolate(yearsLabel())}</span></p><p class="mt-3 text-sm text-ink-500">${ssrInterpolate(unref(t)("authors.poemCount", (_b = (_a = unref(meta)) == null ? void 0 : _a.total) != null ? _b : 0))}</p></div></div><section class="mb-10 border-t border-ink-200/80 pt-8"><h2 class="mb-3 font-serif text-xl font-bold text-ink-900">${ssrInterpolate(unref(t)("authors.biography"))}</h2>`);
        if (unref(author).bio) {
          _push(`<p class="max-w-3xl whitespace-pre-wrap text-base leading-relaxed text-ink-700">${ssrInterpolate(unref(author).bio)}</p>`);
        } else {
          _push(`<p class="max-w-3xl text-sm italic text-ink-500">${ssrInterpolate(unref(t)("authors.bioUnavailable"))}</p>`);
        }
        _push(`</section>`);
        if (unref(works).length) {
          _push(`<section class="mb-10 border-t border-ink-200/80 pt-8"><h2 class="mb-1 font-serif text-xl font-bold text-ink-900">${ssrInterpolate(unref(t)("authors.bibliography"))}</h2><p class="mb-4 text-sm text-ink-500">${ssrInterpolate(unref(t)("authors.worksInCollection"))}</p><ul class="max-h-80 max-w-3xl list-inside list-disc space-y-1.5 overflow-y-auto text-sm text-ink-700 sm:columns-2 sm:gap-x-8"><!--[-->`);
          ssrRenderList(unref(works), (w) => {
            _push(`<li class="break-inside-avoid">`);
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: `/poems/${w.slug}`,
              class: "text-gold-800 underline-offset-2 hover:text-gold-900 hover:underline"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`${ssrInterpolate(w.title)}`);
                } else {
                  return [
                    createTextVNode(toDisplayString(w.title), 1)
                  ];
                }
              }),
              _: 2
            }, _parent));
            _push(`</li>`);
          });
          _push(`<!--]--></ul></section>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(poems).length) {
          _push(`<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><!--[-->`);
          ssrRenderList(unref(poems), (poem) => {
            _push(ssrRenderComponent(_component_PoetryCard, {
              key: poem.id,
              poem
            }, null, _parent));
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<div class="py-12 text-center text-ink-600"><p class="font-serif">${ssrInterpolate(unref(t)("authors.noPoemsYet"))}</p></div>`);
        }
        if (((_d = (_c = unref(meta)) == null ? void 0 : _c.totalPages) != null ? _d : 1) > 1) {
          _push(`<div class="mt-10">`);
          _push(ssrRenderComponent(_component_PaginationNav, {
            page: unref(page),
            "total-pages": unref(meta).totalPages,
            "onUpdate:page": (p) => {
              page.value = p;
            }
          }, null, _parent));
          _push(`</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/authors/[slug].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_slug_-JzB5zJdo.mjs.map
