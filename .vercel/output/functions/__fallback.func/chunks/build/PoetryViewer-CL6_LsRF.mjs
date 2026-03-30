import { _ as __nuxt_component_0 } from './nuxt-link-BHo5EKPq.mjs';
import { defineComponent, computed, ref, unref, withCtx, createTextVNode, toDisplayString, createVNode, watch, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderStyle, ssrRenderList, ssrRenderComponent, ssrInterpolate, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderClass, ssrRenderTeleport } from 'vue/server-renderer';
import { u as useFavorites } from './useFavorites-CibuQ2Wz.mjs';
import { u as useAuth } from './useAuth-ClZa9bEg.mjs';
import { u as useTagLabel } from './useTagLabel-DPQ2hw0Y.mjs';
import { a as authorAvatarUrl } from './authorAvatar-BAkG-5wq.mjs';
import { a as useI18n } from './server.mjs';
import { _ as _export_sfc } from './_plugin-vue_export-helper-1tPrXgE0.mjs';

const READER_FONT_STACKS = {
  playfair: "'Playfair Display', Georgia, 'Times New Roman', serif",
  georgia: "Georgia, 'Times New Roman', serif",
  inter: "'Inter', system-ui, sans-serif",
  lora: "'Lora', Georgia, serif"
};
function isFontKey(v) {
  return v in READER_FONT_STACKS;
}
function prefsFromUser(u) {
  if (!u || !("poemFontFamily" in u) || !u.poemFontFamily) return null;
  if (!isFontKey(u.poemFontFamily)) return null;
  const size = typeof u.poemFontSize === "number" ? u.poemFontSize : 19;
  return { font: u.poemFontFamily, size: Math.min(28, Math.max(14, size)) };
}
function useReaderPreferences() {
  const { user, isLoggedIn } = useAuth();
  const fontKey = ref("playfair");
  const fontSizePx = ref(19);
  const fontFamilyCss = computed(() => READER_FONT_STACKS[fontKey.value]);
  function applyFromUserOrLocal() {
    const fromUser = prefsFromUser(user.value);
    if (fromUser) {
      fontKey.value = fromUser.font;
      fontSizePx.value = fromUser.size;
      return;
    }
  }
  watch(
    () => user.value,
    () => {
      applyFromUserOrLocal();
    },
    { immediate: true }
  );
  let saveTimer = null;
  async function saveToAccount() {
    if (!isLoggedIn.value) return;
    try {
      await $fetch("/api/user/me/preferences", {
        method: "PATCH",
        body: { poemFontFamily: fontKey.value, poemFontSize: fontSizePx.value }
      });
      if (user.value) {
        user.value = {
          ...user.value,
          poemFontFamily: fontKey.value,
          poemFontSize: fontSizePx.value
        };
      }
    } catch {
    }
  }
  function onReaderPreferenceChange() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveTimer = null;
      void saveToAccount();
    }, 450);
  }
  const poemBodyStyle = computed(() => ({
    whiteSpace: "pre-wrap",
    fontFamily: fontFamilyCss.value,
    fontSize: `${fontSizePx.value}px`,
    lineHeight: 1.95,
    color: "#2d2d26",
    letterSpacing: "0.02em"
  }));
  const stanzaSlideStyle = computed(() => ({
    whiteSpace: "pre-wrap",
    fontFamily: fontFamilyCss.value,
    fontSize: `clamp(${Math.max(14, fontSizePx.value - 2)}px, 3vw, ${fontSizePx.value + 4}px)`,
    lineHeight: 2.05,
    color: "#2d2d26",
    letterSpacing: "0.02em"
  }));
  return {
    fontKey,
    fontSizePx,
    fontFamilyCss,
    poemBodyStyle,
    stanzaSlideStyle,
    onReaderPreferenceChange,
    fontOptions: ["playfair", "georgia", "inter", "lora"]
  };
}
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "PoetryViewer",
  __ssrInlineRender: true,
  props: {
    poem: {}
  },
  setup(__props) {
    const { t, te } = useI18n();
    const { labelForTag } = useTagLabel();
    const { isLoggedIn } = useAuth();
    const props = __props;
    const {
      fontKey,
      fontSizePx,
      poemBodyStyle,
      stanzaSlideStyle,
      fontOptions
    } = useReaderPreferences();
    const author = computed(() => props.poem.author);
    const authorAvatar = computed(() => authorAvatarUrl(author.value));
    const { isFavorite } = useFavorites();
    const liked = computed(() => isFavorite(props.poem.id));
    const stanzas = computed(
      () => props.poem.content.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean)
    );
    const progress = ref(0);
    const slideMode = ref(false);
    const currentSlide = ref(0);
    const tags = computed(() => {
      var _a, _b;
      return (_b = (_a = props.poem.poemTags) == null ? void 0 : _a.map((pt) => pt.tag)) != null ? _b : [];
    });
    const readingTimeLabel = computed(() => {
      if (!props.poem.readingTime) return null;
      const mins = Math.ceil(props.poem.readingTime / 60);
      return mins < 1 ? t("viewer.underMin") : t("viewer.minRead", { n: mins });
    });
    const langLabel = computed(() => {
      const code = props.poem.language;
      if (code === "en") return null;
      const key = `lang.${code}`;
      return te(key) ? t(key) : code.toUpperCase();
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(_attrs)} data-v-fc8331ea><div class="fixed left-0 top-0 z-50 h-0.5 w-full bg-ink-200/80 pointer-events-none" data-v-fc8331ea><div class="h-full bg-gold-500 transition-all duration-100" style="${ssrRenderStyle({ width: `${unref(progress)}%` })}" data-v-fc8331ea></div></div>`);
      if (!unref(slideMode)) {
        _push(`<div class="animate-fade-in" data-v-fc8331ea>`);
        if (unref(tags).length) {
          _push(`<div class="mb-8 flex flex-wrap gap-2" data-v-fc8331ea><!--[-->`);
          ssrRenderList(unref(tags), (tag) => {
            _push(ssrRenderComponent(_component_NuxtLink, {
              key: tag.id,
              to: `/poems?tag=${tag.slug}`,
              class: "rounded-full border border-ink-200 bg-white/80 px-3 py-1 text-xs text-ink-600 shadow-sm transition-colors hover:border-gold-400/60 hover:text-gold-800"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`${ssrInterpolate(unref(labelForTag)(tag.slug, tag.name))}`);
                } else {
                  return [
                    createTextVNode(toDisplayString(unref(labelForTag)(tag.slug, tag.name)), 1)
                  ];
                }
              }),
              _: 2
            }, _parent));
          });
          _push(`<!--]-->`);
          if (unref(langLabel)) {
            _push(`<span class="rounded-full border border-ink-200 bg-white/80 px-3 py-1 text-xs text-ink-600" data-v-fc8331ea>${ssrInterpolate(unref(langLabel))}</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<h1 class="mb-3 font-serif text-4xl font-bold leading-tight tracking-tight text-ink-900 md:text-5xl lg:text-6xl" data-v-fc8331ea>${ssrInterpolate(__props.poem.title)}</h1>`);
        if (unref(author)) {
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/authors/${unref(author).slug}`,
            class: "inline-flex items-center gap-3 text-base text-ink-600 transition-colors hover:text-gold-800"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<img${ssrRenderAttr("src", unref(authorAvatar))} alt="" loading="lazy" class="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-ink-200/80" data-v-fc8331ea${_scopeId}><span data-v-fc8331ea${_scopeId}>\u2014 ${ssrInterpolate(unref(author).name)}</span>`);
              } else {
                return [
                  createVNode("img", {
                    src: unref(authorAvatar),
                    alt: "",
                    loading: "lazy",
                    class: "h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-ink-200/80"
                  }, null, 8, ["src"]),
                  createVNode("span", null, "\u2014 " + toDisplayString(unref(author).name), 1)
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="my-10 flex items-center gap-4" data-v-fc8331ea><div class="h-px flex-1 bg-ink-200" data-v-fc8331ea></div><span class="text-xl text-ink-400" data-v-fc8331ea>\u2726</span><div class="h-px flex-1 bg-ink-200" data-v-fc8331ea></div></div><div class="mb-8 rounded-xl border border-ink-200/90 bg-gradient-to-br from-white to-ink-50/80 px-4 py-3 shadow-sm sm:px-5" data-v-fc8331ea><p class="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-500" data-v-fc8331ea>${ssrInterpolate(unref(t)("viewer.readingDisplay"))}</p><div class="flex flex-wrap items-end gap-4 sm:gap-6" data-v-fc8331ea><div class="min-w-[10rem] flex-1 sm:max-w-xs" data-v-fc8331ea><label class="mb-1 block text-xs font-medium text-ink-600" for="reader-font" data-v-fc8331ea>${ssrInterpolate(unref(t)("viewer.font"))}</label><select id="reader-font" class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 shadow-sm focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400/40" data-v-fc8331ea><!--[-->`);
        ssrRenderList(unref(fontOptions), (f) => {
          _push(`<option${ssrRenderAttr("value", f)} data-v-fc8331ea${ssrIncludeBooleanAttr(Array.isArray(unref(fontKey)) ? ssrLooseContain(unref(fontKey), f) : ssrLooseEqual(unref(fontKey), f)) ? " selected" : ""}>${ssrInterpolate(f === "playfair" ? unref(t)("viewer.fontPlayfair") : f === "georgia" ? unref(t)("viewer.fontGeorgia") : f === "inter" ? unref(t)("viewer.fontInter") : unref(t)("viewer.fontLora"))}</option>`);
        });
        _push(`<!--]--></select></div><div class="min-w-[12rem] flex-1 sm:max-w-sm" data-v-fc8331ea><label class="mb-1 block text-xs font-medium text-ink-600" for="reader-size" data-v-fc8331ea>${ssrInterpolate(unref(t)("viewer.fontSize"))} <span class="tabular-nums text-ink-500" data-v-fc8331ea>(${ssrInterpolate(unref(fontSizePx))}px)</span></label><input id="reader-size"${ssrRenderAttr("value", unref(fontSizePx))} type="range" min="14" max="28" step="1" class="h-2 w-full cursor-pointer accent-gold-600" data-v-fc8331ea></div></div><p class="mt-3 text-xs text-ink-500" data-v-fc8331ea>${ssrInterpolate(unref(isLoggedIn) ? unref(t)("viewer.prefsSavedHint") : unref(t)("viewer.prefsLocalHint"))}</p></div><div class="poem-body w-full" data-v-fc8331ea><!--[-->`);
        ssrRenderList(unref(stanzas), (stanza, i) => {
          _push(`<p class="mb-10 last:mb-0" style="${ssrRenderStyle(unref(poemBodyStyle))}" data-v-fc8331ea>${ssrInterpolate(stanza)}</p>`);
        });
        _push(`<!--]--></div><div class="mt-14 flex w-full flex-wrap items-center gap-3 border-t border-ink-200 pt-8" data-v-fc8331ea><button class="${ssrRenderClass([unref(liked) ? "border-rose-300 bg-rose-50 text-rose-700" : "border-ink-200 bg-white text-ink-600 shadow-sm hover:border-rose-300 hover:text-rose-700", "flex items-center gap-2 rounded-full border px-5 py-2 text-sm transition-all"])}" data-v-fc8331ea><svg class="h-4 w-4" viewBox="0 0 24 24"${ssrRenderAttr("fill", unref(liked) ? "currentColor" : "none")} stroke="currentColor" stroke-width="2" data-v-fc8331ea><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" data-v-fc8331ea></path></svg> ${ssrInterpolate(unref(liked) ? unref(t)("viewer.saved") : unref(t)("viewer.savePoem"))}</button>`);
        if (unref(stanzas).length > 1) {
          _push(`<button class="flex items-center gap-2 rounded-full border border-ink-200 bg-white px-5 py-2 text-sm text-ink-600 shadow-sm transition-all hover:border-gold-400 hover:text-gold-900" data-v-fc8331ea><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" data-v-fc8331ea><path stroke-linecap="round" stroke-linejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4" data-v-fc8331ea></path></svg> ${ssrInterpolate(unref(t)("viewer.stanzaView"))}</button>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(readingTimeLabel)) {
          _push(`<span class="ml-auto text-xs text-ink-500" data-v-fc8331ea>${ssrInterpolate(unref(readingTimeLabel))}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
      ssrRenderTeleport(_push, (_push2) => {
        var _a;
        if (unref(slideMode)) {
          _push2(`<div class="fixed inset-0 z-50 flex flex-col bg-ink-50" data-v-fc8331ea><div class="flex items-center justify-between border-b border-ink-200 bg-white/90 px-6 py-4 backdrop-blur-md" data-v-fc8331ea><div class="flex min-w-0 items-center gap-3" data-v-fc8331ea><img${ssrRenderAttr("src", unref(authorAvatar))} alt="" class="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-ink-200" data-v-fc8331ea><div class="min-w-0" data-v-fc8331ea><p class="truncate font-serif text-sm font-bold text-ink-800" data-v-fc8331ea>${ssrInterpolate(__props.poem.title)}</p><p class="truncate text-xs text-ink-500" data-v-fc8331ea>${ssrInterpolate((_a = unref(author)) == null ? void 0 : _a.name)}</p></div></div><button type="button" class="rounded-full border border-ink-200 bg-white p-2 text-ink-600 transition-colors hover:border-ink-300 hover:text-ink-900"${ssrRenderAttr("aria-label", unref(t)("a11y.closeStanza"))} data-v-fc8331ea><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" data-v-fc8331ea><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" data-v-fc8331ea></path></svg></button></div><div class="flex flex-1 items-center justify-center px-8 py-12" data-v-fc8331ea><p class="w-full text-center" style="${ssrRenderStyle(unref(stanzaSlideStyle))}" data-v-fc8331ea>${ssrInterpolate(unref(stanzas)[unref(currentSlide)])}</p></div><div class="flex items-center justify-center gap-6 border-t border-ink-200 bg-white/80 py-6 backdrop-blur-sm" data-v-fc8331ea><button class="rounded-full border border-ink-200 bg-white p-3 text-ink-600 transition-colors hover:border-ink-300 hover:text-ink-900 disabled:opacity-25"${ssrIncludeBooleanAttr(unref(currentSlide) === 0) ? " disabled" : ""} data-v-fc8331ea><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" data-v-fc8331ea><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" data-v-fc8331ea></path></svg></button><div class="flex items-center gap-1.5" data-v-fc8331ea><!--[-->`);
          ssrRenderList(unref(stanzas), (_, i) => {
            _push2(`<button class="${ssrRenderClass([i === unref(currentSlide) ? "w-6 bg-gold-500" : "w-1.5 bg-ink-300 hover:bg-ink-400", "h-1.5 rounded-full transition-all duration-300"])}" data-v-fc8331ea></button>`);
          });
          _push2(`<!--]--></div><button class="rounded-full border border-ink-200 bg-white p-3 text-ink-600 transition-colors hover:border-ink-300 hover:text-ink-900 disabled:opacity-25"${ssrIncludeBooleanAttr(unref(currentSlide) === unref(stanzas).length - 1) ? " disabled" : ""} data-v-fc8331ea><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" data-v-fc8331ea><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" data-v-fc8331ea></path></svg></button></div><p class="pb-4 text-center text-xs text-ink-500" data-v-fc8331ea>${ssrInterpolate(unref(t)("viewer.slideHint", { current: unref(currentSlide) + 1, total: unref(stanzas).length }))}</p></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/PoetryViewer.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_1 = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-fc8331ea"]]);

export { __nuxt_component_1 as _ };
//# sourceMappingURL=PoetryViewer-CL6_LsRF.mjs.map
