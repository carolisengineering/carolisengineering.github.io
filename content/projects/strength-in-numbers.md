---
title: Strength in Numbers
summary: "A full-stack workout tracker for use at the gym. Log sets from your phone, even offline. Save routines with timed sections, view history and personal records, and sync workouts with other fitness tracking apps."
tags: [TypeScript, React, Fastify, Prisma, PostgreSQL, Docker, OpenTelemetry, Terraform]
repo: https://github.com/carolisengineering/strength-in-numbers
weight: 1
diagram:
  - { label: React SPA, next: "→" }
  - { label: Fastify API, style: primary, next: "→" }
  - { label: PostgreSQL, style: secondary }
outcomes:
  - { value: Data Isolation, label: "51 API routes tested, 222 SQL queries audited, row-level security on every table" }
  - { value: Metrics & Traces, label: "Every API request traced in Grafana Cloud, with user data filtered out before export" }
  - { value: k6 Load Tests, label: "up to 150 simulated lifters logging real workouts to find the API's limit" }
architecture:
  nodes:
    - { id: spa, label: React SPA, note: "Offline Sync", row: 1, col: 1 }
    - { id: api, label: Fastify API, note: "OpenTelemetry", style: primary, row: 1, col: 2 }
    - { id: db, label: PostgreSQL, note: "Row-:evel Security", style: secondary, row: 1, col: 3 }
    - { id: core, label: Shared Domain Package, note: "types, validation, fitness logic", row: 2, col: 1, span: 2 }
  edges:
    - { from: spa, to: api, label: REST }
    - { from: api, to: db, label: Prisma }
    - { from: spa, to: core, label: imports }
    - { from: api, to: core, label: imports }
---

## Context

Strength in Numbers is a workout tracker for gym-goers to track the exercises, weights, reps and sets performed in their workouts. It is designed to be used at the gym on a mobile device.

## Features

This is a TypeScript monorepo with three parts:

- **A Fastify API** backed by PostgreSQL through Prisma
- **A shared domain package** holding the types, validation schemas, unit conversion, and strength math, written once and used everywhere
- **A React single-page app** built with Vite and designed for a phone browser first

The core loop is complete: pick exercises, log sets with customizable weights and reps, and finish the workout. Routines are available to plan workouts in advance, letting users group exercises into supersets and sections. Section timers allow tracking AMRAPs, time caps and timed sets. Several exercise types are included, covering weighted and bodyweight repts, timed holds, cardio and distance variations. Users can also browse history, chart progress, see records for each exercise, and edit completed workouts. A private integration imports past workouts from other workout trackers and exports new ones to the same tools.

## Functionality

The web app sends requests to the API over REST. Sign-in uses Auth0 with the Authorization Code flow and PKCE, and the API verifies every token's signature against Auth0's published keys. Request and response types come from shared Zod schemas, which also generate the API's OpenAPI document. CI regenerates it on every build and fails if it differs from the committed copy.

Sets are written through a persisted outbox with client-generated IDs, so a set logged without a signal survives a reload, syncs when the connection returns, and can't be duplicated by a retry. Finishing a workout, or editing one later, recomputes personal records in the same transaction under a per-user lock.

**Data isolation in three layers.** A test calls all 51 routes in the app as one user with another user's IDs, and expects a response that the record doesn't exist. A generated audit lists every SQL statement, and CI blocks any new or changed query until it has reviewed. Postgres row-level security returns only the current user's rows, even from a query written without a user check. The API refuses to start under any login that could bypass row-level security.

**Observability and load.** The API exports OpenTelemetry metrics and traces to Grafana Cloud. Spans pass through an allowlist, so only route templates, status codes and parameterized SQL leave the server, never IDs or request bodies. A k6 tool steps simulated lifters through real sessions at gym pace, from 10 to 150 at once, and reports the highest step before saves slow down or fail.

## Decisions & Tradeoffs

{{< decision >}}Enforce data isolation in Postgres with row-level security. Today's filters work, but one missed filter in a future change could leak data. The app connects with a restricted login that can't disable row-level security.  The tradeoff: schema changes need a separate owner login, and every new table needs its own access policies.{{< /decision >}}

**Domain logic in a framework-free package.** CI blocks the shared package from importing React, the DOM, or Node-only APIs, so the same training load calculations run in the API, in the browser, and in a future React Native app.

**Backwards-compatible migrations.** A release never drops or renames a column that the running code still reads. Some changes take an extra release, but deploys never need downtime.

**A written spec for every piece of work.** Each feature is split into an API spec and a UI spec. API changes are built first, and every acceptance criterion has a test that names it. Every decision has a written reason.

## Results

The app has only a few casual users, so the work to date prioritizes correctness over scale:

- The cross-user tests call every route from one user's account while requesting another users data and none returned it. An audit checks all 222 SQL queries and confirms that each one either filters by user or touches no user data.
- The personal-record math is checked against a brute-force version with seeded property tests, and against a ten-session fixture worked out by hand.
- Integration tests run against real PostgreSQL in Testcontainers, as the same restricted role the API uses, and a browser smoke test runs against staging after every deploy.
- CI runs lint, type-checking, the domain-package purity check, the query audit, a design-token check, and the OpenAPI drift check.

## Future Work

- Turn on row-level security in staging and run the load test there, which together gate the first real users
- Production on Google Cloud: Cloud Run and Firebase Hosting, defined in Terraform and released by an approved workflow, written and waiting to be applied
- Open the app to lifters at my gym
