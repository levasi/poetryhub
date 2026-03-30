import { defineComponent, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderList, ssrRenderClass, ssrRenderAttr, ssrInterpolate } from 'vue/server-renderer';
import { a as useI18n } from './server.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "LanguageSwitch",
  __ssrInlineRender: true,
  setup(__props) {
    const { locale, locales, setLocale } = useI18n();
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: "flex items-center gap-0.5 rounded-lg border border-ink-200 bg-white p-0.5 text-xs shadow-sm",
        role: "group",
        "aria-label": _ctx.$t("nav.language")
      }, _attrs))}><!--[-->`);
      ssrRenderList(unref(locales), (l) => {
        _push(`<button type="button" class="${ssrRenderClass([
          "rounded-md px-2 py-1 font-medium transition-colors",
          unref(locale) === l.code ? "bg-gold-500 text-white" : "text-ink-600 hover:text-ink-900"
        ])}"${ssrRenderAttr("aria-pressed", unref(locale) === l.code)}>${ssrInterpolate(l.code === "ro" ? "RO" : "EN")}</button>`);
      });
      _push(`<!--]--></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/LanguageSwitch.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as _ };
//# sourceMappingURL=LanguageSwitch-BQbsmeO0.mjs.map
