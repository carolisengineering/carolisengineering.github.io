---
title: Strength in Numbers
summary: "Full-stack workout tracker for use at the gym. Logging a workout works end to end, including offline, with history, progress charts, and personal records on top."
tags: [TypeScript, React, Fastify, Prisma, PostgreSQL, Docker]
repo: https://github.com/carolisengineering/strength-in-numbers
weight: 2
diagram:
  - { label: React SPA, next: "→" }
  - { label: Fastify API, style: primary, next: "→" }
  - { label: PostgreSQL, style: secondary }
outcomes:
  - { value: 90%, label: "line-coverage floor on auth, rate limiting, the API client, and the offline outbox" }
  - { value: 8 CI jobs, label: "lint, types, purity, design tokens, contract drift, integration, and two post-deploy smokes" }
  - { value: 10 sessions, label: "of personal-record math reconciled by hand against the live finish and rebuild paths" }
architecture:
  nodes:
    - { id: spa, label: React SPA, row: 1, col: 1 }
    - { id: api, label: Fastify API, style: primary, row: 1, col: 2 }
    - { id: db, label: PostgreSQL, style: secondary, row: 1, col: 3 }
    - { id: core, label: Shared domain package, note: "types, validation, strength math", row: 2, col: 1, span: 2 }
  edges:
    - { from: spa, to: api, label: REST }
    - { from: api, to: db, label: Prisma }
    - { from: spa, to: core, label: imports }
    - { from: api, to: core, label: imports }
---

## Context

Strength in Numbers is a no-frills workout tracker for gym-goers to track the exercises, weights, reps and sets performed in their workouts. It is designed to be used at the gym on a mobile device.


## Features

This is a TypeScript monorepo with three parts:

- **A Fastify API** backed by PostgreSQL through Prisma
- **A shared domain package** holding the types, validation schemas, unit conversion, and strength math, written once and used everywhere
- **A React single-page app** built with Vite and designed for a phone browser first

The core loop is complete: pick exercises, log sets, finish the workout. On top of that sit a history list, per-exercise progress charts drawn as hand-written SVG with no chart library, and a personal-record engine that tracks four record types per exercise.

## Functionality

The web app talks to the API over REST with bearer tokens. Sign-in uses Auth0 with the PKCE flow, and the browser holds tokens in memory only. The API checks every token against Auth0's published keys and creates a user row on first login.

Every error the API returns uses one standard shape (RFC 9457 problem details), and the web client turns those into typed errors. Request and response types come from shared Zod schemas, which also generate the OpenAPI document; CI fails if the published contract drifts from the code.

The exercise catalog syncs to the client incrementally with a sync token. Set writes go through a persisted outbox keyed on a client-generated ID, so a set logged in a dead spot survives a reload and syncs when the signal returns, and a retry can't create a duplicate. Finishing a workout recomputes personal records inside the same transaction and returns any new records to the client. History pages with a keyset cursor, so the list stays stable while new workouts land. Database migrations, catalog seeding, and record rebuilds run as explicit release steps, never when the app boots.

## Decisions & Tradeoffs

{{< decision >}}Keep all domain logic in a framework-free package, and enforce it in CI. The shared package can't import React, the DOM, or Node-only APIs, so the same strength math runs in the API, in the browser, and in a future React Native app, without a rewrite.{{< /decision >}}

**Client-only React, not Next.js.** I chose a client-only React app over Next.js. The whole app sits behind sign-in, so server rendering would add a server tier and concepts that buy nothing here and don't carry over to a mobile client.

**One language across the stack.** I chose Node and TypeScript for the API even though my earlier backend work was in Go. With one language across the stack, the domain rules are written and tested once instead of twice.

**Expand-only migrations.** Migrations are expand-only: a release never drops or renames a column that the running code still reads. That costs an extra release for some changes, but deploys never need downtime.

**A written spec for every piece of work.** Every piece of work starts as a written spec with the same twelve sections, and each feature is split into an API spec and a UI spec, API first. The process is proportional to a one-person project, but it means every decision has a written reason.

## Results

The first milestone, logging a full workout from a phone, is reached. The second, history and progress, is code-complete. The results so far are about correctness:

- Every behavioral acceptance criterion in a spec has at least one test that names it, so the spec and the test suite can be checked against each other.
- The auth plugin, rate limiter, and user repository must stay at or above 90% line coverage. So must the web app's API client, auth code, workout features, and offline outbox.
- The personal-record math is checked two ways: a seeded property test proves it matches a brute-force version, and a ten-session fixture reconciled by hand runs through the live finish and rebuild paths.
- Integration tests run against a real PostgreSQL database in Testcontainers, and a browser smoke test runs the happy path against staging after every deploy.
- CI also runs lint, type-checking, the domain-package purity check, a design-token check that stops components from hard-coding colors or sizes, and the OpenAPI drift check.

## Future Work

- A week of real gym sessions from a phone, which decides what the offline work still needs: draft rows, multi-tab safety, a logout guard for unsaved sets
- Routines and supersets, so a planned workout can be started in one tap
- Account export and deletion, and production observability with traces and alerts
- Move hosting from Render to AWS with infrastructure as code, as its own project
