/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker"
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist"
import { NetworkOnly, Serwist } from "serwist"

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

// Live data and auth must always hit the network — never cache.
//
// /api/auth/*    Slack OAuth callbacks; cached responses break login flow.
// /api/* (rest)  Leaderboard, activities, feed, audit log, etc. all return
//                live or user-specific data. A NetworkFirst-with-stale-fallback
//                would silently show old km after the user just logged a new
//                activity, encouraging duplicate entries.
const apiNetworkOnly: RuntimeCaching = {
  matcher: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith("/api/"),
  handler: new NetworkOnly(),
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  // Activate new SW immediately on install/update — keeps installed PWAs
  // from running stale code for the lifetime of the standalone window.
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  // Order matters: API NetworkOnly must come before defaultCache (which has
  // a generic NetworkFirst fallback that would otherwise capture /api/*).
  runtimeCaching: [apiNetworkOnly, ...defaultCache],
})

serwist.addEventListeners()
