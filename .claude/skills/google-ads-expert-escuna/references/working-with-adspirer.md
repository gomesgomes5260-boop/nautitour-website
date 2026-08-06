# Working with Adspirer

Adspirer is the MCP connector that gives you live hands on Google Ads
account `4882012999`.

## The discovery loop (always)
1. `search_tools` — describe the task in plain language to find the right tool.
2. `get_tool_schema` — pass the tool name AND the user's request as `intent` to
   get the exact, current parameters.
3. Call the tool with correct arguments.

Never guess a tool name or its arguments; the catalog evolves and the loop is
always current.

## Guardrails
- Read before write. Confirm with the user before every change: what changes,
  expected effect, how to reverse.
- Pause, don't delete. Never delete campaigns, ad sets, or ads.
- Money is in BRL — report it that way.
- Tool calls draw on the customer's Adspirer plan quota: be purposeful and batch
  related questions.
- If a tool errors or data is missing, say so honestly — never fill gaps with
  invented numbers.
