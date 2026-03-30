import { _ as __nuxt_component_0 } from './nuxt-link-BHo5EKPq.mjs';
import { defineComponent, ref, withAsyncContext, computed, reactive, mergeProps, withCtx, unref, createTextVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderAttr, ssrIncludeBooleanAttr } from 'vue/server-renderer';
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
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
    let __temp, __restore;
    const { t } = useI18n();
    const route = useRoute();
    useRouter();
    const slug = route.params.slug;
    const loading = ref(false);
    const error = ref("");
    const { data } = ([__temp, __restore] = withAsyncContext(() => useFetch(
      `/api/authors/${slug}`,
      "$NULldVYU9y"
      /* nuxt-injected */
    )), __temp = await __temp, __restore(), __temp);
    if (!data.value) throw createError({ statusCode: 404 });
    const author = computed(() => {
      var _a2;
      return (_a2 = data.value) == null ? void 0 : _a2.author;
    });
    useSeoMeta({ title: computed(() => {
      var _a2, _b2;
      return t("seo.adminEditAuthor", { name: (_b2 = (_a2 = author.value) == null ? void 0 : _a2.name) != null ? _b2 : "" });
    }) });
    const form = reactive({
      name: (_b = (_a = author.value) == null ? void 0 : _a.name) != null ? _b : "",
      bio: (_d = (_c = author.value) == null ? void 0 : _c.bio) != null ? _d : "",
      nationality: (_f = (_e = author.value) == null ? void 0 : _e.nationality) != null ? _f : "",
      birthYear: (_h = (_g = author.value) == null ? void 0 : _g.birthYear) != null ? _h : null,
      deathYear: (_j = (_i = author.value) == null ? void 0 : _i.deathYear) != null ? _j : null,
      imageUrl: (_l = (_k = author.value) == null ? void 0 : _k.imageUrl) != null ? _l : ""
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "w-full" }, _attrs))} data-v-c9319d7e><div class="mb-6 flex items-center gap-4" data-v-c9319d7e>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/admin/authors",
        class: "text-sm text-ink-600 hover:text-ink-900"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`${ssrInterpolate(unref(t)("admin.authors.backList"))}`);
          } else {
            return [
              createTextVNode(toDisplayString(unref(t)("admin.authors.backList")), 1)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<h1 class="truncate font-serif text-xl font-bold text-ink-900" data-v-c9319d7e>${ssrInterpolate(unref(t)("admin.authors.editTitle", { name: unref(form).name }))}</h1></div><form class="space-y-5" data-v-c9319d7e>`);
      if (unref(error)) {
        _push(`<div class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" data-v-c9319d7e>${ssrInterpolate(unref(error))}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div data-v-c9319d7e><label class="mb-1.5 block text-xs font-medium text-ink-600" data-v-c9319d7e>${ssrInterpolate(unref(t)("admin.authors.name"))}</label><input${ssrRenderAttr("value", unref(form).name)} type="text" required class="admin-input" data-v-c9319d7e></div><div data-v-c9319d7e><label class="mb-1.5 block text-xs font-medium text-ink-600" data-v-c9319d7e>${ssrInterpolate(unref(t)("admin.authors.bio"))}</label><textarea rows="4" class="admin-input" data-v-c9319d7e>${ssrInterpolate(unref(form).bio)}</textarea></div><div data-v-c9319d7e><label class="mb-1.5 block text-xs font-medium text-ink-600" data-v-c9319d7e>${ssrInterpolate(unref(t)("admin.authors.nationality"))}</label><input${ssrRenderAttr("value", unref(form).nationality)} type="text" class="admin-input" data-v-c9319d7e></div><div class="grid grid-cols-2 gap-4" data-v-c9319d7e><div data-v-c9319d7e><label class="mb-1.5 block text-xs font-medium text-ink-600" data-v-c9319d7e>${ssrInterpolate(unref(t)("admin.authors.birthYear"))}</label><input${ssrRenderAttr("value", unref(form).birthYear)} type="number" class="admin-input" data-v-c9319d7e></div><div data-v-c9319d7e><label class="mb-1.5 block text-xs font-medium text-ink-600" data-v-c9319d7e>${ssrInterpolate(unref(t)("admin.authors.deathYear"))}</label><input${ssrRenderAttr("value", unref(form).deathYear)} type="number" class="admin-input" data-v-c9319d7e></div></div><div data-v-c9319d7e><label class="mb-1.5 block text-xs font-medium text-ink-600" data-v-c9319d7e>${ssrInterpolate(unref(t)("admin.authors.photoUrl"))}</label><input${ssrRenderAttr("value", unref(form).imageUrl)} type="url" class="admin-input" placeholder="https://\u2026" data-v-c9319d7e></div><div class="flex gap-3 pt-2" data-v-c9319d7e><button type="submit"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""} class="rounded-lg bg-gold-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gold-700 disabled:opacity-50" data-v-c9319d7e>${ssrInterpolate(unref(loading) ? unref(t)("admin.authors.saving") : unref(t)("admin.authors.save"))}</button>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/admin/authors",
        class: "rounded-lg border border-ink-200 bg-white px-5 py-2.5 text-sm text-ink-600 hover:border-ink-300 hover:text-ink-900"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`${ssrInterpolate(unref(t)("admin.authors.cancel"))}`);
          } else {
            return [
              createTextVNode(toDisplayString(unref(t)("admin.authors.cancel")), 1)
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/admin/authors/[slug].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _slug_ = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-c9319d7e"]]);

export { _slug_ as default };
//# sourceMappingURL=_slug_-BZXRJJ84.mjs.map
