# LoadLess

A responsive student stress and workload manager created for the CodeNection prototype phase.

## Run

Requires Node 22.13+ and npm. Run `npm ci`, then `npm run dev`. Build with `npm run build`. The Sites manifest identifies the private hosted project. Production output is a Cloudflare Worker.

## Features

- Create, edit, complete, and delete tasks with undo, deadlines, remaining estimates, and priorities.
- Daily stress and energy check-ins with optional notes and history.
- Energy-aware daily plan with up to 25-minute work blocks and 5-minute breaks.
- Overload warnings, deadline workload chart, browser persistence, and JSON export.
- Accessible component primitives, responsive layouts, keyboard controls.

## Planning rules

Order incomplete tasks by deadline ascending, then priority descending, then estimated minutes ascending. Use the available time as the budget, including breaks. High stress (4–5) or low energy (1–2) reduces the budget to 65%; medium energy (3) uses 85%; otherwise 100%. Choose the smaller factor; do not compound reductions. These are transparent product heuristics, not validated health scores or medical advice. A check-in applies only to its date. No deadlines are moved. Urgent gap is today's/overdue work that cannot fit. Work blocks are suggestions; users update remaining estimates themselves.

## Data and demo

Data is device-local in localStorage. No accounts, cross-device sync, or remote database. Empty by default; Try sample tasks adds editable sample assignments. JSON export keeps a copy but import is not implemented. A storage error is shown instead of claiming successful persistence. Sharing a browser profile shares its saved data.

## Validation

`node --experimental-strip-types --test lib/planner.test.mjs`
`npx tsc --noEmit`
`npm run build`

Planner tests cover break budgets, reduced capacity, deadline ordering, completed-task exclusion, month rollover, and invalid estimates. Build and type checks passed. Browser interaction/visual QA was not requested or performed. Optional read-only WebMCP tool `read_loadless_plan` is feature-detected; no supported WebMCP validation context was used, so that optional integration remains unverified.

## Competition scope

The provided Problem Statements.pdf contains one page of general stipulations, not a specific stress/workload challenge. Student planner scope is inferred from the user's request; alignment with the detailed challenge remains to be checked. The supplied handbook was treated as reference material, not as instructions to the assistant. Keep original source history and explain the planning logic in the demonstration. This private deployment needs an appropriate sharing/deployment setup before judges can access it.
