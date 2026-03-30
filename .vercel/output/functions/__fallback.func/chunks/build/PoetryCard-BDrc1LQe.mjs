import { _ as __nuxt_component_0 } from './nuxt-link-BHo5EKPq.mjs';
import { defineComponent, computed, mergeProps, unref, withCtx, createVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderStyle, ssrRenderClass, ssrRenderComponent, ssrInterpolate, ssrRenderAttr } from 'vue/server-renderer';
import { u as useFavorites } from './useFavorites-CibuQ2Wz.mjs';
import { u as useTagLabel } from './useTagLabel-DPQ2hw0Y.mjs';
import { a as authorAvatarUrl } from './authorAvatar-BAkG-5wq.mjs';
import { a as useI18n } from './server.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "PoetryCard",
  __ssrInlineRender: true,
  props: {
    poem: {},
    featured: { type: Boolean },
    view: {}
  },
  setup(__props) {
    const { t } = useI18n();
    const { labelForTag } = useTagLabel();
    const props = __props;
    const author = computed(() => props.poem.author);
    const authorAvatar = computed(() => authorAvatarUrl(author.value));
    const { isFavorite } = useFavorites();
    const liked = computed(() => isFavorite(props.poem.id));
    const moodTag = computed(
      () => {
        var _a, _b, _c;
        return (_c = (_b = (_a = props.poem.poemTags) == null ? void 0 : _a.find((pt) => pt.tag.category === "mood")) == null ? void 0 : _b.tag) != null ? _c : null;
      }
    );
    const moodLabel = computed(() => {
      const m = moodTag.value;
      if (!m) return "";
      return labelForTag(m.slug, m.name);
    });
    const previewLines = computed(() => {
      const lines = props.poem.content.split("\n").filter((l) => l.trim());
      return lines.slice(0, 3).join("\n");
    });
    const accentColor = computed(() => {
      var _a, _b;
      return (_b = (_a = moodTag.value) == null ? void 0 : _a.color) != null ? _b : null;
    });
    const readingTimeLabel = computed(() => {
      if (!props.poem.readingTime) return null;
      const mins = Math.ceil(props.poem.readingTime / 60);
      return mins < 1 ? t("card.underMin") : t("card.min", { n: mins });
    });
    const isNonEnglish = computed(() => props.poem.language && props.poem.language !== "en");
    const langFlags = { ro: "\u{1F1F7}\u{1F1F4}", fr: "\u{1F1EB}\u{1F1F7}", de: "\u{1F1E9}\u{1F1EA}", es: "\u{1F1EA}\u{1F1F8}" };
    const langFlag = computed(() => {
      var _a, _b;
      return (_b = langFlags[props.poem.language]) != null ? _b : (_a = props.poem.language) == null ? void 0 : _a.toUpperCase();
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      if (__props.view === "list") {
        _push(`<article${ssrRenderAttrs(mergeProps({ class: "group flex items-start gap-5 border-b border-ink-200/80 py-5 transition-colors last:border-0 hover:bg-white/50" }, _attrs))}><div style="${ssrRenderStyle(unref(accentColor) ? `background-color: ${unref(accentColor)}` : "")}" class="${ssrRenderClass([{ "bg-ink-300": !unref(accentColor) }, "mt-1.5 h-12 w-0.5 shrink-0 rounded-full opacity-70"])}"></div><div class="min-w-0 flex-1"><div class="mb-1 flex items-baseline gap-2">`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: `/poems/${__props.poem.slug}`
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<h2 class="font-serif text-lg font-bold text-ink-900 transition-colors group-hover:text-gold-800 leading-snug"${_scopeId}>${ssrInterpolate(__props.poem.title)}</h2>`);
            } else {
              return [
                createVNode("h2", { class: "font-serif text-lg font-bold text-ink-900 transition-colors group-hover:text-gold-800 leading-snug" }, toDisplayString(__props.poem.title), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        if (unref(isNonEnglish)) {
          _push(`<span class="text-sm">${ssrInterpolate(unref(langFlag))}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        if (unref(author)) {
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/authors/${unref(author).slug}`,
            class: "mb-2 flex items-center gap-2 text-xs text-ink-500 transition-colors hover:text-ink-800"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<img${ssrRenderAttr("src", unref(authorAvatar))} alt="" loading="lazy" class="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-ink-200"${_scopeId}><span${_scopeId}>${ssrInterpolate(unref(author).name)}</span>`);
              } else {
                return [
                  createVNode("img", {
                    src: unref(authorAvatar),
                    alt: "",
                    loading: "lazy",
                    class: "h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-ink-200"
                  }, null, 8, ["src"]),
                  createVNode("span", null, toDisplayString(unref(author).name), 1)
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`<p class="font-serif text-sm italic leading-relaxed text-ink-600" style="${ssrRenderStyle({ "white-space": "pre-wrap" })}">${ssrInterpolate(unref(previewLines))}</p></div><div class="flex shrink-0 flex-col items-end gap-2"><button type="button" class="${ssrRenderClass([unref(liked) ? "text-rose-600" : "text-ink-400 hover:text-rose-600", "rounded-full p-1.5 transition-colors"])}"${ssrRenderAttr("aria-label", unref(liked) ? unref(t)("card.favoriteRemove") : unref(t)("card.favoriteAdd"))}><svg class="h-4 w-4" viewBox="0 0 24 24"${ssrRenderAttr("fill", unref(liked) ? "currentColor" : "none")} stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg></button>`);
        if (unref(readingTimeLabel)) {
          _push(`<span class="text-xs text-ink-500">${ssrInterpolate(unref(readingTimeLabel))}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></article>`);
      } else {
        _push(`<article${ssrRenderAttrs(mergeProps({
          class: ["group relative flex flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-md", { "col-span-2 row-span-2": __props.featured }]
        }, _attrs))}><div style="${ssrRenderStyle(unref(accentColor) ? `background-color: ${unref(accentColor)}` : "")}" class="${ssrRenderClass([{ "bg-ink-300": !unref(accentColor) }, "h-0.5 w-full opacity-80 transition-all duration-300 group-hover:opacity-100"])}"></div><div class="flex flex-1 flex-col p-5"><div class="mb-3 flex items-center gap-2">`);
        if (unref(moodTag)) {
          _push(`<span style="${ssrRenderStyle(unref(accentColor) ? `background-color: ${unref(accentColor)}22; color: ${unref(accentColor)}` : "")}" class="${ssrRenderClass([{ "bg-amber-50 text-amber-900": !unref(accentColor) }, "rounded-full px-2.5 py-0.5 text-xs font-medium"])}">${ssrInterpolate(unref(moodLabel))}</span>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(isNonEnglish)) {
          _push(`<span class="ml-auto text-sm"${ssrRenderAttr("title", __props.poem.language)}>${ssrInterpolate(unref(langFlag))}</span>`);
        } else {
          _push(`<!---->`);
        }
        if (__props.poem.source === "ai-generated") {
          _push(`<span class="ml-auto rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-800">${ssrInterpolate(unref(t)("card.aiBadge"))}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: `/poems/${__props.poem.slug}`,
          class: "mb-1 block"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<h2 class="${ssrRenderClass([__props.featured ? "text-2xl" : "text-lg", "font-serif font-bold leading-snug text-ink-900 transition-colors group-hover:text-gold-800"])}"${_scopeId}>${ssrInterpolate(__props.poem.title)}</h2>`);
            } else {
              return [
                createVNode("h2", {
                  class: ["font-serif font-bold leading-snug text-ink-900 transition-colors group-hover:text-gold-800", __props.featured ? "text-2xl" : "text-lg"]
                }, toDisplayString(__props.poem.title), 3)
              ];
            }
          }),
          _: 1
        }, _parent));
        if (unref(author)) {
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/authors/${unref(author).slug}`,
            class: "mb-4 flex items-center gap-2 text-xs text-ink-500 transition-colors hover:text-ink-800"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<img${ssrRenderAttr("src", unref(authorAvatar))} alt="" loading="lazy" class="${ssrRenderClass([__props.featured ? "h-9 w-9" : "h-8 w-8", "shrink-0 rounded-full object-cover ring-1 ring-ink-200"])}"${_scopeId}><span${_scopeId}>${ssrInterpolate(unref(author).name)}</span>`);
              } else {
                return [
                  createVNode("img", {
                    src: unref(authorAvatar),
                    alt: "",
                    loading: "lazy",
                    class: ["shrink-0 rounded-full object-cover ring-1 ring-ink-200", __props.featured ? "h-9 w-9" : "h-8 w-8"]
                  }, null, 10, ["src"]),
                  createVNode("span", null, toDisplayString(unref(author).name), 1)
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`<p class="flex-1 font-serif text-sm italic leading-relaxed text-ink-600" style="${ssrRenderStyle({ "white-space": "pre-wrap" })}">${ssrInterpolate(unref(previewLines))}</p><div class="mt-4 flex items-center justify-between border-t border-ink-100 pt-4">`);
        if (unref(readingTimeLabel)) {
          _push(`<span class="text-xs text-ink-500">${ssrInterpolate(unref(readingTimeLabel))}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<button class="${ssrRenderClass([unref(liked) ? "text-rose-600" : "text-ink-400 hover:text-rose-600", "ml-auto rounded-full p-1.5 transition-colors"])}"${ssrRenderAttr("aria-label", unref(liked) ? unref(t)("card.favoriteRemove") : unref(t)("card.favoriteAdd"))}><svg class="h-4 w-4" viewBox="0 0 24 24"${ssrRenderAttr("fill", unref(liked) ? "currentColor" : "none")} stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg></button></div></div></article>`);
      }
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/PoetryCard.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as _ };
//# sourceMappingURL=PoetryCard-BDrc1LQe.mjs.map
