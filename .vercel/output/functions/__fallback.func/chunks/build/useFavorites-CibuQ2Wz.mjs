import { u as useAuth } from './useAuth-ClZa9bEg.mjs';
import { f as useState } from './server.mjs';
import { computed } from 'vue';

function useFavorites() {
  const { isLoggedIn } = useAuth();
  const favoriteIdsState = useState("ph-favorite-ids", () => []);
  const favoriteIds = computed(() => new Set(favoriteIdsState.value));
  async function toggle(id) {
    if (isLoggedIn.value) {
      const res = await $fetch(`/api/user/favorites/${id}`, { method: "POST" });
      if (res.favorited) {
        if (!favoriteIdsState.value.includes(id)) {
          favoriteIdsState.value = [...favoriteIdsState.value, id];
        }
      } else {
        favoriteIdsState.value = favoriteIdsState.value.filter((x) => x !== id);
      }
    } else {
      const next = new Set(favoriteIdsState.value);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      favoriteIdsState.value = [...next];
    }
  }
  function isFavorite(id) {
    return favoriteIdsState.value.includes(id);
  }
  async function clearAll() {
    if (isLoggedIn.value) {
      for (const id of favoriteIdsState.value) {
        await $fetch(`/api/user/favorites/${id}`, { method: "POST" }).catch(() => {
        });
      }
    }
    favoriteIdsState.value = [];
  }
  const count = computed(() => favoriteIdsState.value.length);
  return { favoriteIds, toggle, isFavorite, clearAll, count };
}

export { useFavorites as u };
//# sourceMappingURL=useFavorites-CibuQ2Wz.mjs.map
