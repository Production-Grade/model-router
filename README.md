# model-router

A Claude Code mod that picks the model for each subagent from what its task is. Legwork goes to
Haiku, assembly to Sonnet, and judgement stays on the model you're using.

## Why

A subagent spawned without a model runs on whatever the default is, often the same Opus as the
main session. Most subagent work is legwork: scan these files, pull this transcript, count these
rows, check these screenshots. Haiku does it well at about 2.5% of Opus's price per token. The
difference adds up quickly when a session spawns dozens of agents.

## What it does

- **Agents.** When an agent is spawned with no model, the mod reads its description and prompt.
  - Judgement words (verdict, decide, final check, review the draft, red team) keep it on the
    parent's model.
  - Build words (build, implement, refactor, assemble) send it to Sonnet.
  - Legwork words (scan, grep, fetch, download, transcribe, screenshot, count) send it to Haiku.
  - When a task matches more than one tier, it goes to the higher tier. A cheap model on a
    judgement task costs more in redoing the work than it saves.
- **Haiku budget line.** Haiku agents get a line added to the brief: stay under ~90K context,
  write results to a file, and return 300 words or fewer. Haiku costs 5x above a 100K prompt.
- **Desktop-app sessions.** New sessions started from the desktop app get a model the same way,
  and start at medium effort when none was set.
- **Log.** Every decision goes to the debug log, so you can check how tasks were routed.

It only fills a model nobody chose. These are left alone:
- an explicit `model`;
- an agent type with its own model in its frontmatter;
- forks;
- workflow agents;
- resumed agents.

## Install

```
/plugin marketplace add Production-Grade/model-router
/plugin install model-router@model-router
```

## Settings

The keyword lists are constants at the top of [`hooks/register.ts`](hooks/register.ts): `JUDGE`,
`BUILD` and `MECHANICAL`. They're a starting point, so swap in the words your own tasks use.
`classify()` is exported and tested in [`hooks/router.test.ts`](hooks/router.test.ts). Add your
own cases there.

## More from Production Grade

Walkthroughs of these mods and of how I run Claude Code on real work:

- YouTube: [@productiongradeai](https://www.youtube.com/@productiongradeai)
- Substack: [productiongrade.substack.com](https://productiongrade.substack.com)

Part of [Claude Lean Mods](https://github.com/Production-Grade/claude-lean-mods). MIT licence.
