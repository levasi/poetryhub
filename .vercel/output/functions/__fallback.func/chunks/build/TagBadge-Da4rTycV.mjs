import { defineComponent, computed, createVNode, resolveDynamicComponent, unref, mergeProps, withCtx, createTextVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderVNode, ssrInterpolate } from 'vue/server-renderer';
import { u as useTagLabel } from './useTagLabel-DPQ2hw0Y.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "TagBadge",
  __ssrInlineRender: true,
  props: {
    name: {},
    slug: {},
    link: { type: Boolean, default: void 0 },
    color: {},
    active: { type: Boolean },
    clickable: { type: Boolean }
  },
  emits: ["click"],
  setup(__props) {
    const props = __props;
    const { labelForTag } = useTagLabel();
    const displayName = computed(
      () => props.slug ? labelForTag(props.slug, props.name) : props.name
    );
    const useRouterLink = computed(() => {
      if (!props.slug) return false;
      if (props.link === false) return false;
      return true;
    });
    return (_ctx, _push, _parent, _attrs) => {
      ssrRenderVNode(_push, createVNode(resolveDynamicComponent(unref(useRouterLink) ? "NuxtLink" : "span"), mergeProps({
        to: unref(useRouterLink) ? `/poems?tag=${__props.slug}` : void 0,
        class: ["inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium tracking-wide transition-colors", [
          __props.clickable || unref(useRouterLink) ? "cursor-pointer hover:opacity-90" : "cursor-default",
          __props.active ? "bg-amber-100 text-amber-900 ring-1 ring-amber-400/60" : "border border-ink-200 bg-white text-ink-700 shadow-sm"
        ]],
        style: __props.color && !__props.active ? `background-color:${__props.color}22;color:${__props.color};border-color:${__props.color}55` : "",
        onClick: ($event) => _ctx.$emit("click")
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`${ssrInterpolate(unref(displayName))}`);
          } else {
            return [
              createTextVNode(toDisplayString(unref(displayName)), 1)
            ];
          }
        }),
        _: 1
      }), _parent);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/TagBadge.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as _ };
//# sourceMappingURL=TagBadge-Da4rTycV.mjs.map
