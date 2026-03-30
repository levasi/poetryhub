import { a as useI18n } from './server.mjs';

function tagMessageKey(slug) {
  return `tags.${slug.replace(/-/g, "_")}`;
}
function useTagLabel() {
  const { t, te } = useI18n();
  function labelForTag(slug, fallbackName) {
    const key = tagMessageKey(slug);
    return te(key) ? t(key) : fallbackName;
  }
  return { labelForTag, tagMessageKey };
}

export { useTagLabel as u };
//# sourceMappingURL=useTagLabel-DPQ2hw0Y.mjs.map
