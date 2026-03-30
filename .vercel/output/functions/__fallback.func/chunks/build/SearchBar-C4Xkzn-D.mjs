import { defineComponent, ref, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderAttr } from 'vue/server-renderer';
import { a as useI18n } from './server.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "SearchBar",
  __ssrInlineRender: true,
  props: {
    modelValue: {},
    placeholder: {},
    autofocus: { type: Boolean }
  },
  emits: ["update:modelValue", "search", "clear"],
  setup(__props, { emit: __emit }) {
    const { t } = useI18n();
    const props = __props;
    const emit = __emit;
    ref(null);
    const value = computed({
      get: () => {
        var _a;
        return (_a = props.modelValue) != null ? _a : "";
      },
      set: (v) => emit("update:modelValue", v)
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a;
      _push(`<form${ssrRenderAttrs(mergeProps({ class: "relative w-full" }, _attrs))}><svg class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg><input${ssrRenderAttr("value", unref(value))} type="text"${ssrRenderAttr("placeholder", (_a = __props.placeholder) != null ? _a : unref(t)("search.placeholder"))} class="w-full rounded-full border border-ink-200 bg-white py-3 pl-11 pr-10 text-sm text-ink-900 placeholder-ink-400 shadow-sm outline-none ring-0 transition-colors focus:border-gold-400 focus:ring-2 focus:ring-gold-300/40">`);
      if (unref(value)) {
        _push(`<button type="button" class="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg></button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</form>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/SearchBar.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as _ };
//# sourceMappingURL=SearchBar-C4Xkzn-D.mjs.map
