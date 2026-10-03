---
title: office-hours
summary: Student-support agent grounded in a program knowledge base, built on the Claude Agent SDK
tags: [Python, Claude Agent SDK, RAG, Evals, Langfuse, Red-teaming]
repo: https://github.com/carolisengineering/office-hours
weight: 2
diagram:
  - { label: Student question, next: "→" }
  - { label: Agent, style: primary, next: "⇄" }
  - { label: Knowledge base, next: "→" }
  - { label: Evals, style: secondary }
---

## Background

Riverton University needs a support system for students in its Data Science program. The agent must answer questions from the program's documentation. It should decline requests for irrlevant or sensitive information. 

## Overview

Office Hours is a student-support agent for a fictional online graduate program, the M.S. in Data Science at "Riverton University". The program's knowledge base is comprised of local text files, so there is a real ground truth to grade against. Data science has hard prerequisite chains, which makes for precise test cases: an invented prerequisite is an obvious failure.

The agent runs on the Claude Agent SDK with Haiku 4.5 and has exactly two tools. One tool searches the knowledge base. The other returns a structured response, including the answer, the documents it cites, and whether the agent refused or escalated. Quality is confirmed by a 25 test-case golden dataset with known-correct answers, an automated eval harness that scores each run, a red-team suite of automated tests that try to break it, and Langfuse tracing for realtime observability.

## How it works

A question is sent to the agent with a system prompt composed from reusable components: persona, scope, grounding rules, safety rules, output format, and few-shot examples. Every prompt version is built from those parts and logged in a changelog, so changes to rules are measureable.

The search tool has three interchangeable retrieval backends: BM25 keyword search, an LLM router that picks documents from a manifest, and a "full context" baseline that puts every document in the prompt. The agent must answer through the final-answer tool, and it may only cite documents it actually retrieved. Each run is capped at 18 model turns and 150 seconds, and hitting a cap counts as an error, not a pass.

The eval harness runs every case five times and reports rates with 95% confidence intervals. A Sonnet judge grades grounding, refusals, and tone, and I check the judge itself against 23 hand-written labels. It agrees on 20.

## Decisions & Tradeoffs

{{< decision >}}Use a small agent model and a larger model as the judge. It is harder to achieve consistent results from Haiku, and using a Sonnet judge means the grader won't share all of the agent's blind spots.{{< /decision >}}


The knowledge base is synthetic, which makes the corpus less realistic, but allows the answer key to be controlled. 


I built the knowledge base from scratch instead of scraping real documents. That makes the corpus less realistic, but it means I control the answer key, so the evaluation and the red-team results are honest.

I kept all three retrieval backends instead of picking one up front. Running them side by side answered a question I would otherwise have guessed at: at this size, does retrieval even help?

The most important decision came from a design review of my own work. It found that several scoring rules were wrong, and that the agent could see Claude Code's built-in tools even though it couldn't call them. I fixed the scoring, added unit tests for it, removed the tools, and re-ran everything. I didn't keep any number from before the fix.

## Results & Evals

Under the corrected scoring, the first hardened prompt (v2) was not measurably better than v1 on the golden set. Grounded accuracy was 39/45 against 42/45, inside the intervals. Where v2 did help was the red team: one partial result against v1's four, and no attacks broke either version.

The retrieval comparison was clearer. Every answerable miss on BM25 was a retrieval miss. Putting the whole knowledge base in context answered 45/45 grounded, and was the fastest option because it skips the search loop, but it cost 62% more per run.

The biggest gap the evals exposed was refusals that were correct but unhelpful: the agent declined without stating the policy behind the refusal. Version 3 adds one rule: search, state the policy, and cite it. It held all 13 red-team attacks, including one that no earlier version had held, and raised adversarial pass from 31/35 to 33/35. I report all of this as directional. With five runs per case, many differences sit inside the intervals.

## Next Steps

- Rewrite the few-shot examples so their values and search queries don't overlap with golden-set cases. Today they leak into some answers.
- Fix the one refusal case where the safety path wins before the agent ever searches for the policy.
- Add real multi-turn conversations, and a local-model backend through Ollama to compare against the Claude runs with the same judge.
