import { _ as __nuxt_component_0 } from './nuxt-link-BHo5EKPq.mjs';
import { defineComponent, computed, ref, reactive, mergeProps, withCtx, unref, createTextVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderAttr, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import { a as useI18n, b as useSeoMeta, c as useRouter } from './server.mjs';
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

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "new",
  __ssrInlineRender: true,
  setup(__props) {
    const { t } = useI18n();
    useSeoMeta({ title: computed(() => t("seo.adminNewAuthor")) });
    useRouter();
    const loading = ref(false);
    const error = ref("");
    const form = reactive({
      name: "",
      bio: "",
      nationality: "",
      birthYear: null,
      deathYear: null,
      imageUrl: ""
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "w-full" }, _attrs))} data-v-05d30e49><div class="mb-6 flex items-center gap-4" data-v-05d30e49>`);
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
      _push(`<h1 class="font-serif text-2xl font-bold text-ink-900" data-v-05d30e49>${ssrInterpolate(unref(t)("admin.authors.newTitle"))}</h1></div><form class="space-y-5" data-v-05d30e49>`);
      if (unref(error)) {
        _push(`<div class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" data-v-05d30e49>${ssrInterpolate(unref(error))}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div data-v-05d30e49><label class="mb-1.5 block text-xs font-medium text-ink-600" data-v-05d30e49>${ssrInterpolate(unref(t)("admin.authors.nameRequired"))}</label><input${ssrRenderAttr("value", unref(form).name)} type="text" required class="admin-input"${ssrRenderAttr("placeholder", unref(t)("admin.authors.placeholderName"))} data-v-05d30e49></div><div data-v-05d30e49><label class="mb-1.5 block text-xs font-medium text-ink-600" data-v-05d30e49>${ssrInterpolate(unref(t)("admin.authors.bio"))}</label><textarea rows="4" class="admin-input"${ssrRenderAttr("placeholder", unref(t)("admin.authors.placeholderBio"))} data-v-05d30e49>${ssrInterpolate(unref(form).bio)}</textarea></div><div data-v-05d30e49><label class="mb-1.5 block text-xs font-medium text-ink-600" data-v-05d30e49>${ssrInterpolate(unref(t)("admin.authors.nationality"))}</label><input${ssrRenderAttr("value", unref(form).nationality)} type="text" class="admin-input"${ssrRenderAttr("placeholder", unref(t)("admin.authors.placeholderNationality"))} data-v-05d30e49></div><div class="grid grid-cols-2 gap-4" data-v-05d30e49><div data-v-05d30e49><label class="mb-1.5 block text-xs font-medium text-ink-600" data-v-05d30e49>${ssrInterpolate(unref(t)("admin.authors.birthYear"))}</label><input${ssrRenderAttr("value", unref(form).birthYear)} type="number" min="500" max="2024" class="admin-input" placeholder="1874" data-v-05d30e49></div><div data-v-05d30e49><label class="mb-1.5 block text-xs font-medium text-ink-600" data-v-05d30e49>${ssrInterpolate(unref(t)("admin.authors.deathYear"))}</label><input${ssrRenderAttr("value", unref(form).deathYear)} type="number" min="500" max="2024" class="admin-input" placeholder="1963" data-v-05d30e49></div></div><div data-v-05d30e49><label class="mb-1.5 block text-xs font-medium text-ink-600" data-v-05d30e49>${ssrInterpolate(unref(t)("admin.authors.photoUrl"))} <span class="text-ink-700" data-v-05d30e49>${ssrInterpolate(unref(t)("admin.poemForm.optional"))}</span></label><input${ssrRenderAttr("value", unref(form).imageUrl)} type="url" class="admin-input" placeholder="https://\u2026" data-v-05d30e49></div><div class="flex gap-3 pt-2" data-v-05d30e49><button type="submit"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""} class="rounded-lg bg-gold-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gold-700 disabled:opacity-50" data-v-05d30e49>${ssrInterpolate(unref(loading) ? unref(t)("admin.authors.saving") : unref(t)("admin.authors.create"))}</button>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/admin/authors/new.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _new = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-05d30e49"]]);

export { _new as default };
//# sourceMappingURL=new-B8VP5M6K.mjs.map
