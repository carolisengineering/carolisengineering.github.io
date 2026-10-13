---
title: Strength in Numbers
summary: "Full-stack workout tracker for use at the gym. Log sets from your phone, even offline, then track your history, progress charts, and personal records."
tags: [TypeScript, React, Fastify, Prisma, PostgreSQL, Docker]
repo: https://github.com/carolisengineering/strength-in-numbers
weight: 2
diagram:
  - { label: React SPA, next: "→" }
  - { label: Fastify API, style: primary, next: "→" }
  - { label: PostgreSQL, style: secondary }
outcomes:
  - { value: Full Stack, label: "written in TypeScript from the React UI to the Prisma queries" }
  - { value: Auth0 Sign-In, label: "OAuth 2.0 PKCE in the browser, with the API verifying every token against Auth0's published keys" }
  - { value: Staging on Render, label: "API in a multi-stage Docker image and the web app as a static site, both auto-deployed on push to main" }
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

The core loop is complete: pick exercises, log sets, save the workout. Additional features include a history list, per-exercise progress charts, and a personal-record engine that tracks four record types per exercise.

## Functionality

The web app talks to the API over REST with bearer tokens. Sign-in goes through Auth0 using the OAuth 2.0 PKCE flow, and the browser holds tokens in memory only. The API checks every token against Auth0's published keys and creates a user row on first login.

Every error the API returns uses one standard shape, and the web client turns them into typed errors. Request and response types come from shared Zod schemas. CI regenerates the API's OpenAPI document from the code and fails if it doesn't match the committed copy, so published docs stay up to date.

Sets are written through a persisted outbox with client-generated IDs, so a set logged without a signal survives a reload, syncs when the connection returns, and can't be duplicated by a retry. Finishing a workout recomputes personal records in the same transaction and returns any new ones to the client. History uses keyset pagination, so the list stays stable as new workouts arrive. Routines are copied into a workout when it starts, so editing or deleting one never changes past workouts.

## Decisions & Tradeoffs

{{< decision >}}Keep all domain logic in a framework-free package, and enforce it in CI. The shared package can't import React, the DOM, or Node-only APIs, so the same strength math runs in the API, in the browser, and in a future React Native app, without a rewrite.{{< /decision >}}

**Client-only React:** The whole app sits behind sign-in, so there's no public content for server rendering to speed up or index. A single page application is sufficient.

**One language across the stack:** By using Node and TypeScript for the API, domain rules are written and tested once instead of twice.

**Backwards compatible migrations:** A release never drops or renames a column that the running code still reads. That means some changes require an extra release, but deploys never need downtime.

**A written spec for every piece of work:** Every piece of work starts as a written spec with the same twelve sections, and each feature is split into an API spec and a UI spec, API first. The process is proportional to a one-person project, but it means every decision has a written reason.

## Results

With limited usage, the results so far prioritize correctness:

- Every behavioral acceptance criterion in a spec has at least one test that names it, so the spec and the test suite can be checked against each other.
- The auth plugin, rate limiter, and user repository must stay at or above 90% line coverage. So must the web app's API client, auth code, workout features, and offline outbox.
- The personal-record math is checked two ways: a seeded property test proves it matches a brute-force version, and a ten-session fixture reconciled by hand runs through the live finish and rebuild paths. The same fixture also checks the progress-chart series against hand-worked values.
- Integration tests run against a real PostgreSQL database in Testcontainers, and a browser smoke test runs the happy path against staging after every deploy.
- CI also runs lint, type-checking, the domain-package purity check, a design-token check that stops components from hard-coding colors or sizes, and the OpenAPI drift check.

## Future Work

- Log real gym sessions from a phone to help determine which offline features add the most value: draft rows, multi-tab safety, a logout guard for unsaved sets
- Account export and deletion, and production observability with traces and alerts
- Move hosting from Render to AWS with infrastructure as code
