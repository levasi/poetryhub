import { f as useState, n as navigateTo } from './server.mjs';
import { ref, computed } from 'vue';

function useAdmin() {
  const user = useState("admin_user", () => null);
  const loading = ref(false);
  async function fetchMe() {
    try {
      user.value = await $fetch("/api/auth/me");
    } catch {
      user.value = null;
    }
  }
  async function login(email, password) {
    var _a, _b;
    loading.value = true;
    try {
      const res = await $fetch("/api/auth/login", {
        method: "POST",
        body: { email, password }
      });
      user.value = res.user;
      return { ok: true };
    } catch (err) {
      return { ok: false, message: (_b = (_a = err == null ? void 0 : err.data) == null ? void 0 : _a.statusMessage) != null ? _b : "Login failed" };
    } finally {
      loading.value = false;
    }
  }
  async function logout() {
    await $fetch("/api/auth/logout", { method: "POST" });
    user.value = null;
    await navigateTo("/admin/login");
  }
  const isLoggedIn = computed(() => user.value !== null);
  return { user, loading, isLoggedIn, fetchMe, login, logout };
}

export { useAdmin as u };
//# sourceMappingURL=useAdmin-gAmstxDv.mjs.map
