"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppStore } from "@/store/app";

export function useRealtime(orgId: string, userId: string) {
  const router = useRouter();
  const { addNotification } = useAppStore();
  const ref = useRef<any>(null);

  const onLeadInsert = useCallback((payload: any) => {
    const l = payload.new;
    router.refresh();
    toast.success(`🎯 Neuer Lead: ${l.first_name} ${l.last_name}`, {
      description: `Score ${l.score} · ${l.source}`,
      action: { label: "Ansehen", onClick: () => router.push(`/leads/${l.id}`) },
      duration: 7000,
    });
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      const n = new Notification("Datesetzer CRM", {
        body: `${l.first_name} ${l.last_name} · Score ${l.score}`,
        icon: "/icon-192.png", badge: "/badge-96.png", tag: `lead-${l.id}`,
      });
      n.onclick = () => { window.focus(); router.push(`/leads/${l.id}`); };
    }
  }, [router]);

  const onLeadUpdate = useCallback((payload: any) => {
    router.refresh();
    if (payload.new.status === "won" && payload.old?.status !== "won") {
      toast.success("🎉 Deal gewonnen!", {
        description: `${payload.new.first_name} ${payload.new.last_name} · €${Number(payload.new.value).toLocaleString("de-DE")}`,
        duration: 9000,
      });
    }
  }, [router]);

  const onNotification = useCallback((payload: any) => {
    const n = payload.new;
    if (n.profile_id !== userId) return;
    addNotification({ id:n.id, type:n.type, title:n.title, body:n.body,
      actionUrl:n.action_url, isRead:false, createdAt:n.created_at });
  }, [userId, addNotification]);

  useEffect(() => {
    if (!orgId) return;
    const sb = supabaseBrowser();
    if (ref.current) ref.current.unsubscribe();

    ref.current = sb.channel(`crm:${orgId}`)
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"leads", filter:`org_id=eq.${orgId}` }, onLeadInsert)
      .on("postgres_changes", { event:"UPDATE", schema:"public", table:"leads", filter:`org_id=eq.${orgId}` }, onLeadUpdate)
      .on("postgres_changes", { event:"*", schema:"public", table:"tasks", filter:`org_id=eq.${orgId}` }, () => router.refresh())
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"notifications", filter:`org_id=eq.${orgId}` }, onNotification)
      .subscribe();

    return () => { if (ref.current) ref.current.unsubscribe(); };
  }, [orgId, userId, onLeadInsert, onLeadUpdate, onNotification, router]);
}

export function usePush() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const enable = async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      toast.error("Browser unterstützt keine Push Notifications");
      return;
    }
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { toast.error("Berechtigung verweigert"); return; }

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64(vapidKey),
      });

      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: { p256dh: ab64(sub.getKey("p256dh")), auth: ab64(sub.getKey("auth")) },
        }),
        credentials: "include",
      });

      setEnabled(true);
      toast.success("🔔 Push Notifications aktiviert!");
      new Notification("Datesetzer CRM", { body:"Benachrichtigungen sind jetzt aktiv.", icon:"/icon-192.png" });
    } catch (e) {
      toast.error("Fehler beim Aktivieren");
    } finally {
      setLoading(false);
    }
  };

  return { enabled, loading, enable };
}

function urlB64(b: string): Uint8Array {
  const pad = "=".repeat((4 - b.length % 4) % 4);
  const base64 = (b + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function ab64(buf: ArrayBuffer | null): string {
  if (!buf) return "";
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
