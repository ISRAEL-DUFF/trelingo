import { create } from "zustand";
import { api, tokenStore } from "@/api/client";
import { ApiError, NetworkError, type ApiUser } from "@/api/types";
import { clearLocalData, getMeta, getSettings, saveSettings, setMeta, type Settings } from "@/db";
import { sync } from "@/sync/sync";

interface SessionState {
  user: ApiUser | null;
  settings: Settings | null;
  status: "loading" | "ready";
  error: string | null;

  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  oauth: (provider: "google" | "apple") => Promise<void>;
  logout: () => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

export const useSession = create<SessionState>((set, get) => ({
  user: null,
  settings: null,
  status: "loading",
  error: null,

  async init() {
    const settings = await getSettings();
    // The app is fully usable signed-out; a failed /me is not an error state.
    if (!tokenStore.access) {
      set({ settings, status: "ready", user: null });
      return;
    }

    // Show the cached identity immediately. Without this, launching offline
    // makes a signed-in learner look signed out, and the UI starts nagging them
    // to create an account they already have.
    const cached = await getMeta<ApiUser | null>("user", null);
    if (cached) set({ user: cached });

    try {
      const user = await api.me();
      await setMeta("user", user);
      set({ user, settings, status: "ready" });
      void sync();
    } catch (e) {
      if (e instanceof NetworkError) {
        // Offline with a stored token: stay signed in on the cached user.
        set({ settings, status: "ready" });
        return;
      }
      // A real rejection (401) means the session is genuinely gone.
      tokenStore.clear();
      await setMeta("user", null);
      set({ user: null, settings, status: "ready" });
    }
  },

  async login(email, password) {
    set({ error: null });
    try {
      const res = await api.login({ email, password });
      tokenStore.set(res.accessToken, res.refreshToken);
      await setMeta("user", res.user);
      set({ user: res.user });
      await sync();
    } catch (e) {
      set({ error: messageFor(e) });
      throw e;
    }
  },

  async signup(email, password, displayName) {
    set({ error: null });
    try {
      const res = await api.signup({
        email,
        password,
        displayName,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      tokenStore.set(res.accessToken, res.refreshToken);
      await setMeta("user", res.user);
      set({ user: res.user });
      await sync();
    } catch (e) {
      set({ error: messageFor(e) });
      throw e;
    }
  },

  async oauth(provider) {
    set({ error: null });
    try {
      const res = await api.oauth({ provider });
      tokenStore.set(res.accessToken, res.refreshToken);
      await setMeta("user", res.user);
      set({ user: res.user });
      await sync();
    } catch (e) {
      set({ error: messageFor(e) });
      throw e;
    }
  },

  async logout() {
    try {
      await api.logout();
    } catch {
      // Logging out locally matters more than telling the server about it.
    }
    tokenStore.clear();
    await clearLocalData();
    await setMeta("user", null);
    set({ user: null });
  },

  async updateSettings(patch) {
    const settings = await saveSettings(patch);
    set({ settings });
    if (get().user) {
      try {
        await api.updateMe({
          niqqudPref: settings.niqqudPref,
          pronunciationPref: settings.pronunciationPref,
        });
      } catch {
        // Settings are local-first too; the next sync will carry them.
      }
    }
  },

  async refreshUser() {
    if (!tokenStore.access) return;
    try {
      const user = await api.me();
      await setMeta("user", user);
      set({ user });
    } catch {
      /* leave the cached user in place */
    }
  },

  clearError: () => set({ error: null }),
}));

function messageFor(e: unknown): string {
  if (e instanceof ApiError) return e.body.message;
  if (e instanceof NetworkError) return "You appear to be offline. Your progress is saved on this device.";
  return e instanceof Error ? e.message : "Something went wrong.";
}
