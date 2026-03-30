import { _ as __nuxt_component_0$1 } from './nuxt-link-BHo5EKPq.mjs';
import { _ as _sfc_main$3 } from './LanguageSwitch-BQbsmeO0.mjs';
import { useSSRContext, defineComponent, ref, computed, watch, mergeProps, withCtx, createVNode, createTextVNode, unref, toDisplayString, openBlock, createBlock } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList, ssrInterpolate, ssrRenderAttr, ssrRenderSlot } from 'vue/server-renderer';
import { a as useI18n, d as useRoute } from './server.mjs';
import { u as useAuth } from './useAuth-ClZa9bEg.mjs';
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

const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "AppNav",
  __ssrInlineRender: true,
  setup(__props) {
    const { t } = useI18n();
    const mobileOpen = ref(false);
    const route = useRoute();
    const { user, isLoggedIn } = useAuth();
    const userMenuOpen = ref(false);
    const navLinks = computed(() => [
      { label: t("nav.poems"), to: "/poems" },
      { label: t("nav.authors"), to: "/authors" },
      { label: t("nav.search"), to: "/search" },
      { label: t("nav.daily"), to: "/daily" }
    ]);
    watch(() => route.path, () => {
      mobileOpen.value = false;
      userMenuOpen.value = false;
    });
    ref(null);
    const displayName = computed(() => {
      var _a, _b, _c;
      return ((_a = user.value) == null ? void 0 : _a.name) || ((_c = (_b = user.value) == null ? void 0 : _b.email) == null ? void 0 : _c.split("@")[0]) || "";
    });
    const initials = computed(() => {
      var _a, _b;
      const n = ((_a = user.value) == null ? void 0 : _a.name) || ((_b = user.value) == null ? void 0 : _b.email) || "?";
      return n.slice(0, 2).toUpperCase();
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0$1;
      const _component_LanguageSwitch = _sfc_main$3;
      _push(`<header${ssrRenderAttrs(mergeProps({ class: "sticky top-0 z-40 w-full border-b border-ink-200/80 bg-ink-50/95 backdrop-blur-md" }, _attrs))} data-v-b6de50f7><div class="flex w-full items-center justify-between px-4 py-4 md:px-6" data-v-b6de50f7>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "group flex items-center gap-2"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<span class="font-serif text-xl font-bold text-gold-700 transition-opacity group-hover:opacity-80" data-v-b6de50f7${_scopeId}> Poetry<span class="text-ink-900" data-v-b6de50f7${_scopeId}>Hub</span></span>`);
          } else {
            return [
              createVNode("span", { class: "font-serif text-xl font-bold text-gold-700 transition-opacity group-hover:opacity-80" }, [
                createTextVNode(" Poetry"),
                createVNode("span", { class: "text-ink-900" }, "Hub")
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<nav class="hidden items-center gap-6 md:flex" data-v-b6de50f7><!--[-->`);
      ssrRenderList(unref(navLinks), (link) => {
        _push(ssrRenderComponent(_component_NuxtLink, {
          key: link.to,
          to: link.to,
          class: "text-sm text-ink-600 transition-colors hover:text-ink-900",
          "active-class": "text-ink-900 font-medium"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(link.label)}`);
            } else {
              return [
                createTextVNode(toDisplayString(link.label), 1)
              ];
            }
          }),
          _: 2
        }, _parent));
      });
      _push(`<!--]--></nav><div class="hidden items-center gap-3 md:flex" data-v-b6de50f7>`);
      _push(ssrRenderComponent(_component_LanguageSwitch, null, null, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/search",
        class: "rounded-full border border-ink-200 bg-white p-2 text-ink-600 transition-colors hover:border-ink-300 hover:text-ink-900",
        "aria-label": unref(t)("nav.search")
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" data-v-b6de50f7${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" data-v-b6de50f7${_scopeId}></path></svg>`);
          } else {
            return [
              (openBlock(), createBlock("svg", {
                class: "h-4 w-4",
                fill: "none",
                viewBox: "0 0 24 24",
                stroke: "currentColor",
                "stroke-width": "2"
              }, [
                createVNode("path", {
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round",
                  d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                })
              ]))
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/favorites",
        class: "rounded-full border border-ink-200 bg-white p-2 text-ink-600 transition-colors hover:border-rose-300 hover:text-rose-700",
        "aria-label": unref(t)("nav.favorites")
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" data-v-b6de50f7${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" data-v-b6de50f7${_scopeId}></path></svg>`);
          } else {
            return [
              (openBlock(), createBlock("svg", {
                class: "h-4 w-4",
                fill: "none",
                viewBox: "0 0 24 24",
                stroke: "currentColor",
                "stroke-width": "2"
              }, [
                createVNode("path", {
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round",
                  d: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                })
              ]))
            ];
          }
        }),
        _: 1
      }, _parent));
      if (!unref(isLoggedIn)) {
        _push(`<!--[-->`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/login",
          class: "text-sm text-ink-600 transition-colors hover:text-ink-900"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(unref(t)("nav.signIn"))}`);
            } else {
              return [
                createTextVNode(toDisplayString(unref(t)("nav.signIn")), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/signup",
          class: "rounded-lg bg-gold-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gold-600"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(unref(t)("nav.signUp"))}`);
            } else {
              return [
                createTextVNode(toDisplayString(unref(t)("nav.signUp")), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<!--]-->`);
      } else {
        _push(`<div class="relative" data-v-b6de50f7><button class="flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-800 transition hover:border-ink-300" data-v-b6de50f7><span class="flex h-6 w-6 items-center justify-center rounded-full bg-gold-500 text-xs font-bold text-white" data-v-b6de50f7>${ssrInterpolate(unref(initials))}</span><span class="max-w-[120px] truncate" data-v-b6de50f7>${ssrInterpolate(unref(displayName))}</span><svg class="h-3 w-3 text-ink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" data-v-b6de50f7><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" data-v-b6de50f7></path></svg></button>`);
        if (unref(userMenuOpen)) {
          _push(`<div class="absolute right-0 mt-2 w-44 rounded-xl border border-ink-200 bg-white py-1 shadow-lg" data-v-b6de50f7>`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "/favorites",
            class: "flex items-center gap-2 px-4 py-2 text-sm text-ink-600 hover:bg-ink-50 hover:text-ink-900"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" data-v-b6de50f7${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" data-v-b6de50f7${_scopeId}></path></svg> ${ssrInterpolate(unref(t)("nav.favorites"))}`);
              } else {
                return [
                  (openBlock(), createBlock("svg", {
                    class: "h-4 w-4",
                    fill: "none",
                    viewBox: "0 0 24 24",
                    stroke: "currentColor",
                    "stroke-width": "2"
                  }, [
                    createVNode("path", {
                      "stroke-linecap": "round",
                      "stroke-linejoin": "round",
                      d: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    })
                  ])),
                  createTextVNode(" " + toDisplayString(unref(t)("nav.favorites")), 1)
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(`<hr class="my-1 border-ink-100" data-v-b6de50f7><button class="flex w-full items-center gap-2 px-4 py-2 text-sm text-ink-600 hover:bg-ink-50 hover:text-red-600" data-v-b6de50f7><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" data-v-b6de50f7><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" data-v-b6de50f7></path></svg> ${ssrInterpolate(unref(t)("nav.signOut"))}</button></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      }
      _push(`</div><div class="flex items-center gap-2 md:hidden" data-v-b6de50f7>`);
      _push(ssrRenderComponent(_component_LanguageSwitch, null, null, _parent));
      _push(`<button type="button" class="rounded-lg border border-ink-200 bg-white p-2 text-ink-600"${ssrRenderAttr("aria-expanded", unref(mobileOpen))}${ssrRenderAttr("aria-label", unref(mobileOpen) ? unref(t)("a11y.closeMenu") : unref(t)("a11y.openMenu"))} data-v-b6de50f7><svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" data-v-b6de50f7>`);
      if (!unref(mobileOpen)) {
        _push(`<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" data-v-b6de50f7></path>`);
      } else {
        _push(`<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" data-v-b6de50f7></path>`);
      }
      _push(`</svg></button></div></div>`);
      if (unref(mobileOpen)) {
        _push(`<div class="border-t border-ink-200 bg-ink-50 px-4 py-4 md:hidden" data-v-b6de50f7><nav class="flex flex-col gap-3" data-v-b6de50f7><!--[-->`);
        ssrRenderList(unref(navLinks), (link) => {
          _push(ssrRenderComponent(_component_NuxtLink, {
            key: link.to,
            to: link.to,
            class: "rounded-lg px-3 py-2 text-sm text-ink-600 transition-colors hover:bg-white hover:text-ink-900",
            "active-class": "bg-white text-ink-900 shadow-sm"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`${ssrInterpolate(link.label)}`);
              } else {
                return [
                  createTextVNode(toDisplayString(link.label), 1)
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]-->`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/favorites",
          class: "rounded-lg px-3 py-2 text-sm text-ink-600 hover:bg-white hover:text-rose-700"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(unref(t)("nav.favorites"))}`);
            } else {
              return [
                createTextVNode(toDisplayString(unref(t)("nav.favorites")), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<hr class="border-ink-200" data-v-b6de50f7>`);
        if (!unref(isLoggedIn)) {
          _push(`<!--[-->`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "/login",
            class: "rounded-lg px-3 py-2 text-sm text-ink-600 hover:bg-white hover:text-ink-900"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`${ssrInterpolate(unref(t)("nav.signIn"))}`);
              } else {
                return [
                  createTextVNode(toDisplayString(unref(t)("nav.signIn")), 1)
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "/signup",
            class: "rounded-lg bg-gold-500 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gold-600"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`${ssrInterpolate(unref(t)("nav.signUp"))}`);
              } else {
                return [
                  createTextVNode(toDisplayString(unref(t)("nav.signUp")), 1)
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(`<!--]-->`);
        } else {
          _push(`<!--[--><div class="px-3 py-1 text-xs text-ink-500" data-v-b6de50f7>${ssrInterpolate(unref(t)("nav.signedInAs", { name: unref(displayName) }))}</div><button class="rounded-lg px-3 py-2 text-left text-sm text-ink-600 hover:bg-white hover:text-red-600" data-v-b6de50f7>${ssrInterpolate(unref(t)("nav.signOut"))}</button><!--]-->`);
        }
        _push(`</nav></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</header>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/AppNav.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_0 = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["__scopeId", "data-v-b6de50f7"]]);
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "AppFooter",
  __ssrInlineRender: true,
  setup(__props) {
    const { t } = useI18n();
    const year = (/* @__PURE__ */ new Date()).getFullYear();
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<footer${ssrRenderAttrs(mergeProps({ class: "mt-24 w-full border-t border-ink-200 py-10" }, _attrs))}><div class="w-full px-4 md:px-6"><div class="flex flex-col items-center justify-between gap-4 md:flex-row"><p class="font-serif text-sm italic text-ink-600">${ssrInterpolate(unref(t)("footer.quote"))}</p><div class="flex gap-6 text-xs text-ink-500">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/poems",
        class: "hover:text-ink-800"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`${ssrInterpolate(unref(t)("footer.poems"))}`);
          } else {
            return [
              createTextVNode(toDisplayString(unref(t)("footer.poems")), 1)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/authors",
        class: "hover:text-ink-800"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`${ssrInterpolate(unref(t)("footer.authors"))}`);
          } else {
            return [
              createTextVNode(toDisplayString(unref(t)("footer.authors")), 1)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/daily",
        class: "hover:text-ink-800"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`${ssrInterpolate(unref(t)("footer.dailyPoem"))}`);
          } else {
            return [
              createTextVNode(toDisplayString(unref(t)("footer.dailyPoem")), 1)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/admin",
        class: "hover:text-ink-800"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`${ssrInterpolate(unref(t)("footer.admin"))}`);
          } else {
            return [
              createTextVNode(toDisplayString(unref(t)("footer.admin")), 1)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div><p class="mt-4 text-center text-xs text-ink-400">${ssrInterpolate(unref(t)("footer.copyright", { year: unref(year) }))}</p></div></footer>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/AppFooter.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  const _component_AppNav = __nuxt_component_0;
  const _component_AppFooter = _sfc_main$1;
  _push(`<div${ssrRenderAttrs(mergeProps({ class: "w-full" }, _attrs))}>`);
  _push(ssrRenderComponent(_component_AppNav, null, null, _parent));
  _push(`<main class="w-full px-4 py-10 md:px-6 md:py-12">`);
  ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
  _push(`</main>`);
  _push(ssrRenderComponent(_component_AppFooter, null, null, _parent));
  _push(`</div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/default.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _default = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);

export { _default as default };
//# sourceMappingURL=default-DvwKSiNz.mjs.map
