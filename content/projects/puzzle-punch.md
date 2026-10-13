---
title: Puzzle Punch
summary: "A two-player couch co-op game in the browser, with a public Firebase build that records anonymous play statistics"
tags: [Game Design, JavaScript, Firebase, Firestore, Node.js]
repo: https://github.com/carolisengineering/puzzle-punch-live
weight: 3
diagram:
  - { label: Game Design, next: "→" }
  - { label: Live Build, style: primary, next: "→" }
  - { label: Firebase, style: secondary }
outcomes:
  - { value: Have Fun!, label: "one player punches the baddies while the other solves puzzles" }
  - { value: For Free, label: "share the game without incurring any hosting costs" }
architecture:
  nodes:
    - { id: game, label: Game Design, note: "local experiments", row: 1, col: 1 }
    - { id: live, label: Live Build, note: "gameplay loop", style: primary, row: 1, col: 2 }
    - { id: hosting, label: Firebase Hosting, row: 1, col: 3 }
    - { id: export, label: Export Script, note: "verify, then delete", row: 2, col: 1 }
    - { id: fs, label: Firestore, note: save run logs, style: secondary, row: 2, col: 2 }
    - { id: players, label: Online Players, note: anonymous sign-in, row: 2, col: 3 }
  edges:
    - { from: game, to: live, label: trim }
    - { from: live, to: hosting, label: deploy }
    - { from: hosting, to: players, label: serves }
    - { from: players, to: fs, label: run logs }
    - { from: fs, to: export, label: export }
    - { from: export, to: game, label: telemetry }
---

## Context

Puzzle Punch is a two-player couch co-op game. One player is an ore miner who opens veins by solving line puzzles, and lights the room with a lantern. The other player fights off what comes out of the dark while the puzzles are being solved. Card rewards with three rarity tiers change both players' abilities along the way. Safely escape the dungeon after solving the biggest puzzle to win!

The game is hosted on a Firebase web app, where friends can play from a link at [puzzle-punch.web.app](https://puzzle-punch.web.app). Run logs are stored in Firestore for use in balancing game mechanics.

## Features

The game is one self-contained HTML file, drawn on a canvas with no external assets. It plays on two gamepads or a shared keyboard. A small local helper serves it, keeps high scores per level, and saves a JSON log of every run, which is the raw material for each design round.

The live build ships one level, The Living Depths, launched directly from the title screen. Every run is recorded anonymously, compressed, then exported to inform future game design decisions based on actual player data.

## Functionality

The game is hosted on Firebase Hosting. Each player signs in anonymously, so nobody needs an account to play.

Google Analytics counts page views and two custom events: `run_start` when a run begins, and `run_end` when it finishes, with the result, why it ended, how long it lasted, and the score. That's enough to see how many people play and how far they get.

Each run's full log is compressed and saved to Firestore, where security rules only let a player write their own runs. An export script downloads the logs for our design rounds, then clears them out of the database.

## Decisions & Tradeoffs

{{< decision >}}Stay on Firebase's free plan. If the game ever goes over the free quota, recording stops until the next day instead of running up a bill, so sharing the link costs nothing.{{< /decision >}}

**Full logs, not summaries.** A summary per run would have been cheaper to store, but telemetry analysis scripts read runs event by event, so the whole log is saved.

## Results

The live build is up and currently recording.

## Future Work

- Add a short how-to-play card for new players
- Bring a second level to the live build
