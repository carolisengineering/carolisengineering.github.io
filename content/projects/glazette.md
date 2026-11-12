---
title: Glazette
summary: "A photo-first pottery journal for potters. Snap a photo to log each stage of a piece, build a glaze library from real fired results, and sync between phone and laptop."
tags: [TypeScript, React, PWA, IndexedDB, Cloudflare Workers, Hono, D1, R2]
repo: https://github.com/carolisengineering/glazette
weight: 2
diagram:
  - { label: Offline PWA, next: "⇄" }
  - { label: Hono Worker, style: primary, next: "→" }
  - { label: D1 + R2, style: secondary }
outcomes:
  - { value: Offline First, label: "the journal lives on the device, so a weak signal never blocks logging a piece" }
  - { value: 1.9 MB → 76 KiB, label: "server bundle after replacing the auth library to fit the free plan's 10 ms CPU limit" }
  - { value: $0 Hosting, label: "Cloudflare Workers, D1 and R2 on their free plans" }
architecture:
  nodes:
    - { id: app, label: Glazette PWA, note: "React, Dexie on IndexedDB", row: 1, col: 1 }
    - { id: api, label: Hono Worker, note: "sign-in, sync", style: primary, row: 1, col: 2 }
    - { id: d1, label: D1, note: "records, sessions", style: secondary, row: 1, col: 3 }
    - { id: backup, label: Backup file, note: "data and photos", row: 2, col: 1 }
    - { id: r2, label: R2, note: "photos by content hash", style: secondary, row: 2, col: 2 }
    - { id: purge, label: Daily job, note: "30-day purge", row: 2, col: 3 }
  edges:
    - { from: app, to: api, label: sync, both: true }
    - { from: api, to: d1 }
    - { from: api, to: r2, label: photos }
    - { from: app, to: backup, label: save / restore, both: true }
    - { from: purge, to: d1 }
    - { from: purge, to: r2 }
---

## Context

Hobby potters track their pieces and glazes in a notes app, a notebook, or from memory, which makes good results hard to repeat. Which glaze, how many dips, which clay, which firing? The pottery apps that exist feel like database forms.

Glazette is a studio journal where photos are the interface and logging takes one tap. It is built for wheel-throwing potters in a shared studio, who have a phone in an apron pocket and clay on their hands.

Glazette is live at [glazette.offhours.workers.dev](https://glazette.offhours.workers.dev). Anyone can use it on their own device, and sign-in for syncing is open only to me for now.

## Features

Every piece moves through five stages: thrown, trimmed, bisqued, glazed and fired. The camera button opens the phone's camera. After the shot, a sheet asks which piece the photo belongs to, with the next stage already selected, so one more tap saves it. Photos from the camera roll work too, dated from their own timestamp.

The shelf is a photo grid of pieces in progress, with stage filters and a banner when pieces are ready for the bisque kiln. Each piece has a timeline of its stages, and a before-and-after view of the glazed photo next to the one out of the kiln. Glazes are recorded in the order they went on, with dips and method. The glaze library shows each glaze as a test tile cropped from a real fired piece.

Glazette installs to the Home Screen and works offline. A signed-in potter's pieces and photos sync between phone and laptop, and anything deleted can be put back for 30 days.

## Functionality

The app is a React and TypeScript single-page app built with Vite. Dexie stores everything in IndexedDB, which stays the source of truth on the device. Photos are resized in the browser with a separate thumbnail, and each image is identified by a hash of its contents, so the same photo imported twice is stored once.

A Hono API runs in the same Cloudflare Worker that serves the app. Sign-in uses a six-digit code sent by email, and only emails on an allowed list receive one. Records sync last-write-wins per record, and deletes travel as tombstones. Photos upload to R2 under their content hash, and the server refuses any upload whose bytes don't match it.

A daily scheduled job removes anything deleted more than 30 days ago. It saves the database changes before deleting image files, so a failure can leave an unused file behind but never a photo without its image.

Signed out, everything still works on the device, and a backup file with every piece and photo can be saved and restored.

## Decisions & Tradeoffs

{{< decision >}}Write my own sign-in instead of using an auth library. The first version used Better Auth, but on Cloudflare its requests measured about 39 ms of CPU against the free plan's 10 ms limit, and almost all of the 1.9 MB server bundle was the library. The replacement uses only the Web Crypto built into Workers: codes and session tokens are stored as hashes, and every sign-in request must come from the app's own site. The bundle dropped to 76 KiB, and a first request now takes about 3 ms locally, including loading the code.{{< /decision >}}

**Offline first, with the server as a copy.** The device keeps the whole journal, and the server keeps devices in step. A slow connection never blocks logging a piece, and signing out never removes a photo that hasn't uploaded.

**Losing a photo is the failure that matters.** Every sync rule is checked against it. A photo stays on the device until the server confirms it arrived intact, a device that never saw a photo can't delete it, and deletes are recoverable for 30 days.

**$0 to run.** Workers, D1 and R2 run on their free plans, and email goes through Resend's free tier. The CPU limit shaped the design: photo bytes go straight to storage instead of being processed in the Worker, and each new kind of request is measured before anything is built on top of it.

## Results

Glazette went from a written spec to photos syncing across devices in ten days, over twelve pull requests.

- More than 900 unit tests, including two-device sync tests of edits during a sync, stale devices and slow clocks.
- Browser tests in Chromium and WebKit cover working offline, data surviving a reload, and a backup and restore with photos.
- Measured locally, a sync request uses at most 1.4 ms of CPU, and the daily job 3 ms.

## Future Work

- Plan the glazes for a piece before it's glazed
- A wider layout for laptops, and a dark mode
- Open accounts to other potters at my studio, on the app's own domain
