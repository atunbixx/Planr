"use client";

import { useEffect } from "react";

export function RegisterSW() {
  useEffect(() => {
    // Register only in production — a dev service worker caches pages and disrupts hot reload + tests.
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* registration is best-effort; the app works without it */
      });
    }
  }, []);
  return null;
}
