import { f as useState, n as navigateTo } from './server.mjs';
import { ref, computed } from 'vue';

function useAuth() {
  const user = useState("auth_user", () => null);
  const loading = ref(false);
  async function fetchMe() {
    try {
      user.value = await $fetch("/api/user/me");
    } catch {
      user.value = null;
    }
  }
  async function register(email, password, name) {
    var _a, _b;
    loading.value = true;
    try {
      const res = await $fetch("/api/user/register", {
        method: "POST",
        body: { email, password, name }
      });
      user.value = res.user;
      return { ok: true };
    } catch (err) {
      return { ok: false, message: (_b = (_a = err == null ? void 0 : err.data) == null ? void 0 : _a.statusMessage) != null ? _b : "Registration failed" };
    } finally {
      loading.value = false;
    }
  }
  async function login(email, password) {
    var _a, _b;
    loading.value = true;
    try {
      const res = await $fetch("/api/user/login", {
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
    await $fetch("/api/user/logout", { method: "POST" });
    user.value = null;
    await navigateTo("/");
  }
  const isLoggedIn = computed(() => user.value !== null);
  return { user, loading, isLoggedIn, fetchMe, register, login, logout };
}

export { useAuth as u };
//# sourceMappingURL=useAuth-ClZa9bEg.mjs.map
