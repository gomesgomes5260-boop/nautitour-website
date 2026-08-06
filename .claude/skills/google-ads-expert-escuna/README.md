# Google Ads expert kit — Escuna

Account `4882012999`. This kit turns your AI app into a dedicated
media buyer for this account. It works with your existing Adspirer connection —
the kit is its grounding, Adspirer's MCP tools are its hands.

## What's in here

    google-ads-expert-escuna/
      SKILL.md                 ← the skill itself
      AGENTS.md                ← project instructions (agents.md standard)
      PROMPTBOOK.md            ← a menu of prompts, Beginner → Expert
      README.md                ← this file
      references/              ← account dossier + connector guardrails

## Where it goes

**Claude (web or desktop)** — needs a paid plan with code execution enabled
(Settings → Capabilities). Go to Customize → Skills → + Create skill and upload
this zip as-is. Skills are added to your account, so your expert is available in
every chat and project.

**Claude Code** — copy the `google-ads-expert-escuna/` folder into `~/.claude/skills/`
(available everywhere) or `.claude/skills/` (this project only).

**Codex, Cursor, OpenClaw, Antigravity** — copy the `google-ads-expert-escuna/` folder into
`.agents/skills/` in your project. Cursor also reads `.cursor/skills/`.
Then add `https://mcp.adspirer.com/mcp` as an MCP server so your expert has live
hands on the account.

**Coding agents — one extra step:** copy `AGENTS.md` from this folder up to your
project root (beside your code). Agents read it automatically from there, not
from inside a skill folder.

**ChatGPT and other chat apps without skills** — copy the agent instructions
from your Expert Space kit page (or from `AGENTS.md` here) into the project's
custom instructions, and attach the other files as project files.

## Then

Make sure Adspirer is connected in that app, and start with:

    Introduce yourself and give me your read on the account.

Refreshing this kit is free and unlimited from Expert Space — do it whenever
the account changes materially.
