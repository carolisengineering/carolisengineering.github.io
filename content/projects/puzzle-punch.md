---
title: Puzzle Punch
summary: "Two-player couch co-op game in the browser, with a public Firebase build that records anonymous play for the next design round."
tags: [JavaScript, Canvas, Firebase, Firestore, Node.js, Game design]
repo: https://github.com/carolisengineering/puzzle-punch-live
weight: 3
diagram:
  - { label: Full game, next: "→" }
  - { label: Live build, style: primary, next: "→" }
  - { label: Firestore, style: secondary }
outcomes:
  - { value: $0, label: "hard cost ceiling: the live build runs on Firebase's free Spark plan, where going over quota stops writes instead of billing" }
  - { value: 12×, label: "smaller run logs after gzip (389 KB to 32 KB on average), so about 30,000 runs fit before an export" }
  - { value: 72 tests, label: "37 unit tests, plus 35 against the Firebase emulators for the security rules and the export" }
architecture:
  nodes:
    - { id: game, label: Full game, note: private repo, row: 1, col: 1 }
    - { id: live, label: Live build, note: "trimmed to one level", style: primary, row: 1, col: 2 }
    - { id: hosting, label: Firebase Hosting, row: 1, col: 3 }
    - { id: export, label: Export script, note: "verify, then delete", row: 2, col: 1 }
    - { id: fs, label: Firestore, note: gzipped run logs, style: secondary, row: 2, col: 2 }
    - { id: players, label: Players, note: anonymous sign-in, row: 2, col: 3 }
  edges:
    - { from: game, to: live, label: trim }
    - { from: live, to: hosting, label: deploy }
    - { from: hosting, to: players, label: serves }
    - { from: players, to: fs, label: run logs }
    - { from: fs, to: export, label: export }
    - { from: export, to: game, label: telemetry }
---

## Context

Puzzle Punch is a two-player couch co-op game that I co-designed and playtest with Jake Herndon. The two players are a couple underground. She is an ore miner who opens veins by solving line puzzles, and her lamp burns oil. He fights off what comes out of the dark while she works. A run walks in, holds the main room through three puzzles, takes "one more" ore as often as the couple dare, and then escapes. Card rewards with three rarity tiers change both players' moves along the way, and the combat is tuned against Hades and Hades II.

The full game has seven levels and lives in a private repository. I built the public side myself: a trimmed, one-level build on Firebase that friends can play from a link at [puzzle-punch.web.app](https://puzzle-punch.web.app), which sends its run logs back to us.

## Features

The game is one self-contained HTML file of about 44,000 lines, drawn on a canvas with no external assets. It plays on two gamepads or a shared keyboard. A small local helper serves it, keeps high scores per level, and saves a JSON log of every run, which is the raw material for each design round.

The live build ships one level, The Living Depths, and starts straight into it. Every run there is recorded the same way as at home: anonymously, compressed, and in the same file shape, so the tools that read our own runs can read strangers' runs too.

## Functionality

A trim script turns the full game into the live game. It checks the source file's MD5 hash first and stops if anything it expects has moved, then cuts the level list down to the depths and skips the hub. The game file itself never contains cloud code. The deploy script copies it to `index.html`, adds the telemetry module and the Google tag, and labels the release with the game version and the commit.

The telemetry module reads the state the game exposes on `window.DELVE` once a second. Run detection is a pure function from the last snapshot to the next, so it is unit tested without a browser. Computer-played runs and the dev studio are skipped. Each player signs in anonymously. A run writes a start document, then the full log gzipped in the browser with `CompressionStream`. If the page is hidden mid-run, a partial log is written; logs too large for one document fall back to the slim summary.

Firestore rules let a player create and update only their own runs, and never read or delete. Every field is typed and size-capped, and the document ID must match the user and the run, so one run can't fan out into many documents. An export script, run with admin credentials, unzips each log, checks its length and that it parses, and writes it to disk. It re-reads the file, appends a CSV summary row, and only then deletes the document, on condition that it hasn't changed since it was read. Inflation is capped at the stored size, so a gzip bomb is refused.

## Decisions & Tradeoffs

{{< decision >}}Keep the cloud code out of the game file. The live game is re-copied from the main repository and re-trimmed for every version, so anything edited into it would be lost. The telemetry lives in its own module, which the deploy adds to the published page only.{{< /decision >}}

**Full logs, not summaries.** Storing only a summary per run would have been cheaper. I kept the whole event stream because our design rounds read run logs event by event. I measured 271 of our own logs to check it fits the free plan, at roughly 7,000 runs a day before the write quota.

**Firestore over Cloud Storage.** Cloud Storage suits files better, but it needs the paid Blaze plan, which has no hard cost cap, and its free upload quota works out to about 165 runs a day. On the Spark plan the worst case is that recording stops until the next day.

**A separate repository with no shared history.** The live repository starts fresh. Fixes in the main game don't flow across on their own. That is deliberate: each live version is a known source file, trimmed by the same script, with its hash in the README.

**Samplers before builds.** In the main game, anything visual starts as a sampler page that we play and rule on before it's built. Claude writes the patches, as patch scripts with their own checks. We write the rulings and playtest notes that decide what goes in. The 65 build notes record each version and the reasons behind it.

## Results

The main game is at v0.85u after 168 commits and 277 recorded runs. The live build is at v0.85r and recording: hosting, anonymous sign-in, the security rules, and the export routine are all deployed. The 37 unit tests cover run detection, the deploy's script injection, and the export. The 35 emulator tests check that the rules reject wrong owners, wrong IDs, oversized fields, and mismatched log kinds, and that the export deletes only what it has verified.

## Future Work

- Read the first batch of public runs alongside our own, starting with where new players die and how far they get
- Carry the newer versions across with the trim script, and add a short how-to-play card for players who weren't on the couch
- Add App Check if junk writes ever show up
- Bring a second level to the live build once the depths are settled
