"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

// Convert Base64URL public VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushInit() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const permission = typeof Notification !== "undefined" ? Notification.permission : "default";

  const PUBLIC_KEY = useMemo(() => process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "", []);

  useEffect(() => {
    const can = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && typeof Notification !== "undefined";
    const secure = typeof window !== "undefined" && (window.isSecureContext || window.location.hostname === "localhost");
    setSupported(can && secure);

    if (!can) return;
    if (!secure) {
      console.warn("[PushInit] Secure context required (HTTPS or localhost)");
      return;
    }

    // Check if dismissed previously
    try {
      const d = window.localStorage?.getItem("pushDismissed") === "1";
      if (d) setDismissed(true);
    } catch {}

    // Register service worker and prepare push
    (async () => {
      try {
        // Ensure service worker is registered and active
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        const readyReg = await navigator.serviceWorker.ready;

        // Check existing subscription
        const sub = await readyReg.pushManager.getSubscription();
        setSubscribed(!!sub);
        setReady(true);

        if (Notification.permission === "granted" && !sub) {
          // Attempt automatic subscribe if user already granted permission earlier
          await subscribe(readyReg);
        }
      } catch (e) {
        console.warn("[PushInit] SW registration failed", e);
      }
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function subscribe(reg: ServiceWorkerRegistration) {
    if (!PUBLIC_KEY) {
      toast.error("Missing VAPID public key");
      return;
    }
    try {
      setLoading(true);
      if (!reg.pushManager) {
        toast.error("Push is not supported in this browser");
        return;
      }
      const appServerKey = urlBase64ToUint8Array(PUBLIC_KEY);
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: appServerKey });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Subscribe API failed: ${res.status} ${t}`);
      }

      setSubscribed(true);
      toast.success("Push notifications enabled");
      try { localStorage.setItem("pushDismissed", "1"); } catch {}
      setDismissed(true);
    } catch (e: any) {
      if (e?.name === "NotAllowedError") {
        toast("Permission is required to enable notifications");
      } else if (typeof window !== "undefined" && !window.isSecureContext && window.location.hostname !== "localhost") {
        toast.error("Notifications require HTTPS");
      } else {
        console.error("[PushInit] Subscribe failed", e);
        toast.error("Failed to enable notifications");
      }
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribe() {
    try {
      setLoading(true);
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) {
        setSubscribed(false);
        return;
      }

      const endpoint = sub.endpoint;
      await sub.unsubscribe();
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      });
      setSubscribed(false);
      toast.success("Push notifications disabled");
    } catch (e) {
      console.error("[PushInit] Unsubscribe failed", e);
      toast.error("Failed to disable notifications");
    } finally {
      setLoading(false);
    }
  }

  async function requestAndSubscribe() {
    try {
      if (!supported) return;
      if (typeof window !== "undefined" && !window.isSecureContext && window.location.hostname !== "localhost") {
        toast.error("Notifications require HTTPS");
        return;
      }
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        toast("Notifications permission denied");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      await subscribe(reg);
    } catch (e) {
      console.error("[PushInit] Permission/subscription", e);
      toast.error("Unable to enable notifications");
    }
  }

  if (!supported) return null;

  // Minimal floating control. Only show when ready, not subscribed, and not dismissed
  if (!ready || subscribed || dismissed) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[1000] flex flex-col gap-2">
      <div className="pointer-events-auto inline-flex items-center gap-2 rounded-md bg-neutral-900/80 px-3 py-2 text-sm text-white shadow-lg backdrop-blur dark:bg-neutral-800/80">
        <button
          onClick={requestAndSubscribe}
          disabled={loading}
          className="rounded bg-emerald-500 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
          aria-label="Enable notifications"
        >
          {loading ? "Enabling..." : "Enable notifications"}
        </button>
        <button
          onClick={() => { try { localStorage.setItem("pushDismissed", "1"); } catch {}; setDismissed(true); }}
          className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded hover:bg-white/10"
          aria-label="Dismiss"
          title="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
