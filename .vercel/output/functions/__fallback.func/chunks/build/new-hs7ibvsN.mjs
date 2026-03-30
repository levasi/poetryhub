import { _ as __nuxt_component_0 } from './nuxt-link-BHo5EKPq.mjs';
import { defineComponent, computed, ref, withAsyncContext, reactive, mergeProps, withCtx, unref, createTextVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrRenderClass } from 'vue/server-renderer';
import { u as useTagLabel } from './useTagLabel-DPQ2hw0Y.mjs';
import { a as useI18n, b as useSeoMeta, c as useRouter } from './server.mjs';
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
  __name: "new",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const { t } = useI18n();
    const { labelForTag } = useTagLabel();
    useSeoMeta({ title: computed(() => t("seo.adminNewPoem")) });
    useRouter();
    const loading = ref(false);
    const error = ref("");
    const { data: authors } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      "/api/authors",
      { params: { limit: 200 } },
      "$YBFypk-XTi"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    const { data: tags } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      "/api/tags",
      "$wL70rzQOt1"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    const form = reactive({
      title: "",
      content: "",
      authorId: "",
      language: "en",
      source: "classic",
      sourceUrl: "",
      featured: false,
      tagIds: []
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "w-full" }, _attrs))} data-v-9d19690d><div class="mb-6 flex items-center gap-4" data-v-9d19690d>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/admin/poems",
        class: "text-sm text-ink-600 hover:text-ink-900"
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
      _push(`<h1 class="font-serif text-2xl font-bold text-ink-900" data-v-9d19690d>${ssrInterpolate(unref(t)("admin.poemForm.newTitle"))}</h1></div><form class="space-y-5" data-v-9d19690d>`);
      if (unref(error)) {
        _push(`<div class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" data-v-9d19690d>${ssrInterpolate(unref(error))}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div data-v-9d19690d><label class="mb-1.5 block text-xs font-medium text-ink-600" data-v-9d19690d>${ssrInterpolate(unref(t)("admin.poemForm.titleRequired"))}</label><input${ssrRenderAttr("value", unref(form).title)} type="text" required class="admin-input"${ssrRenderAttr("placeholder", unref(t)("admin.poemForm.placeholderTitle"))} data-v-9d19690d></div><div data-v-9d19690d><label class="mb-1.5 block text-xs font-medium text-ink-600" data-v-9d19690d>${ssrInterpolate(unref(t)("admin.poemForm.authorRequired"))}</label><select required class="admin-input" data-v-9d19690d><option value="" data-v-9d19690d${ssrIncludeBooleanAttr(Array.isArray(unref(form).authorId) ? ssrLooseContain(unref(form).authorId, "") : ssrLooseEqual(unref(form).authorId, "")) ? " selected" : ""}>${ssrInterpolate(unref(t)("admin.poemForm.selectAuthor"))}</option><!--[-->`);
      ssrRenderList((_a = unref(authors)) == null ? void 0 : _a.data, (a) => {
        _push(`<option${ssrRenderAttr("value", a.id)} data-v-9d19690d${ssrIncludeBooleanAttr(Array.isArray(unref(form).authorId) ? ssrLooseContain(unref(form).authorId, a.id) : ssrLooseEqual(unref(form).authorId, a.id)) ? " selected" : ""}>${ssrInterpolate(a.name)}</option>`);
      });
      _push(`<!--]--></select></div><div data-v-9d19690d><label class="mb-1.5 block text-xs font-medium text-ink-600" data-v-9d19690d>${ssrInterpolate(unref(t)("admin.poemForm.contentRequired"))}</label><textarea rows="14" required class="admin-input font-mono text-xs"${ssrRenderAttr("placeholder", unref(t)("admin.poemForm.placeholderContent"))} data-v-9d19690d>${ssrInterpolate(unref(form).content)}</textarea><p class="mt-1 text-xs text-ink-600" data-v-9d19690d>${ssrInterpolate(unref(t)("admin.poemForm.contentHint"))}</p></div><div class="grid grid-cols-2 gap-4" data-v-9d19690d><div data-v-9d19690d><label class="mb-1.5 block text-xs font-medium text-ink-600" data-v-9d19690d>${ssrInterpolate(unref(t)("admin.poemForm.language"))}</label><select class="admin-input" data-v-9d19690d><option value="en" data-v-9d19690d${ssrIncludeBooleanAttr(Array.isArray(unref(form).language) ? ssrLooseContain(unref(form).language, "en") : ssrLooseEqual(unref(form).language, "en")) ? " selected" : ""}>${ssrInterpolate(unref(t)("lang.en"))}</option><option value="ro" data-v-9d19690d${ssrIncludeBooleanAttr(Array.isArray(unref(form).language) ? ssrLooseContain(unref(form).language, "ro") : ssrLooseEqual(unref(form).language, "ro")) ? " selected" : ""}>${ssrInterpolate(unref(t)("lang.ro"))}</option><option value="fr" data-v-9d19690d${ssrIncludeBooleanAttr(Array.isArray(unref(form).language) ? ssrLooseContain(unref(form).language, "fr") : ssrLooseEqual(unref(form).language, "fr")) ? " selected" : ""}>${ssrInterpolate(unref(t)("lang.fr"))}</option><option value="de" data-v-9d19690d${ssrIncludeBooleanAttr(Array.isArray(unref(form).language) ? ssrLooseContain(unref(form).language, "de") : ssrLooseEqual(unref(form).language, "de")) ? " selected" : ""}>${ssrInterpolate(unref(t)("lang.de"))}</option><option value="es" data-v-9d19690d${ssrIncludeBooleanAttr(Array.isArray(unref(form).language) ? ssrLooseContain(unref(form).language, "es") : ssrLooseEqual(unref(form).language, "es")) ? " selected" : ""}>${ssrInterpolate(unref(t)("lang.es"))}</option><option value="ru" data-v-9d19690d${ssrIncludeBooleanAttr(Array.isArray(unref(form).language) ? ssrLooseContain(unref(form).language, "ru") : ssrLooseEqual(unref(form).language, "ru")) ? " selected" : ""}>${ssrInterpolate(unref(t)("lang.ru"))}</option></select></div><div data-v-9d19690d><label class="mb-1.5 block text-xs font-medium text-ink-600" data-v-9d19690d>${ssrInterpolate(unref(t)("admin.poemForm.source"))}</label><select class="admin-input" data-v-9d19690d><option value="classic" data-v-9d19690d${ssrIncludeBooleanAttr(Array.isArray(unref(form).source) ? ssrLooseContain(unref(form).source, "classic") : ssrLooseEqual(unref(form).source, "classic")) ? " selected" : ""}>${ssrInterpolate(unref(t)("admin.poemForm.sources.classic"))}</option><option value="ai-generated" data-v-9d19690d${ssrIncludeBooleanAttr(Array.isArray(unref(form).source) ? ssrLooseContain(unref(form).source, "ai-generated") : ssrLooseEqual(unref(form).source, "ai-generated")) ? " selected" : ""}>${ssrInterpolate(unref(t)("admin.poemForm.sources.ai"))}</option><option value="user-submitted" data-v-9d19690d${ssrIncludeBooleanAttr(Array.isArray(unref(form).source) ? ssrLooseContain(unref(form).source, "user-submitted") : ssrLooseEqual(unref(form).source, "user-submitted")) ? " selected" : ""}>${ssrInterpolate(unref(t)("admin.poemForm.sources.user"))}</option><option value="imported" data-v-9d19690d${ssrIncludeBooleanAttr(Array.isArray(unref(form).source) ? ssrLooseContain(unref(form).source, "imported") : ssrLooseEqual(unref(form).source, "imported")) ? " selected" : ""}>${ssrInterpolate(unref(t)("admin.poemForm.sources.imported"))}</option></select></div></div><div data-v-9d19690d><label class="mb-1.5 block text-xs font-medium text-ink-600" data-v-9d19690d>${ssrInterpolate(unref(t)("admin.poemForm.sourceUrl"))} <span class="text-ink-700" data-v-9d19690d>${ssrInterpolate(unref(t)("admin.poemForm.optional"))}</span></label><input${ssrRenderAttr("value", unref(form).sourceUrl)} type="url" class="admin-input" placeholder="https://\u2026" data-v-9d19690d></div>`);
      if ((_b = unref(tags)) == null ? void 0 : _b.length) {
        _push(`<div data-v-9d19690d><label class="mb-2 block text-xs font-medium text-ink-600" data-v-9d19690d>${ssrInterpolate(unref(t)("admin.poemForm.tags"))}</label><div class="flex flex-wrap gap-1.5" data-v-9d19690d><!--[-->`);
        ssrRenderList(unref(tags), (tag) => {
          _push(`<button type="button" class="${ssrRenderClass([unref(form).tagIds.includes(tag.id) ? "border-amber-300 bg-amber-50 text-amber-900" : "border-ink-200 bg-white text-ink-600 hover:border-ink-300", "rounded-full border px-3 py-0.5 text-xs transition-colors"])}" data-v-9d19690d>${ssrInterpolate(unref(labelForTag)(tag.slug, tag.name))}</button>`);
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<label class="flex cursor-pointer items-center gap-3" data-v-9d19690d><input${ssrIncludeBooleanAttr(Array.isArray(unref(form).featured) ? ssrLooseContain(unref(form).featured, null) : unref(form).featured) ? " checked" : ""} type="checkbox" class="h-4 w-4 rounded border-ink-300 accent-gold-600" data-v-9d19690d><span class="text-sm text-ink-700" data-v-9d19690d>${ssrInterpolate(unref(t)("admin.poemForm.featuredNew"))}</span></label><div class="flex gap-3 pt-2" data-v-9d19690d><button type="submit"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""} class="rounded-lg bg-gold-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gold-700 disabled:opacity-50" data-v-9d19690d>${ssrInterpolate(unref(loading) ? unref(t)("admin.poemForm.saving") : unref(t)("admin.poemForm.create"))}</button>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/admin/poems/new.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _new = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-9d19690d"]]);

export { _new as default };
//# sourceMappingURL=new-hs7ibvsN.mjs.map
