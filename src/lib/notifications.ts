/**
 * Notification permission handling (spec §5.4).
 *
 * The iOS rule that shapes this file: Safari supports Web Push only for PWAs
 * added to the home screen. Asking for permission from a browser tab there
 * silently fails, so the UI must detect the situation and say "install first"
 * rather than showing a prompt that cannot work.
 *
 * Permission is never requested on first load — that is the single most common
 * reason people permanently decline.
 */
import { isIos, isStandalone } from "./pwa";

export interface NotificationState {
  supported: boolean;
  permission: NotificationPermission | "unsupported";
  /** Non-null when reminders cannot be enabled, explaining why. */
  reason: string | null;
}

export function notificationState(): NotificationState {
  if (typeof Notification === "undefined" || !("serviceWorker" in navigator)) {
    return {
      supported: false,
      permission: "unsupported",
      reason: "This browser doesn't support notifications.",
    };
  }

  // The iOS caveat, surfaced as guidance rather than a dead button.
  if (isIos() && !isStandalone()) {
    return {
      supported: false,
      permission: Notification.permission,
      reason:
        "On iOS, reminders only work once Shoresh is on your home screen. Tap Share → Add to Home Screen, then come back.",
    };
  }

  if (Notification.permission === "denied") {
    return {
      supported: true,
      permission: "denied",
      reason: "Notifications are blocked for this site in your browser settings.",
    };
  }

  return { supported: true, permission: Notification.permission, reason: null };
}

export async function requestNotificationPermission(): Promise<boolean> {
  const state = notificationState();
  if (!state.supported) return false;
  if (state.permission === "granted") return true;
  try {
    return (await Notification.requestPermission()) === "granted";
  } catch {
    return false;
  }
}

/**
 * Show a local "cards due" notification.
 *
 * Real Web Push needs a server holding VAPID keys and a scheduled job; that is
 * backend work. This is the client half — the same Service Worker registration
 * and notification shape a push handler would use.
 */
export async function showDueNotification(count: number): Promise<boolean> {
  if (notificationState().permission !== "granted") return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const body = `${count} card${count === 1 ? "" : "s"} ready to review.`;
    if (reg) {
      await reg.showNotification("Shoresh", { body, icon: "/icons/icon-192.png", tag: "due" });
    } else {
      new Notification("Shoresh", { body, icon: "/icons/icon-192.png" });
    }
    return true;
  } catch {
    return false;
  }
}
