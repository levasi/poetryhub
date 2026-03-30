import { _ as _sfc_main$2 } from './SearchBar-C4Xkzn-D.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-BHo5EKPq.mjs';
import { defineComponent, computed, ref, withAsyncContext, watch, mergeProps, unref, isRef, withCtx, createVNode, toDisplayString, openBlock, createBlock, createCommentVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrRenderList, ssrRenderAttr } from 'vue/server-renderer';
import { a as authorAvatarUrl } from './authorAvatar-BAkG-5wq.mjs';
import { a as useI18n, b as useSeoMeta } from './server.mjs';
import { _ as _sfc_main$3 } from './PaginationNav-CVj9bPmG.mjs';
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

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "AuthorCard",
  __ssrInlineRender: true,
  props: {
    author: {}
  },
  setup(__props) {
    const props = __props;
    const { t } = useI18n();
    function yearsLabel(birth, death) {
      if (!birth && !death) return null;
      if (birth && death) return t("authors.lifeSpan", { birth, death });
      if (birth) return t("authors.born", { year: birth });
      return null;
    }
    const poemCountLabel = computed(() => {
      var _a;
      const n = (_a = props.author._count) == null ? void 0 : _a.poems;
      if (n === void 0) return null;
      return t("authors.poemCount", n);
    });
    const avatarSrc = computed(() => authorAvatarUrl(props.author));
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(ssrRenderComponent(_component_NuxtLink, mergeProps({
        to: `/authors/${__props.author.slug}`,
        class: "group flex items-start gap-4 rounded-2xl border border-ink-200 bg-white p-5 shadow-sm transition-all hover:border-gold-300 hover:shadow-md"
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="shrink-0"${_scopeId}><img${ssrRenderAttr("src", unref(avatarSrc))}${ssrRenderAttr("alt", __props.author.name)} loading="lazy" class="h-14 w-14 rounded-full object-cover ring-2 ring-ink-100 group-hover:ring-gold-300/60"${_scopeId}></div><div class="min-w-0 flex-1"${_scopeId}><h3 class="font-serif text-base font-bold text-ink-900 group-hover:text-gold-800 transition-colors truncate"${_scopeId}>${ssrInterpolate(__props.author.name)}</h3><div class="mt-0.5 flex items-center gap-2 text-xs text-ink-500"${_scopeId}>`);
            if (__props.author.nationality) {
              _push2(`<span${_scopeId}>${ssrInterpolate(__props.author.nationality)}</span>`);
            } else {
              _push2(`<!---->`);
            }
            if (__props.author.nationality && yearsLabel(__props.author.birthYear, __props.author.deathYear)) {
              _push2(`<span${_scopeId}>\xB7</span>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<span${_scopeId}>${ssrInterpolate(yearsLabel(__props.author.birthYear, __props.author.deathYear))}</span></div>`);
            if (__props.author.bio) {
              _push2(`<p class="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-600"${_scopeId}>${ssrInterpolate(__props.author.bio)}</p>`);
            } else {
              _push2(`<!---->`);
            }
            if (unref(poemCountLabel)) {
              _push2(`<p class="mt-2 text-xs text-ink-500"${_scopeId}>${ssrInterpolate(unref(poemCountLabel))}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", { class: "shrink-0" }, [
                createVNode("img", {
                  src: unref(avatarSrc),
                  alt: __props.author.name,
                  loading: "lazy",
                  class: "h-14 w-14 rounded-full object-cover ring-2 ring-ink-100 group-hover:ring-gold-300/60"
                }, null, 8, ["src", "alt"])
              ]),
              createVNode("div", { class: "min-w-0 flex-1" }, [
                createVNode("h3", { class: "font-serif text-base font-bold text-ink-900 group-hover:text-gold-800 transition-colors truncate" }, toDisplayString(__props.author.name), 1),
                createVNode("div", { class: "mt-0.5 flex items-center gap-2 text-xs text-ink-500" }, [
                  __props.author.nationality ? (openBlock(), createBlock("span", { key: 0 }, toDisplayString(__props.author.nationality), 1)) : createCommentVNode("", true),
                  __props.author.nationality && yearsLabel(__props.author.birthYear, __props.author.deathYear) ? (openBlock(), createBlock("span", { key: 1 }, "\xB7")) : createCommentVNode("", true),
                  createVNode("span", null, toDisplayString(yearsLabel(__props.author.birthYear, __props.author.deathYear)), 1)
                ]),
                __props.author.bio ? (openBlock(), createBlock("p", {
                  key: 0,
                  class: "mt-2 line-clamp-2 text-xs leading-relaxed text-ink-600"
                }, toDisplayString(__props.author.bio), 1)) : createCommentVNode("", true),
                unref(poemCountLabel) ? (openBlock(), createBlock("p", {
                  key: 1,
                  class: "mt-2 text-xs text-ink-500"
                }, toDisplayString(unref(poemCountLabel)), 1)) : createCommentVNode("", true)
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/AuthorCard.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const { t } = useI18n();
    useSeoMeta({ title: computed(() => t("seo.authorsTitle")) });
    const page = ref(1);
    const search = ref("");
    ref(false);
    const { data, refresh } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      "/api/authors",
      {
        params: computed(() => ({ page: page.value, limit: 20, search: search.value || void 0 })),
        watch: [page]
      },
      "$POa3ttcwvZ"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    let timer;
    watch(search, (val) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        page.value = 1;
        refresh();
      }, 350);
    });
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
      const _component_SearchBar = _sfc_main$2;
      const _component_AuthorCard = _sfc_main$1;
      const _component_PaginationNav = _sfc_main$3;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "animate-fade-in" }, _attrs))}><div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><h1 class="font-serif text-3xl font-bold text-ink-900">${ssrInterpolate(unref(t)("authors.title"))}</h1><div class="w-full">`);
      _push(ssrRenderComponent(_component_SearchBar, {
        modelValue: unref(search),
        "onUpdate:modelValue": ($event) => isRef(search) ? search.value = $event : null,
        placeholder: unref(t)("authors.searchPlaceholder")
      }, null, _parent));
      _push(`</div></div>`);
      if (unref(authors).length) {
        _push(`<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><!--[-->`);
        ssrRenderList(unref(authors), (author) => {
          _push(ssrRenderComponent(_component_AuthorCard, {
            key: author.id,
            author
          }, null, _parent));
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<div class="py-16 text-center text-ink-600"><p class="font-serif text-lg">${ssrInterpolate(unref(t)("authors.none"))}</p></div>`);
      }
      if (unref(totalPages) > 1) {
        _push(`<div class="mt-10">`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/authors/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-C0dAZw26.mjs.map
