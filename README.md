# Atomic-Workstation

A local-first AI workstation for **solo inventors and vibe coders** — one environment for code, terminals, browsers, agents, email, databases, and deploys, with a first-party **Atomic Gateway** (OpenAI-compatible, FOSS SDK adapters) and persistent bi-temporal memory.

## Status

**P0 implemented** — monorepo, orchestrator, projects API, vault, MCP hub scaffold, FOSS CI.

## Quick start

```bash
pnpm install
pnpm foss:check
pnpm -r build
pnpm -r test

# Terminal 1 — orchestrator
pnpm --filter @atomic/orchestrator dev

# Terminal 2 — desktop UI (Vite)
pnpm --filter @atomic/desktop dev
```

Data defaults to `./data` (PGlite). Set `ATOMIC_VAULT_UNLOCKED=true` for local vault writes.

## Packages

| Package | Role |
| --- | --- |
| `apps/desktop` | Tauri 2 + React workbench shell |
| `apps/orchestrator` | Fastify API + WebSocket |
| `packages/db` | PGlite/Postgres via Drizzle |
| `packages/vault` | Encrypted secrets store |
| `packages/mcp-hub` | Local MCP client hub |
| `packages/ui` | NeuroRainbow design tokens |
| `packages/shared` | API types (Zod) |

| Document | Purpose |
| --- | --- |
| [Full platform plan](docs/plans/2026-07-24-001-feat-atomic-workstation-plan.md) | Requirements R1–R96, 31 implementation units, delivery tiers T1–T3 |
| [FOSS AI stack](docs/foss-ai-stack.md) | Canonical SDK inventory |
| [FOSS exceptions](docs/foss-exceptions.md) | REST shims and custom MCP servers |

## Principles

- **Solo-first** — one local user; no team RBAC or enterprise SSO
- **FOSS-first** — `@ai-sdk/*`, LangGraph, MCP SDK; no LiteLLM
- **BYOK** — your API keys, local or self-hosted inference
- **Desktop-first** — Tauri 2; PGlite + LanceDB on desktop; Postgres + Redis for self-host

## Delivery tiers

| Tier | Milestone |
| --- | --- |
| T1 Solo GA | Desktop workbench, gateway wave 1, local agents, core workflows |
| T2 Power | Docker Compose, full connectors, gateway MCP |
| T3 Full | Mobile, K8s Helm, full provider catalog, marketplace |

## License

TBD.
