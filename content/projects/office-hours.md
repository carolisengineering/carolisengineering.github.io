---
title: Office Hours
summary: AI agent that answers students' questions from their program's documentation, with automated tests that grade its answers and try to break it
tags: [Python, RAG, Evals, Langfuse, Red-teaming, Claude Agent SDK]
repo: https://github.com/carolisengineering/office-hours
weight: 1
diagram:
  - { label: Student question, next: "→" }
  - { label: Agent, style: primary, next: "⇄" }
  - { label: Knowledge base }
outcomes:
  - { value: 45 of 45, label: "grounded answers with the whole knowledge base in context, at 62% more cost per run" }
  - { value: 13 of 13, label: red-team attacks held by the third prompt version }
  - { value: 20 of 23, label: hand-written labels the Sonnet judge agrees with }
architecture:
  nodes:
    - { id: q, label: Student question, row: 1, col: 1 }
    - { id: agent, label: Agent, note: Haiku 4.5, style: primary, row: 1, col: 2 }
    - { id: kb, label: Knowledge base, row: 1, col: 3 }
    - { id: answer, label: Structured answer, note: with citations, row: 2, col: 2 }
    - { id: evals, label: Eval harness, note: Sonnet judge, style: secondary, row: 2, col: 3 }
  edges:
    - { from: q, to: agent }
    - { from: agent, to: kb, label: search, both: true }
    - { from: agent, to: answer, label: returns }
    - { from: evals, to: answer, label: scores }
---

## Context

Riverton University, a fictional school, needs a support system for students in its online M.S. in Data Science. The agent must answer questions from the program's documentation, and decline requests for irrelevant or sensitive information.

## Features

The program's knowledge base is a set of local text files, so there is a real ground truth to grade against. Data science has hard prerequisite chains, which makes for precise test cases: an invented prerequisite is an obvious failure.

The agent runs on the Claude Agent SDK with Haiku 4.5 and has exactly two tools. One tool searches the knowledge base. The other returns a structured response, including the answer, the documents it cites, and whether the agent refused or escalated. Quality is measured by a 25-case golden dataset with known-correct answers, an automated eval harness that scores each run, a red-team suite of automated tests that try to break it, and Langfuse tracing for real-time observability.

## Functionality

A question is sent to the agent with a system prompt composed from reusable components: persona, scope, grounding rules, safety rules, output format, and few-shot examples. Every prompt version is built from those parts and logged in a changelog, so changes to rules are measurable.

The search tool has three interchangeable retrieval backends: BM25 keyword search, an LLM router that picks documents from a manifest, and a "full context" baseline that puts every document in the prompt. The agent must answer through the final-answer tool, and it may only cite documents it actually retrieved. Each run is capped at 18 model turns and 150 seconds, and hitting a cap counts as an error, not a pass.

The eval harness runs every case five times and reports rates with 95% confidence intervals. A Sonnet judge grades grounding, refusals, and tone. The judge itself is checked against 23 hand-written labels, and agrees on 20 of them.

## Decisions & Tradeoffs

{{< decision >}}A design review partway through development found that several scoring rules were wrong. It also found that the agent could see Claude Code's built-in tools but couldn't call them. I fixed the scoring, added unit tests for it, removed the tools, and re-ran everything. I didn't keep any number from before the fix.{{< /decision >}}

**Small agent, larger judge.** I used a small agent model and a larger model as the judge. It is harder to achieve consistent results from Haiku, and using a Sonnet judge means the grader won't share all of the agent's blind spots.

**A synthetic knowledge base.** I built the knowledge base from scratch instead of scraping real documents. That makes the corpus less realistic, but it means I control the answer key, so the evaluation and the red-team results are honest.

**Three retrieval backends, side by side.** I kept all three retrieval backends instead of picking one up front. Running them side by side answered a question I would otherwise have guessed at: at this size, does retrieval even help?

## Results

Under the corrected scoring, the first hardened prompt (v2) was not measurably better than v1 on the golden set. Grounded accuracy was 39/45 for v2 against 42/45 for v1, inside the intervals. Where v2 did help was the red team: one partial result against v1's four, and no attacks broke either version. The figures below come from the 20-case main slice, with five runs per case; the other 5 cases are held out.

| | v1 | v2 | v3 |
|---|---|---|---|
| Grounded accuracy (9 answerable cases) | 42/45 | 39/45 | 39/45 |
| Adversarial pass (7 adversarial cases) | 32/35 | 31/35 | 33/35 |
| Red-team attacks held, of 13 | 9 | 12 | 13 |

The retrieval comparison was clearer. Every answerable miss on BM25 was a retrieval miss. Putting the whole knowledge base in context answered 45/45 grounded, and was the fastest option because it skips the search loop, but it cost 62% more per run.

The biggest gap the evals exposed was refusals that were correct but unhelpful: the agent declined without stating the policy behind the refusal. Version 3 adds one rule: search, state the policy, and cite it. It held all 13 red-team attacks, including one that no earlier version had held, and raised adversarial pass from 31/35 to 33/35. I report all of this as directional. With five runs per case, many differences sit inside the intervals.

## Future Work

- Rewrite the few-shot examples so their values and search queries don't overlap with golden-set cases. Today they leak into some answers.
- Fix the one refusal case where the safety path wins before the agent ever searches for the policy.
- Add real multi-turn conversations, and a local-model backend through Ollama to compare against the Claude runs with the same judge.
