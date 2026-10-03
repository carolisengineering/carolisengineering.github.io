---
title: strength-in-numbers
summary: A mobile-first workout logging and progress tracking web app
tags: [TypeScript, React, Fastify, Prisma, PostgreSQL, Docker]
repo: https://github.com/carolisengineering/strength-in-numbers
weight: 1
diagram:
  - { label: React SPA, next: "→" }
  - { label: Fastify API, style: primary, next: "→" }
  - { label: Domain core, next: "→" }
  - { label: PostgreSQL, style: secondary }
---

## Context

Strength in Numbers is a no-frills workout tracker for gym goers to track the exercises, weights, reps and sets performed in their workouts. It is designed to be used at the gym on a mobile device.


## Features

This is a TypeScript monorepo with three parts:

- **A Fastify API** backed by PostgreSQL through Prisma
- **A shared domain package** holding the types, validation schemas, unit conversion, and strength math, written once and used everywhere
- **A React single-page app** built with Vite and designed for a phone browser first

So far the exercise catalog API, the workout session API, the app shell with sign-in, and the profile screen are specified and built. Set logging and the workout screen are next.

## How it works

The web app talks to the API over REST with bearer tokens. Sign-in uses Auth0 with the PKCE flow, and the browser holds tokens in memory only. The API checks every token against Auth0's published keys and creates a user row on first login.

Every error the API returns uses one standard shape (RFC 9457 problem details), and the web client turns those into typed errors. Request and response types come from shared Zod schemas, which also generate the OpenAPI document; CI fails if the published contract drifts from the code.

The exercise catalog syncs to the client incrementally with a sync token. Writes are idempotent, so a retried request after a dropped connection can't create a duplicate workout. Database migrations and catalog seeding run as explicit release steps, never when the app boots.

## Decisions & Tradeoffs

{{< decision >}}Keep all domain logic in a framework-free package, and enforce it in CI. The shared package can't import React, the DOM, or Node-only APIs, so the same strength math runs in the API, in the browser, and in a future React Native app, without a rewrite.{{< /decision >}}

I chose a client-only React app over Next.js. The whole app sits behind sign-in, so server rendering would add a server tier and concepts that buy nothing here and don't carry over to a mobile client.

I chose Node and TypeScript for the API even though my earlier backend work was in Go. With one language across the stack, the domain rules are written and tested once instead of twice.

Migrations are expand-only: a release never drops or renames a column that the running code still reads. That costs an extra release for some changes, but deploys never need downtime.

Every piece of work starts as a written spec with the same twelve sections, and each feature is split into an API spec and a UI spec, API first. The process is proportional to a one-person project, but it means every decision has a written reason.

## Results

The project has no users yet, so the results are about correctness:

- Every behavioral acceptance criterion in a spec has at least one test that names it, so the spec and the test suite can be checked against each other.
- The auth plugin and the user repository must stay at or above 90% line coverage. So must the web app's API client and auth code.
- Integration tests run against a real PostgreSQL database in Testcontainers.
- CI runs lint, type-checking, the domain-package purity check, a design-token check that stops components from hard-coding colors or sizes, and the OpenAPI drift check.

## What I'd do next

- Finish set logging and the workout screen, the main loop the app exists for
- Add connectivity resilience: a local copy of the in-progress workout, and a retry queue that drains when the signal comes back
- Build history, progress charts, and the personal-record engine
- Move hosting from Render to AWS with infrastructure as code, as its own project
