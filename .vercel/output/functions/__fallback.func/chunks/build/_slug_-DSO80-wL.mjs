import { _ as __nuxt_component_0 } from './nuxt-link-BHo5EKPq.mjs';
import { defineComponent, ref, withAsyncContext, computed, reactive, mergeProps, withCtx, unref, createTextVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderAttr, ssrRenderList, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderClass } from 'vue/server-renderer';
import { u as useTagLabel } from './useTagLabel-DPQ2hw0Y.mjs';
import { a as useI18n, d as useRoute, c as useRouter, e as createError, b as useSeoMeta } from './server.mjs';
import { u as useFetch } from './fetch-B6hZG8jW.mjs';
import { _ as _export_sfc } from './_plugin-vue_export-helper-1tPrXgE0.mjs';
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
  __name: "[slug]",
  __ssrInlineRender: true,
  async setup(__props) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q;
    let __temp, __restore;
    const { t } = useI18n();
    const { labelForTag } = useTagLabel();
    const route = useRoute();
    useRouter();
    const slug = route.params.slug;
    const loading = ref(false);
    const error = ref("");
    const { data: poem } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      `/api/poems/${slug}`,
      "$K9YRO6mQtI"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    if (!poem.value) throw createError({ statusCode: 404 });
    useSeoMeta({ title: computed(() => {
      var _a2, _b2;
      return t("seo.adminEditPoem", { title: (_b2 = (_a2 = poem.value) == null ? void 0 : _a2.title) != null ? _b2 : "" });
    }) });
    const { data: authors } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      "/api/authors",
      { params: { limit: 200 } },
      "$uJVaMEQvov"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    const { data: tags } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      "/api/tags",
      "$pTpAy73ocO"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    const form = reactive({
      title: (_b = (_a = poem.value) == null ? void 0 : _a.title) != null ? _b : "",
      content: (_d = (_c = poem.value) == null ? void 0 : _c.content) != null ? _d : "",
      authorId: (_f = (_e = poem.value) == null ? void 0 : _e.authorId) != null ? _f : "",
      language: (_h = (_g = poem.value) == null ? void 0 : _g.language) != null ? _h : "en",
      source: (_j = (_i = poem.value) == null ? void 0 : _i.source) != null ? _j : "classic",
      sourceUrl: (_l = (_k = poem.value) == null ? void 0 : _k.sourceUrl) != null ? _l : "",
      featured: (_n = (_m = poem.value) == null ? void 0 : _m.featured) != null ? _n : false,
      tagIds: (_q = (_p = (_o = poem.value) == null ? void 0 : _o.poemTags) == null ? void 0 : _p.map((pt) => pt.tag.id)) != null ? _q : []
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a2, _b2;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "w-full" }, _attrs))} data-v-29e92cc0><div class="mb-6 flex items-center justify-between gap-4" data-v-29e92cc0><div class="flex min-w-0 flex-1 items-center gap-4" data-v-29e92cc0>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/admin/poems",
        class: "shrink-0 text-sm text-ink-600 hover:text-ink-900"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`${ssrInterpolate(unref(t)("admin.poemForm.backPoems"))}`);
          } else {
            return [
              createTextVNode(toDisplayString(unref(t)("admin.poemForm.backPoems")), 1)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<h1 class="min-w-0 truncate font-serif text-xl font-bold text-ink-900" data-v-29e92cc0>${ssrInterpolate(unref(t)("admin.poemForm.editTitle", { title: unref(form).title }))}</h1></div><button type="button" class="text-xs text-red-700 hover:text-red-600" data-v-29e92cc0>${ssrInterpolate(unref(t)("admin.poemForm.delete"))}</button></div><form class="space-y-5" data-v-29e92cc0>`);
      if (unref(error)) {
        _push(`<div class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" data-v-29e92cc0>${ssrInterpolate(unref(error))}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div data-v-29e92cc0><label class="mb-1.5 block text-xs font-medium text-ink-600" data-v-29e92cc0>${ssrInterpolate(unref(t)("admin.poemForm.title"))}</label><input${ssrRenderAttr("value", unref(form).title)} type="text" required class="admin-input" data-v-29e92cc0></div><div data-v-29e92cc0><label class="mb-1.5 block text-xs font-medium text-ink-600" data-v-29e92cc0>${ssrInterpolate(unref(t)("admin.poemForm.author"))}</label><select required class="admin-input" data-v-29e92cc0><!--[-->`);
      ssrRenderList((_a2 = unref(authors)) == null ? void 0 : _a2.data, (a) => {
        _push(`<option${ssrRenderAttr("value", a.id)} data-v-29e92cc0${ssrIncludeBooleanAttr(Array.isArray(unref(form).authorId) ? ssrLooseContain(unref(form).authorId, a.id) : ssrLooseEqual(unref(form).authorId, a.id)) ? " selected" : ""}>${ssrInterpolate(a.name)}</option>`);
      });
      _push(`<!--]--></select></div><div data-v-29e92cc0><label class="mb-1.5 block text-xs font-medium text-ink-600" data-v-29e92cc0>${ssrInterpolate(unref(t)("admin.poemForm.content"))}</label><textarea rows="14" required class="admin-input font-mono text-xs" data-v-29e92cc0>${ssrInterpolate(unref(form).content)}</textarea></div><div class="grid grid-cols-2 gap-4" data-v-29e92cc0><div data-v-29e92cc0><label class="mb-1.5 block text-xs font-medium text-ink-600" data-v-29e92cc0>${ssrInterpolate(unref(t)("admin.poemForm.language"))}</label><select class="admin-input" data-v-29e92cc0><option value="en" data-v-29e92cc0${ssrIncludeBooleanAttr(Array.isArray(unref(form).language) ? ssrLooseContain(unref(form).language, "en") : ssrLooseEqual(unref(form).language, "en")) ? " selected" : ""}>${ssrInterpolate(unref(t)("lang.en"))}</option><option value="ro" data-v-29e92cc0${ssrIncludeBooleanAttr(Array.isArray(unref(form).language) ? ssrLooseContain(unref(form).language, "ro") : ssrLooseEqual(unref(form).language, "ro")) ? " selected" : ""}>${ssrInterpolate(unref(t)("lang.ro"))}</option><option value="fr" data-v-29e92cc0${ssrIncludeBooleanAttr(Array.isArray(unref(form).language) ? ssrLooseContain(unref(form).language, "fr") : ssrLooseEqual(unref(form).language, "fr")) ? " selected" : ""}>${ssrInterpolate(unref(t)("lang.fr"))}</option><option value="de" data-v-29e92cc0${ssrIncludeBooleanAttr(Array.isArray(unref(form).language) ? ssrLooseContain(unref(form).language, "de") : ssrLooseEqual(unref(form).language, "de")) ? " selected" : ""}>${ssrInterpolate(unref(t)("lang.de"))}</option><option value="es" data-v-29e92cc0${ssrIncludeBooleanAttr(Array.isArray(unref(form).language) ? ssrLooseContain(unref(form).language, "es") : ssrLooseEqual(unref(form).language, "es")) ? " selected" : ""}>${ssrInterpolate(unref(t)("lang.es"))}</option><option value="ru" data-v-29e92cc0${ssrIncludeBooleanAttr(Array.isArray(unref(form).language) ? ssrLooseContain(unref(form).language, "ru") : ssrLooseEqual(unref(form).language, "ru")) ? " selected" : ""}>${ssrInterpolate(unref(t)("lang.ru"))}</option></select></div><div data-v-29e92cc0><label class="mb-1.5 block text-xs font-medium text-ink-600" data-v-29e92cc0>${ssrInterpolate(unref(t)("admin.poemForm.source"))}</label><select class="admin-input" data-v-29e92cc0><option value="classic" data-v-29e92cc0${ssrIncludeBooleanAttr(Array.isArray(unref(form).source) ? ssrLooseContain(unref(form).source, "classic") : ssrLooseEqual(unref(form).source, "classic")) ? " selected" : ""}>${ssrInterpolate(unref(t)("admin.poemForm.sources.classic"))}</option><option value="ai-generated" data-v-29e92cc0${ssrIncludeBooleanAttr(Array.isArray(unref(form).source) ? ssrLooseContain(unref(form).source, "ai-generated") : ssrLooseEqual(unref(form).source, "ai-generated")) ? " selected" : ""}>${ssrInterpolate(unref(t)("admin.poemForm.sources.ai"))}</option><option value="user-submitted" data-v-29e92cc0${ssrIncludeBooleanAttr(Array.isArray(unref(form).source) ? ssrLooseContain(unref(form).source, "user-submitted") : ssrLooseEqual(unref(form).source, "user-submitted")) ? " selected" : ""}>${ssrInterpolate(unref(t)("admin.poemForm.sources.user"))}</option><option value="imported" data-v-29e92cc0${ssrIncludeBooleanAttr(Array.isArray(unref(form).source) ? ssrLooseContain(unref(form).source, "imported") : ssrLooseEqual(unref(form).source, "imported")) ? " selected" : ""}>${ssrInterpolate(unref(t)("admin.poemForm.sources.imported"))}</option></select></div></div><div data-v-29e92cc0><label class="mb-1.5 block text-xs font-medium text-ink-600" data-v-29e92cc0>${ssrInterpolate(unref(t)("admin.poemForm.sourceUrl"))}</label><input${ssrRenderAttr("value", unref(form).sourceUrl)} type="url" class="admin-input" placeholder="https://\u2026" data-v-29e92cc0></div>`);
      if ((_b2 = unref(tags)) == null ? void 0 : _b2.length) {
        _push(`<div data-v-29e92cc0><label class="mb-2 block text-xs font-medium text-ink-600" data-v-29e92cc0>${ssrInterpolate(unref(t)("admin.poemForm.tags"))}</label><div class="flex flex-wrap gap-1.5" data-v-29e92cc0><!--[-->`);
        ssrRenderList(unref(tags), (tag) => {
          _push(`<button type="button" class="${ssrRenderClass([unref(form).tagIds.includes(tag.id) ? "border-amber-300 bg-amber-50 text-amber-900" : "border-ink-200 bg-white text-ink-600 hover:border-ink-300", "rounded-full border px-3 py-0.5 text-xs transition-colors"])}" data-v-29e92cc0>${ssrInterpolate(unref(labelForTag)(tag.slug, tag.name))}</button>`);
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<label class="flex cursor-pointer items-center gap-3" data-v-29e92cc0><input${ssrIncludeBooleanAttr(Array.isArray(unref(form).featured) ? ssrLooseContain(unref(form).featured, null) : unref(form).featured) ? " checked" : ""} type="checkbox" class="h-4 w-4 rounded accent-gold-500" data-v-29e92cc0><span class="text-sm text-ink-700" data-v-29e92cc0>${ssrInterpolate(unref(t)("admin.poemForm.featuredEdit"))}</span></label><div class="flex gap-3 pt-2" data-v-29e92cc0><button type="submit"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""} class="rounded-lg bg-gold-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gold-700 disabled:opacity-50" data-v-29e92cc0>${ssrInterpolate(unref(loading) ? unref(t)("admin.poemForm.saving") : unref(t)("admin.poemForm.save"))}</button>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/admin/poems",
        class: "rounded-lg border border-ink-200 bg-white px-5 py-2.5 text-sm text-ink-600 hover:border-ink-300 hover:text-ink-900"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`${ssrInterpolate(unref(t)("admin.poemForm.cancel"))}`);
          } else {
            return [
              createTextVNode(toDisplayString(unref(t)("admin.poemForm.cancel")), 1)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></form></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/admin/poems/[slug].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _slug_ = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-29e92cc0"]]);

export { _slug_ as default };
//# sourceMappingURL=_slug_-DSO80-wL.mjs.map
