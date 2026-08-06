# Account dossier — Escuna

Generated 2026-08-06, reflecting the window 2026-05-08 to 2026-08-05 (90 days). This is a snapshot at generation time — the live account always overrides what's written here. Treat every judgment below as a starting posture, not a fixed truth.

## The account

- Platform: Google Ads
- Account ID: 4882012999
- Account name: Escuna
- Currency: BRL — all budgets, bids, and figures you pull must be read and reported in BRL, never assumed in another currency.
- Timezone: America/Sao_Paulo — align date-range pulls and day-parting analysis to this timezone, not UTC.
- Connected since: 2026-05-28

This account runs multiple campaigns concurrently (not a single-campaign setup). Never hardcode or memorize campaign names/IDs from any prior session or from this document — campaign sets churn (paused, added, renamed). Always call `search_tools` / `get_tool_schema` to find and use the live campaign-listing tool before any analysis, reporting, or optimization action.

## How this account presents

Escuna has spend in the window, runs several campaigns simultaneously, and — critically — every campaign that is spending has conversions recording against it. The status mix is mixed: some campaigns active, some paused/other states. This is the profile of an account that has cleared setup risk. Tracking is not the question here; performance and allocation are.

This is meaningfully different from an account still proving out its tracking, or one sitting built but idle. Here, the operator's job is not "get this account healthy" — it's "make this account efficient and keep it that way." Treat any hint of tracking irregularity (a campaign spending with no conversions showing, a sudden drop to zero) as a regression, not the baseline condition — investigate immediately rather than assuming it's normal for this account.

## Operating priorities

1. **Protect what's working before you chase what's not.** With multiple campaigns and conversions flowing, the first temptation is to touch everything. Resist. Identify which live campaigns are carrying efficient conversion volume and leave their core structure (bids, targeting) alone unless you have a specific hypothesis and a live-data reason.
2. **Use the mixed status mix deliberately.** Paused campaigns are not neutral — they represent either dead weight to formally archive/clean up, or dormant ideas to revisit. Every session, know which campaigns are paused and why (check naming, budgets, last-active signals) rather than ignoring them.
3. **Reallocate based on live efficiency signals, not tenure.** In a multi-campaign, tracked account, budget should follow current conversion efficiency pulled fresh each session — not follow whichever campaign has historically had the biggest budget.
4. **Guard tracking continuity.** Being "tracked" today doesn't mean tracked forever — conversion actions can break silently (tag removed, offline import stalls). Spot-check that conversions are still recording across active spenders every time you're in the account.
5. **Growth only after efficiency is confirmed.** New campaigns, expanded budgets, or new match-type/audience bets come after you've confirmed current spend is working — not in parallel with first-pass cleanup.

## First session

Before forming any opinion on this account, establish a live baseline:
- Pull the full live campaign list via `search_tools`/`get_tool_schema` — get current names, IDs, statuses, budgets. Do not reuse any campaign reference from this document.
- Segment by status: which are active, paused, removed. Note the mixed-status pattern in concrete terms (which campaigns, since when).
- Pull conversion actions configured on the account and confirm which are primary vs secondary — this shapes what "efficient" means here.
- For each active, spending campaign, pull recent-window performance (spend, conversions, cost/conversion, whatever the live tool returns) to build your own current efficiency ranking. Do not rely on this document for any figure.
- Check budget levels against actual spend pacing — flag any campaign under- or over-delivering against its budget.
- Confirm account-level and campaign-level conversion tracking is still intact (recent conversions present, not just historical).

Record this baseline somewhere durable (notes tool, if available) so week-over-week comparisons are yours, not guesses.

## Operating cadence

**Weekly**
- Refresh the live campaign list — check for new campaigns, status changes, or budget edits made outside your sessions.
- Re-pull performance for active campaigns; compare against your last recorded baseline to catch drift (efficiency slipping, spend stalling, conversions silently dropping).
- Review paused campaigns list for any that should be formally archived or reconsidered.
- Check search terms / placement reports (via live tool discovery) for waste worth excluding.

**Monthly**
- Do a full efficiency ranking across all active campaigns and propose reallocation of budget from underperformers to overperformers, backed by the current pull — not last month's numbers.
- Audit conversion actions end-to-end: confirm nothing has silently broken, confirm attribution settings haven't shifted.
- Revisit the mixed status mix as a set: decide explicitly on each paused campaign — relaunch, archive, or leave dormant with a reason.
- Only after the above is clean, evaluate whether the account is ready for expansion (new campaigns, new budget) and size that expansion off current live performance, not off this dossier.