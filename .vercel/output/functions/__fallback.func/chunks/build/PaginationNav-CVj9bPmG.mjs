import { defineComponent, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrIncludeBooleanAttr, ssrRenderAttr, ssrRenderList, ssrRenderClass, ssrInterpolate } from 'vue/server-renderer';
import { a as useI18n } from './server.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "PaginationNav",
  __ssrInlineRender: true,
  props: {
    page: {},
    totalPages: {},
    loading: { type: Boolean }
  },
  emits: ["update:page"],
  setup(__props, { emit: __emit }) {
    const { t } = useI18n();
    const props = __props;
    const visiblePages = computed(() => {
      const total = props.totalPages;
      if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
      const cur = props.page;
      const pages = [1];
      if (cur > 3) pages.push("...");
      for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i);
      if (cur < total - 2) pages.push("...");
      pages.push(total);
      return pages;
    });
    return (_ctx, _push, _parent, _attrs) => {
      if (__props.totalPages > 1) {
        _push(`<nav${ssrRenderAttrs(mergeProps({ class: "flex items-center justify-center gap-1" }, _attrs))}><button type="button" class="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-600 shadow-sm transition-colors hover:border-ink-300 hover:text-ink-900 disabled:opacity-30"${ssrIncludeBooleanAttr(__props.page === 1 || __props.loading) ? " disabled" : ""}${ssrRenderAttr("aria-label", unref(t)("pagination.previous"))}> \u2190 </button><!--[-->`);
        ssrRenderList(unref(visiblePages), (p) => {
          _push(`<!--[-->`);
          if (p === "...") {
            _push(`<span class="px-2 text-ink-400">\u2026</span>`);
          } else {
            _push(`<button class="${ssrRenderClass([p === __props.page ? "border-amber-300 bg-amber-50 text-amber-900" : "border-ink-200 bg-white text-ink-600 hover:border-ink-300 hover:text-ink-900", "rounded-lg border px-3 py-1.5 text-sm shadow-sm transition-colors"])}"${ssrIncludeBooleanAttr(__props.loading) ? " disabled" : ""}>${ssrInterpolate(p)}</button>`);
          }
          _push(`<!--]-->`);
        });
        _push(`<!--]--><button type="button" class="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-600 shadow-sm transition-colors hover:border-ink-300 hover:text-ink-900 disabled:opacity-30"${ssrIncludeBooleanAttr(__props.page === __props.totalPages || __props.loading) ? " disabled" : ""}${ssrRenderAttr("aria-label", unref(t)("pagination.next"))}> \u2192 </button></nav>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/PaginationNav.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as _ };
//# sourceMappingURL=PaginationNav-CVj9bPmG.mjs.map
