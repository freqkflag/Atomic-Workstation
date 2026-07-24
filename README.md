# Atomic-Workstation

A local-first AI workstation for **solo inventors and vibe coders** — one environment for code, terminals, browsers, agents, email, databases, and deploys, with a first-party **Atomic Gateway** (OpenAI-compatible, FOSS SDK adapters) and persistent bi-temporal memory.

## Status

**P0–P10 implemented** on branch `cursor/p1-p10-platform-a2ee`:

| Phase | Units | Highlights |
| --- | --- | --- |
| P1 | U13 | Atomic Gateway Fastify server (`:4000`), model registry, OpenAI-compatible API |
| P2 | U15, U17 | Wave 1 provider adapters, router/fallbacks/cooldowns |
| P3 | U23 | Wave 2 provider catalog (full R14 matrix) |
| P4 | U18, U25 | Virtual keys, spend logging, audit log, encrypted backup export |
| P5 | U6a, U14 | Agent runtime (local MCP), dockable workbench shell |
| P6 | U4, U8, U9, U16 | Editor/terminal/browser panels, bi-temporal memory package |
| P7 | U19, U22, U20, U6b | MCP gateway routes, cache/guardrails/metrics, admin UI |
| P8 | U10, U21, U27 | Connectors, DB/email panels, signed webhooks |
| P9 | U7, U28, U12 | Workflow library (8 AEs), scheduler triggers |
| P10 | U24, U29, U30, U11, U31 | Shadow queue, marketplace, mobile smoke, Docker Compose, Helm chart |

## Quick start

```bash
pnpm install
pnpm foss:check
pnpm -r build
pnpm -r test

# Terminal 1 — orchestrator
pnpm --filter @atomic/orchestrator dev

# Terminal 2 — Atomic Gateway
pnpm --filter @atomic/gateway dev

# Terminal 3 — desktop UI (Vite)
pnpm --filter @atomic/desktop dev
```

Data defaults to `./data` (PGlite). Set `ATOMIC_VAULT_UNLOCKED=true` for local vault writes. Gateway auth uses `ATOMIC_GATEWAY_MASTER_KEY` (default `dev-master`).

## Packages

| Package | Role |
| --- | --- |
| `apps/desktop` | Tauri 2 + React workbench shell |
| `apps/gateway` | Atomic Gateway OpenAI-compatible API |
| `apps/orchestrator` | Fastify API + WebSocket + agent/workflows |
| `apps/mobile` | Tauri mobile companion scaffold |
| `packages/gateway-core` | Model registry, router, virtual keys |
| `packages/gateway-providers` | FOSS `@ai-sdk/*` provider adapters |
| `packages/memory` | Bi-temporal knowledge graph + BM25 |
| `packages/workflows` | Workflow library + export/import |
| `packages/marketplace` | Signed plugin/template registry |
| `packages/db` | PGlite/Postgres via Drizzle |
| `packages/vault` | Encrypted secrets + backup export |
| `packages/mcp-hub` | Local MCP client hub |
| `packages/ui` | NeuroRainbow design tokens |
| `packages/shared` | API types (Zod) |

| Document | Purpose |
| --- | --- |
| [Full platform plan](docs/plans/2026-07-24-001-feat-atomic-workstation-plan.md) | Requirements R1–R96, 31 implementation units, delivery tiers T1–T3 |
| [FOSS AI stack](docs/foss-ai-stack.md) | Canonical SDK inventory |
| [FOSS exceptions](docs/foss-exceptions.md) | REST shims and custom MCP servers |

## Self-host

```bash
docker compose -f deploy/docker-compose.yml up --wait
helm lint deploy/helm/atomic-workstation
```

## Principles

- **Solo-first** — one local user; no team RBAC or enterprise SSO
- **FOSS-first** — `@ai-sdk/*`, LangGraph, MCP SDK; no LiteLLM
- **BYOK** — your API keys, local or self-hosted inference
- **Desktop-first** — Tauri 2; PGlite + LanceDB on desktop; Postgres + Redis for self-host

## License

TBD.
