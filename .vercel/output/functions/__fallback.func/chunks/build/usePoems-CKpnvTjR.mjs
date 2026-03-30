import { isReactive, reactive, ref, computed } from 'vue';
import { u as useFetch } from './fetch-B6hZG8jW.mjs';

function usePoems(initialFilters = {}) {
  const filters = isReactive(initialFilters) ? initialFilters : reactive({ page: 1, limit: 12, ...initialFilters });
  if (filters.limit == null) filters.limit = 12;
  if (filters.page == null) filters.page = 1;
  const loading = ref(false);
  const error = ref(null);
  const response = ref(null);
  const poems = computed(() => {
    var _a, _b;
    return (_b = (_a = response.value) == null ? void 0 : _a.data) != null ? _b : [];
  });
  const meta = computed(() => {
    var _a;
    return (_a = response.value) == null ? void 0 : _a.meta;
  });
  const totalPages = computed(() => {
    var _a, _b;
    return (_b = (_a = meta.value) == null ? void 0 : _a.totalPages) != null ? _b : 1;
  });
  async function fetch(newFilters) {
    var _a;
    if (newFilters) Object.assign(filters, newFilters);
    loading.value = true;
    error.value = null;
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== void 0 && v !== "" && v !== null)
      );
      response.value = await $fetch("/api/poems", { params });
    } catch (err) {
      error.value = (_a = err.message) != null ? _a : "Failed to load poems";
    } finally {
      loading.value = false;
    }
  }
  function nextPage() {
    if (meta.value && filters.page < totalPages.value) {
      fetch({ page: filters.page + 1 });
    }
  }
  function prevPage() {
    if (filters.page > 1) fetch({ page: filters.page - 1 });
  }
  function goToPage(page) {
    fetch({ page });
  }
  return { filters, poems, meta, totalPages, loading, error, fetch, nextPage, prevPage, goToPage };
}
function useDailyPoem() {
  return useFetch(
    "/api/poems/daily",
    "$ICvj-7KuDT"
    /* nuxt-injected */
  );
}

export { usePoems as a, useDailyPoem as u };
//# sourceMappingURL=usePoems-CKpnvTjR.mjs.map
