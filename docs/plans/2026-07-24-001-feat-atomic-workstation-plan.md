---
title: Atomic-Workstation Full Platform - Plan
type: feat
date: 2026-07-24
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: ce-plan-bootstrap
execution: code
---

# Atomic-Workstation Full Platform - Plan

## Goal Capsule

- **Objective:** Deliver the complete Atomic-Workstation platform end-to-end — desktop and mobile clients, self-hosted Docker and Kubernetes distributions, first-party Atomic Gateway with full provider catalog and personal spend controls, modern workbench, bi-temporal knowledge graph, full connector ecosystem, and all eight marketing reference workflows — with zero deferred product scope.
- **Target user:** Solo inventors and vibe coders — one person shipping side projects, not enterprise teams.
- **Authority hierarchy:** Product Contract is exhaustive; Planning Contract KTDs resolve architecture; unspecified implementation detail is left to the implementer within stated patterns.
- **Stop conditions:** Surface blockers only for physically impossible constraints (e.g., provider revokes API entirely); do not defer scope — resolve with documented assumptions instead.
- **Execution profile:** Ten delivery phases, ~35 implementation units. Contract-test gateway OpenAI surface first; FOSS SDK inventory (R96) enforced in CI from P0; E2E all eight workflows in CI before release.
- **Tail ownership:** Implementer owns commits, CI, installers, Helm charts, and mobile store submission artifacts.

---

## Product Contract

### Summary

Atomic-Workstation is a local-first, self-hostable AI workstation for **solo inventors and vibe coders** who operate entire workflows across code, terminals, browsers, email, databases, chat, and deployment tools in one environment — without team admin overhead. The complete platform includes: Tauri desktop + Tauri mobile apps, orchestrator sidecar, **Atomic Gateway** (first-party OpenAI-compatible AI/MCP gateway), bi-temporal project knowledge graph, reusable agent workflows with scheduling, personal spend controls, plugin marketplace, and connectors for GitHub, Vercel, Gmail, Supabase, Slack, and generic webhooks.

**Solo-first identity:** One local user per install. OS keychain / biometric unlock protects vault secrets. No org hierarchies, multi-user RBAC, or enterprise SSO — those are explicit non-goals (see Scope Boundaries).

**FOSS-first AI stack:** Wherever a mature open-source AI SDK exists, we use it instead of bespoke HTTP clients or proprietary middleware. Atomic Gateway owns routing, keys, budgets, and policy — provider adapters wrap FOSS SDKs; agents and UI compose FOSS orchestration and streaming libraries on top.

**Scope policy:** This plan has no "deferred for later" product features. Every capability listed in requirements ships in this program.

### Problem Frame

Builders lose flow switching between editors, terminals, browsers, dashboards, email, and scattered AI tabs. AI helps inside one surface while the workflow stays fragmented. Solo inventors and vibe coders juggle multiple side projects alone — they need one environment that remembers context, routes models cheaply, and runs cross-tool workflows without standing up team infrastructure. Atomic-Workstation unifies personal work orchestration: system-wide context, persistent memory, native gateway, and agents that execute real workflows locally with your keys.

### Requirements

**Platform & distribution**

- R1. Desktop app: macOS, Windows, Linux native installers via CI.
- R2. Mobile companion apps: iOS and Android via Tauri 2 mobile (project switch, agent chat, workflow triggers, approvals, notifications).
- R3. Self-host Docker Compose: orchestrator, gateway, Postgres, Redis, Ollama (optional).
- R4. Self-host Kubernetes: Helm chart with HA gateway, orchestrator, ingress, persistent volumes.
- R5. BYOK for all cloud providers; Ollama/vLLM for local inference; no training on user data.
- R6. All state in user-configurable data directory or mounted volumes.

**FOSS AI SDK mandate**

- R84. **FOSS-first policy:** All AI/ML integration code prefers OSI-approved open-source SDKs (MIT, Apache-2.0, BSD). Custom HTTP clients are allowed only when no maintained FOSS SDK exists for that provider.
- R85. **Gateway provider layer** wraps [Vercel AI SDK](https://github.com/vercel/ai) `@ai-sdk/*` provider packages (`@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/amazon-bedrock`, `@ai-sdk/azure`, `@ai-sdk/mistral`, `@ai-sdk/groq`, `@ai-sdk/cohere`, `@ai-sdk/deepseek`, `@ai-sdk/fireworks`, `@ai-sdk/togetherai`, `@ai-sdk/xai`, `@ai-sdk/perplexity`, `@ai-sdk/openai-compatible` for Ollama/vLLM/LM Studio/LocalAI) inside `ProviderAdapter` implementations — not reimplemented REST.
- R86. **Official provider clients** supplement AI SDK where needed: `openai`, `@anthropic-ai/sdk`, `@google/generative-ai`, `@aws-sdk/client-bedrock-runtime`, `@huggingface/inference`, `ollama` npm package.
- R87. **Agent orchestration** uses `@langchain/langgraph` + `@langchain/core`; MCP tool binding via `@langchain/mcp-adapters`.
- R88. **Agent + UI streaming** uses Vercel `ai` package (`streamText`, `generateText`, tool calling) pointed at Atomic Gateway as the model provider.
- R89. **MCP protocol** implemented with official `@modelcontextprotocol/sdk` (client + server transports). Community MCP servers from `@modelcontextprotocol/server-*` used where applicable (filesystem, git, GitHub, etc.).
- R90. **Local embeddings** via `@xenova/transformers` (Transformers.js) and/or Ollama embed API; vector store in LanceDB (Apache-2.0).
- R91. **Token counting** via `js-tiktoken` / `@dqbd/tiktoken`; cost tables maintained in `packages/gateway-core`.
- R92. **Observability** via OpenTelemetry JS SDK + `prom-client`; optional self-hosted [Langfuse](https://github.com/langfuse/langfuse) (FOSS) for LLM trace UI.
- R93. **Guardrails** integrate FOSS libraries where possible: `presidio`-style PII patterns, `redact-pii`, or `@anthropic-ai/sdk` moderation hooks — composed in guardrail plugin pipeline.
- R94. **Connector OAuth** via `openid-client` PKCE for Gmail, GitHub, Vercel, Slack, and MCP servers requiring user consent.
- R95. **Dependency governance:** `pnpm licenses` + SBOM (`@cyclonedx/cyclonedx-npm`) in CI; block copyleft licenses in runtime deps without explicit approval.
- R96. **FOSS SDK inventory** documented in `docs/foss-ai-stack.md` and kept in sync with `package.json` via CI check.

**Atomic Gateway — API surface**

- R7. OpenAI-compatible: `/v1/chat/completions`, `/v1/completions`, `/v1/embeddings`, `/v1/images/generations`, `/v1/audio/transcriptions`, `/v1/audio/speech`, `/v1/models`, SSE streaming.
- R8. Drop-in for OpenAI SDK clients via `baseURL` only.
- R9. `gateway.yaml` + runtime CRUD API; hot reload without restart.
- R10. Master key + virtual key Bearer auth; JWT for service accounts.
- R11. Pass-through endpoints for provider-native APIs.
- R12. Health, readiness, per-provider status.

**Atomic Gateway — providers (full catalog)**

- R13. Plugin `ProviderAdapter` interface: chat, embed, stream, image, audio, token count, cost estimate.
- R14. Ship adapters for all major providers in one release:

| Family | Providers |
| --- | --- |
| US labs | OpenAI, Anthropic, xAI, Perplexity, Cohere, AI21 |
| Google | Gemini API, Vertex AI |
| Microsoft | Azure OpenAI, Azure AI Inference |
| Amazon | Bedrock, SageMaker endpoints |
| Open aggregators | OpenRouter, Together, Fireworks, Anyscale, DeepSeek, Groq, Mistral |
| Local/self-host | Ollama, vLLM, LM Studio, llama.cpp server, LocalAI |
| Cloud ML | Replicate, HuggingFace Inference, Baseten, Modal |
| Enterprise | Snowflake Cortex, Databricks Foundation Models, Nvidia NIM |
| Other | Cloudflare Workers AI, GitHub Models, Aleph Alpha, Watsonx (IBM) |

- R15. Adapter marketplace: signed plugin bundles installable from workbench; community adapter submission flow with schema validation.
- R16. Model registry: alias → multiple deployments; tags for capability (vision, tools, json-mode).

**Atomic Gateway — routing & reliability**

- R17. Retries, fallback chains, budget-fallbacks, cooldowns, usage-based load balancing.
- R18. Context-window pre-check; content-policy fallbacks.
- R19. A/B traffic mirroring: shadow deployments receive duplicate requests; primary latency unaffected; shadow responses logged for comparison.
- R20. Prompt caching passthrough for providers that support it.

**Atomic Gateway — auth and personal controls**

- R21. Virtual keys: per-project model allowlists, personal budgets, RPM/TPM, metadata tags, expiry, rotation — for isolating side projects and capping spend.
- R22. Single-user local identity: one profile per install; optional app passcode or OS keychain/biometric unlock; no mandatory account server in desktop mode.
- R23. Personal audit log: immutable append-only record of agent runs, key usage, config changes, and destructive-action approvals.
- R24. Encrypted workspace backup/export: settings, workflow library, gateway config, and memory snapshots for machine migration.
- R25. Per-project agent permissions: agents may only use tools, connectors, and MCP servers enabled for the active project.

**Atomic Gateway — spend & observability**

- R26. Per-request logging: tokens, cost, latency, virtual key, project tag, cache hit, shadow flag.
- R27. Spend dashboards and export API; budget alert webhooks to Slack/email.
- R28. OpenTelemetry traces, Prometheus metrics, Langfuse/LangSmith-compatible export.
- R29. Secret manager backends: env, OS keychain, HashiCorp Vault, AWS Secrets Manager.

**Atomic Gateway — MCP**

- R30. MCP Gateway: stdio, Streamable HTTP, SSE transports.
- R31. Per-key/project MCP server and tool ACL.
- R32. REST `/mcp/tools/list`, `/mcp/tools/call`; OpenAPI spec import → MCP tools.
- R33. OAuth PKCE for MCP servers; static header and server variable support.

**Atomic Gateway — cache, guardrails, policies**

- R34. Exact-match and semantic response cache; Redis backend in production.
- R35. Guardrail plugin pipeline: PII redact, blocklist, regex, custom WASM/JS plugins.
- R36. Per-key/project/model default guardrails; policy bundles.

**Atomic Gateway — admin**

- R37. Admin UI: keys, models, deployments, fallbacks, shadow routes, MCP, guardrails, spend, logs, audit.
- R38. Embedded in workbench settings and available standalone at `:4000/admin`.

**Modern workbench (desktop)**

- R39. Dockable panels: editor, terminal, browser, agent, database, email, connectors, gateway, marketplace.
- R40. Command palette, shortcuts, layout presets, status bar with agent/gateway/sync state.
- R41. NeuroRainbow Cyberpunk design system across desktop, mobile, admin UI.

**Workspace & projects**

- R42. Multi-workspace, multi-project; scripts registry per workspace.
- R43. Instant context switch preserving terminal, browser, editor, agent state (<2s).
- R44. Project dashboard: git, deploys, memory, spend, scheduled workflows.

**Work surfaces**

- R45. Monaco editor: multi-tab, tree, diff, inline assist.
- R46. PTY terminals: multi-tab, persistent per project.
- R47. Playwright browser: multi-tab, screenshots, competitive compare mode.
- R48. Database panel: Supabase/Postgres/SQLite; SQL + NL query; charts.
- R49. Email panel: inbox preview, draft review, approval-gated send.

**Agents & workflows**

- R50. LangGraph runtime: tools, streaming, approval gates, checkpoints.
- R51. Workflow library: save, version, fork, parameterize, share via marketplace.
- R52. Scheduled/cron workflows and event triggers (git push, deploy fail, new email).
- R53. Destructive actions require approval; audit trail per run.

**Memory (bi-temporal knowledge graph)**

- R54. Bi-temporal graph: valid-time + transaction-time on facts and edges.
- R55. Hybrid retrieval: vector (LanceDB) + BM25 + graph traversal + tag filter.
- R56. Auto-ingest: repo files, git, connectors, workflow logs, gateway usage patterns.
- R57. Memory consolidation job: dedupe, decay stale facts, promote high-confidence edges.
- R58. Contradiction detection: `contradicts` edges with confidence decay.

**AI-native dev**

- R59. Inline explain/fix/refactor/test with full environment context.
- R60. Debug mode: terminal + browser console + stack trace → linked diffs.
- R61. All inference via Atomic Gateway.

**Connectors**

- R62. GitHub, R63. Vercel, R64. Gmail, R65. Supabase, R66. Slack.
- R67. Generic webhook ingress/egress for custom CI and deploy flows.
- R68. Credentials in vault; OAuth loopback; connector health in dashboard.

**Solo workspace & personal library**

- R69. Single local user profile; all projects owned by the installer; no multi-user accounts in desktop-first mode.
- R70. Personal workflow library: save, version, fork, parameterize, export/import locally; discover via marketplace.
- R71. Personal activity feed: unified timeline of agent runs, spend, deploys, and workflow outcomes for the solo builder.

**Reference workflows (all eight — complete acceptance bar)**

- R72. Bug report email → find code → fix → verify dev server → deploy → draft reply.
- R73. Analytics from plain English → query → chart → 30-day comparison follow-up.
- R74. Competitive site audit → dual screenshots → UX/copy/feature report.
- R75. Dev standup prep → git + Vercel + Gmail synthesis.
- R76. Weekly metrics digest → query metrics → HTML report with charts → draft email with attachment.
- R77. Failed deployment fix → Vercel logs → patch → verify → redeploy.
- R78. Update hero → edit → dev preview → deploy → confirm live URL.
- R79. Release changelog → git since tag → changelog → draft Slack/Gmail announcement.

**Marketplace & extensibility**

- R80. In-app marketplace for workflow templates, gateway adapter plugins, guardrail plugins, MCP server packs.
- R81. Signed packages; local install; offline mode uses cached packages only.

**Mobile**

- R82. iOS/Android: auth, project list, agent chat, workflow run, push approval requests, spend summary.
- R83. Biometric unlock for vault access on mobile.

### Actors

- A1. Solo inventor / vibe coder
- A2. Agent runtime
- A3. MCP servers (local + gateway)
- A4. Orchestrator
- A5. Atomic Gateway
- A6. Mobile user (same person, on phone)

### Key Flows

- F1. Project switch — R42, R43
- F2. Workflow execution — R50–R53
- F3. Memory ingest + consolidate — R54–R58
- F4. Gateway request pipeline — R7–R36
- F5. First-run setup + BYOK — R5, R22, R68
- F6. Scheduled weekly metrics — R52, R76
- F7. Shadow deployment comparison — R19
- F8. Mobile approval — R82, R53

### Acceptance Examples

- AE1. Bug report email to deployed fix (R72).
- AE2. Analytics query + 30-day follow-up (R73).
- AE3. Competitive site audit report (R74).
- AE4. Dev standup prep (R75).
- AE5. Weekly metrics HTML email digest (R76).
- AE6. Failed deployment fix (R77).
- AE7. Hero update and verify live (R78).
- AE8. Release changelog draft to Slack/Gmail (R79).
- AE9. Gateway provider fallback on 429 (R17).
- AE10. Budget fallback to cheaper model (R21).
- AE11. Shadow deployment logs comparison without affecting primary latency (R19).
- AE12. First-run onboarding: BYOK keys stored in vault; OS keychain unlock; default models selected (R22, R68).
- AE13. Mobile push approval unblocks deploy step (R82, F8).
- AE14. Bi-temporal memory answers "what did deploy target before last week?" (R54).

### Success Criteria

- AE1–AE14 pass in CI (mock external services where needed; real providers in staging).
- OpenAI Python/JS SDK works against gateway unchanged except `baseURL`.
- Every provider family in R14 has at least one adapter passing contract tests.
- Desktop + mobile + Docker + Helm all install from documented paths.
- Solo user completes first-run onboarding (AE12) and operates multiple personal projects with isolated virtual keys.
- No third-party AI gateway dependency; no credentials in logs.
- FOSS AI SDK inventory complete per R96; gateway adapters use `@ai-sdk/*` for all providers with published packages.

### Scope Boundaries

**In scope:** Everything in Requirements R1–R96.

**Outside this product's identity (explicit non-goals only)**

- Vendor-hosted multi-tenant SaaS where Atomic holds user API keys centrally.
- Training or fine-tuning models on user data.
- Replacing full IDE feature parity (debugger breakpoints, extension marketplace like VS Code).
- **Team / enterprise features:** multi-user workspaces, org hierarchies, role-based access control, OIDC/SAML SSO, SCIM provisioning, shared team projects, or admin consoles for managing other users.

There is no deferred product scope in this plan.

---

## Planning Contract

### Assumptions

- Postgres is the production datastore for gateway and orchestrator in self-host; SQLite is the default for single-user desktop mode.
- Mobile uses Tauri 2 mobile for maximum code reuse with desktop.
- Provider adapters ship in waves within the program but all R14 families complete before GA — no family left unimplemented.
- Vercel AI SDK `@ai-sdk/*` packages cover most cloud providers; gaps filled with official OSS clients per R86.
- **Solo-first:** no user-management server required for desktop; self-host Docker/K8s runs as single-tenant personal stack.

### Key Technical Decisions

- **KTD1.** Tauri 2 desktop + mobile; Rust for shell, keychain, sidecars.
- **KTD2.** TypeScript orchestrator (Fastify + WS).
- **KTD3.** Atomic Gateway as first-party `apps/gateway` — no LiteLLM or third-party gateway (session-settled: user-directed).
- **KTD4.** Provider plugins in `packages/gateway-providers/*` + marketplace signed bundles.
- **KTD5.** Dual MCP: local `mcp-hub` (workstation) + gateway MCP (external).
- **KTD6.** LangGraph workflows + cron scheduler in orchestrator.
- **KTD7.** Bi-temporal graph in Postgres + LanceDB vectors (not lightweight SQLite-only graph).
- **KTD8.** Redis for cache, rate limits, shadow request queue in production.
- **KTD9.** Local identity via OS keychain (`keytar`) + optional app passcode; connector OAuth via `openid-client` PKCE. No SSO/SAML/SCIM.
- **KTD10.** Helm chart for K8s; Compose for single-node.
- **KTD11. FOSS SDK composition over custom glue** (session-settled: user-directed — maximize maintained open-source AI SDKs; build only gateway policy/routing layer ourselves). Layering:
  - **Gateway adapters:** thin `ProviderAdapter` wrapper → `@ai-sdk/<provider>` → our router/budget/guardrails.
  - **Agents:** `@langchain/langgraph` graphs + `@langchain/mcp-adapters` + Vercel `ai` streaming to gateway.
  - **MCP:** `@modelcontextprotocol/sdk` for all transport code.
  - **Embeddings:** `@xenova/transformers` + LanceDB; no proprietary embedding APIs required for core memory.
  - **UI chat:** `@ai-sdk/react` `useChat` / custom transport wired to orchestrator WS.
  - Custom code is reserved for: virtual keys, budgets, shadow routing, bi-temporal graph, workbench UX, and connector OAuth — not reimplementing provider HTTP.

### High-Level Technical Design

```mermaid
flowchart TB
  subgraph Clients["Clients"]
    Desktop[Tauri Desktop]
    Mobile[Tauri Mobile]
  end

  subgraph Orchestrator["Orchestrator"]
    API[API + WS]
    Agent[LangGraph]
    Sched[Scheduler]
    LocalMCP[MCP Hub]
    Mem[Bi-temporal Memory]
    Activity[Personal Activity Feed]
    Market[Marketplace Client]
  end

  subgraph Gateway["Atomic Gateway"]
    Proxy[OpenAI API]
    Router[Router + Shadow]
    Auth[Keys + Vault]
    MCPgw[MCP Gateway]
    Cache[Cache]
    Adapters[Provider Plugins]
  end

  subgraph Data["Data Layer"]
    PG[(Postgres)]
    Redis[(Redis)]
    Lance[(LanceDB)]
  end

  Desktop --> API
  Mobile --> API
  API --> Agent
  Agent --> Gateway
  Agent --> LocalMCP
  Agent --> Mem
  Gateway --> Adapters
  Gateway --> PG
  Gateway --> Redis
  Mem --> PG
  Mem --> Lance
  API --> PG
```

### Phased Delivery

| Phase | Focus | Units |
| --- | --- | --- |
| P0 | Monorepo, orchestrator, projects, FOSS governance | U1–U3, U32 |
| P1 | Gateway core + router | U13, U17 |
| P2 | Provider catalog wave 1 (US labs + local) | U15 |
| P3 | Provider catalog wave 2 (cloud + extended) | U23 |
| P4 | Gateway personal controls (keys, audit, shadow) | U18, U24, U25 |
| P5 | MCP gateway, cache, guardrails, admin | U19, U22, U20 |
| P6 | Workbench + surfaces | U4, U14, U8, U21 |
| P7 | Memory graph + AI dev | U9, U16 |
| P8 | Connectors + personal activity feed | U10, U27 |
| P9 | Workflows + scheduler + all 8 AEs | U7, U12, U28 |
| P10 | Mobile, marketplace, K8s, ship | U29, U30, U11, U31 |

---

## Implementation Units

| U-ID | Title | Depends on |
| --- | --- | --- |
| U1 | Monorepo and Tauri desktop scaffold | — |
| U2 | Orchestrator sidecar and API | U1 |
| U3 | Workspace, project, and scripts registry | U2 |
| U4 | Editor and terminal panels | U3, U14 |
| U5 | Local MCP hub and credential vault | U2 |
| U6 | Agent runtime via Atomic Gateway | U5, U13, U19 |
| U7 | Workflow engine, library, and scheduler | U6 |
| U8 | Browser panel and Playwright MCP | U5 |
| U9 | Bi-temporal knowledge graph and memory | U3 |
| U10 | Full connector ecosystem | U5, U9, U19 |
| U11 | Docker Compose self-host | U2, U13 |
| U12 | All eight reference workflows | U7, U8, U10, U21, U28 |
| U13 | Atomic Gateway core proxy | U2 |
| U14 | Modern workbench shell UI | U3 |
| U15 | Provider adapters wave 1 | U13 |
| U16 | AI-native dev and debug assist | U4, U6, U9 |
| U17 | Router, fallbacks, shadow mirroring | U13, U15 |
| U18 | Virtual keys, budgets, spend, alerts | U13 |
| U19 | MCP Gateway | U13 |
| U20 | Gateway admin UI | U13, U18 |
| U21 | Database and email panels | U10 |
| U22 | Cache, guardrails, observability | U13 |
| U23 | Provider adapters wave 2 (full R14 catalog) | U15 |
| U24 | A/B shadow traffic mirroring | U17 |
| U25 | Local auth, vault, audit log, and backup | U13, U18 |
| U27 | Generic webhook connector | U10 |
| U28 | Cron and event workflow triggers | U7 |
| U29 | Plugin and template marketplace | U7, U15, U22 |
| U30 | Tauri mobile apps | U3, U6, U14 |
| U31 | Kubernetes Helm chart and HA deploy | U11 |
| U32 | FOSS dependency governance and SDK inventory | U1 |

### U1. Monorepo and Tauri desktop scaffold

- **Goal:** pnpm monorepo; Tauri 2 desktop opens workbench shell.
- **Requirements:** R1, R6, R41
- **Files:** `package.json`, `pnpm-workspace.yaml`, `apps/desktop/`, `packages/shared/`, `packages/ui/`
- **Approach:** Tauri 2 + React + Vite. Design tokens in `packages/ui`. Sidecar slots for orchestrator and gateway. Pin FOSS AI deps in root `package.json` catalog. CI builds Linux artifact.
- **Patterns to follow:** `pnpm` workspace catalog for shared `@ai-sdk/*`, `@langchain/*`, `@modelcontextprotocol/sdk` versions.
- **Test scenarios:** `pnpm -r build` passes; app launches headless in CI.
- **Verification:** Desktop CI build green.

### U2. Orchestrator sidecar and API

- **Goal:** Fastify + WebSocket API; Postgres/SQLite data layer abstraction.
- **Requirements:** R6
- **Files:** `apps/orchestrator/src/server.ts`, `packages/shared/src/api-types.ts`
- **Approach:** Health, graceful shutdown, data dir bootstrap. Tauri spawns on start.
- **Test scenarios:** `/health` 200; WS connects; crash restart within 10s.
- **Verification:** Integration test spawns orchestrator.

### U3. Workspace, project, and scripts registry

- **Goal:** CRUD workspaces/projects; script definitions; state persistence; personal activity feed.
- **Requirements:** R42, R43, R44, R69, R71
- **Files:** `apps/orchestrator/src/projects/`, `apps/desktop/src/features/projects/`, `apps/desktop/src/features/activity/`
- **Approach:** Postgres/SQLite schema; panel state JSON per project; scripts as named shell/npm commands in workspace manifest. Activity feed aggregates agent runs, spend, deploys from audit log + workflow history.
- **Test scenarios:** Two projects switch without state loss; dashboard shows git branch.
- **Verification:** API tests + Playwright switch smoke.

### U13. Atomic Gateway core proxy

- **Goal:** Full OpenAI-compatible API surface including images and audio.
- **Requirements:** R7–R12
- **Files:** `apps/gateway/`, `packages/gateway-core/`
- **Approach:** Fastify on `:4000`; all R7 endpoints; hot reload config; pass-through mode. SSE streaming delegates to `@ai-sdk/*` provider `streamText` internally where applicable.
- **Test scenarios:** OpenAI SDK chat + embed + image; 401 without key.
- **Verification:** Contract test suite.

### U15. Provider adapters wave 1

- **Goal:** US labs + local inference adapters via FOSS SDKs.
- **Requirements:** R13, R14 (partial), R85, R86
- **Files:** `packages/gateway-providers/*`, `packages/gateway-core/src/ai-sdk-bridge.ts`
- **Approach:** Each adapter is a thin wrapper: `ProviderAdapter` → `@ai-sdk/<provider>` package. Mapping table:

| Provider | FOSS SDK package |
| --- | --- |
| OpenAI | `@ai-sdk/openai` |
| Anthropic | `@ai-sdk/anthropic` |
| xAI | `@ai-sdk/xai` |
| Perplexity | `@ai-sdk/perplexity` |
| Cohere | `@ai-sdk/cohere` |
| Groq | `@ai-sdk/groq` |
| Mistral | `@ai-sdk/mistral` |
| Together | `@ai-sdk/togetherai` |
| Fireworks | `@ai-sdk/fireworks` |
| DeepSeek | `@ai-sdk/deepseek` |
| OpenRouter | `@ai-sdk/openai-compatible` + custom base URL |
| Ollama / vLLM / LM Studio / LocalAI | `@ai-sdk/openai-compatible` + `ollama` client for model list |
| AI21 | `ai21` SDK or `@ai-sdk/openai-compatible` fallback |

- **Test scenarios:** Each adapter passes nock fixtures; streaming via AI SDK `streamText` works.
- **Verification:** `pnpm --filter gateway-providers test`.

### U23. Provider adapters wave 2

- **Goal:** Complete R14 catalog using FOSS SDKs.
- **Requirements:** R14, R15, R85, R86
- **Files:** `packages/gateway-providers/google`, `vertex`, `azure-openai`, `bedrock`, etc., `packages/gateway-marketplace/`
- **Approach:** Wrap remaining providers with FOSS SDKs:

| Provider | FOSS SDK package |
| --- | --- |
| Google Gemini | `@ai-sdk/google` |
| Vertex AI | `@ai-sdk/google-vertex` |
| Azure OpenAI | `@ai-sdk/azure` |
| AWS Bedrock | `@ai-sdk/amazon-bedrock` |
| SageMaker | `@aws-sdk/client-sagemaker-runtime` |
| HuggingFace | `@huggingface/inference` |
| Replicate | `replicate` npm (MIT) |
| Cloudflare Workers AI | `@ai-sdk/openai-compatible` |
| GitHub Models | `@ai-sdk/openai-compatible` |
| Snowflake / Databricks / Watsonx / Nvidia NIM / Aleph Alpha / Modal / Baseten | Official OSS client if exists; else `@ai-sdk/openai-compatible` + documented REST shim |

Marketplace adapter plugins must declare their FOSS SDK dependency in manifest.
- **Test scenarios:** Contract test per family; marketplace bundle install loads new adapter.
- **Verification:** Full provider matrix CI job.

### U17. Router, fallbacks, and shadow mirroring

- **Goal:** Production routing with reliability and A/B shadow support.
- **Requirements:** R17, R18, R19, R20
- **Files:** `apps/gateway/src/router/`
- **Dependencies:** U13, U15
- **Approach:** Fallback chains, budget-fallbacks, cooldowns, LB. Shadow: async duplicate to shadow deployment; log diff metadata. Prompt cache headers forwarded.
- **Test scenarios:** Covers AE9, AE11; context pre-check rejects overflow.
- **Verification:** Router integration tests.

### U24. A/B shadow traffic mirroring

- **Goal:** Shadow route configuration and comparison UI.
- **Requirements:** R19
- **Files:** `apps/gateway/src/shadow/`, admin UI shadow page
- **Dependencies:** U17
- **Approach:** Config `shadow_routes: { primary: gpt-4o, shadow: gpt-4o-mini, sample_rate: 0.1 }`. Queue shadow calls in Redis; never block primary response.
- **Test scenarios:** Covers AE11: primary p99 unchanged with shadow enabled.
- **Verification:** Load test comparing latency with/without shadow.

### U18. Virtual keys, budgets, spend, alerts

- **Goal:** Full cost control and accounting.
- **Requirements:** R21, R26, R27, R28, R29
- **Files:** `apps/gateway/src/auth/`, `apps/gateway/src/spend/`
- **Approach:** Token counting via `js-tiktoken`. Spend logging exports to OTEL + optional Langfuse self-host. Secret backends: `keytar` (keychain), `@aws-sdk/client-secrets-manager`, `node-vault`.
- **Test scenarios:** Covers AE10; budget alert webhook fires.
- **Verification:** Auth + spend integration tests.

### U25. Local auth, vault, audit log, and backup

- **Goal:** Solo-user identity, secret protection, personal audit trail, and machine migration.
- **Requirements:** R22, R23, R24, R25
- **Files:** `apps/orchestrator/src/auth/`, `apps/gateway/src/audit/`, `packages/vault/`
- **Dependencies:** U13, U18
- **Approach:** OS keychain via `keytar`; optional app passcode and biometric unlock (mobile/desktop). Append-only audit log for agent runs, config changes, and approvals. Encrypted `.atomic-backup` export/import for settings, workflows, and gateway config. Per-project tool/connector ACL enforced at agent runtime.
- **Test scenarios:** Covers AE12: first-run stores BYOK in vault; unlock required before connector OAuth; audit entry written on destructive approval.
- **Verification:** Vault + audit + backup round-trip tests.

### U19. MCP Gateway

- **Goal:** Full MCP server management and tool exposure.
- **Requirements:** R30–R33
- **Files:** `apps/gateway/src/mcp/`
- **Approach:** Built on `@modelcontextprotocol/sdk` (`Client`, `StdioClientTransport`, `StreamableHTTPClientTransport`). OpenAPI→MCP via FOSS `openapi-mcp` or custom generator. OAuth via `openid-client` PKCE.
- **Test scenarios:** GitHub MCP tools callable via REST; OAuth MCP connects.
- **Verification:** MCP integration tests.

### U22. Cache, guardrails, observability

- **Goal:** Production safety and monitoring.
- **Requirements:** R34–R36, R28
- **Files:** `apps/gateway/src/cache/`, `guardrails/`, `observability/`
- **Approach:** Redis cache via `ioredis` + `bullmq` for shadow queue. Guardrails: `redact-pii` + custom plugins. OTEL via `@opentelemetry/sdk-node`; metrics via `prom-client`; Langfuse export via `langfuse` npm client.
- **Test scenarios:** Cache hit logged; PII guardrail blocks; metrics scrape works.
- **Verification:** Unit + scrape tests.

### U20. Gateway admin UI

- **Goal:** Complete admin dashboard.
- **Requirements:** R37, R38
- **Files:** `apps/gateway/src/admin-ui/`
- **Approach:** All admin surfaces including shadow routes, virtual keys, spend dashboards, marketplace uploads. No team/user-management screens.
- **Test scenarios:** Full config cycle without YAML edit.
- **Verification:** Playwright admin suite.

### U14. Modern workbench shell UI

- **Goal:** Unified dockable environment.
- **Requirements:** R39–R41
- **Files:** `apps/desktop/src/workbench/`
- **Approach:** All panels dockable; command palette; presets; cyberpunk theme.
- **Test scenarios:** Layout persists; palette switches project.
- **Verification:** Visual regression smoke.

### U4. Editor and terminal panels

- **Goal:** Code editing and PTY terminals.
- **Requirements:** R45, R46
- **Files:** `apps/desktop/src/panels/editor/`, `terminal/`
- **Approach:** Monaco + node-pty over WS.
- **Test scenarios:** Save round-trip; PTY echo; multi-tab persist on switch.
- **Verification:** API + smoke tests.

### U5. Local MCP hub and vault

- **Goal:** Workstation-native tools and secrets.
- **Requirements:** R68
- **Files:** `packages/mcp-hub/`, vault module
- **Approach:** Filesystem, git, shell via `@modelcontextprotocol/server-filesystem`, `server-github`, etc. Local hub built on `@modelcontextprotocol/sdk`. Vault: `keytar` + encrypted Postgres.
- **Test scenarios:** Secret never in logs; MCP restart recovery.
- **Verification:** Vault round-trip tests.

### U6. Agent runtime

- **Goal:** LangGraph agent via gateway only; FOSS orchestration stack.
- **Requirements:** R50, R53, R61, R87, R88
- **Files:** `apps/orchestrator/src/agent/`
- **Approach:** `@langchain/langgraph` StateGraph + `interrupt()` for approvals. Tools from `@langchain/mcp-adapters` `MultiServerMCPClient` (local + gateway MCP). LLM via `ChatOpenAI` pointed at `http://localhost:4000/v1` or Vercel `ai` `streamText` with custom gateway provider. Desktop agent chat uses `@ai-sdk/react` streaming transport.
- **Test scenarios:** Tool loop completes; approval blocks deploy.
- **Verification:** Agent integration tests.

### U7. Workflow engine, library, and scheduler

- **Goal:** Reusable workflows with cron and events.
- **Requirements:** R51, R52
- **Files:** `packages/workflows/`, `apps/orchestrator/src/scheduler/`
- **Approach:** Template store; cron via `node-cron`; event bus for deploy-fail, new-email hooks.
- **Test scenarios:** Cron fires workflow; event trigger on mock webhook.
- **Verification:** Scheduler integration tests.

### U28. Cron and event workflow triggers

- **Goal:** Scheduled weekly metrics and event-driven runs.
- **Requirements:** R52, R76
- **Files:** `apps/orchestrator/src/scheduler/triggers.ts`
- **Dependencies:** U7
- **Approach:** Weekly metrics workflow registered as default cron Sunday 6am user TZ.
- **Test scenarios:** Covers AE5 schedule fires in accelerated test clock.
- **Verification:** Time-mocked scheduler test.

### U8. Browser panel

- **Goal:** Playwright browser for agents and audits.
- **Requirements:** R47
- **Files:** `apps/desktop/src/panels/browser/`
- **Test scenarios:** Screenshot; dual-tab competitive compare.
- **Verification:** Browser MCP integration test.

### U9. Bi-temporal knowledge graph

- **Goal:** Full memory subsystem with time travel.
- **Requirements:** R54–R58
- **Files:** `packages/memory/`
- **Approach:** Postgres graph via Drizzle ORM + `pgvector`. Embeddings via `@xenova/transformers` (`Xenova/gte-small` ONNX) with Ollama embed fallback. LanceDB for vector index. Consolidation cron. Contradiction edges.
- **Test scenarios:** Covers AE14; ingest + query "deploy target last Tuesday".
- **Verification:** Graph traversal unit tests.

### U10. Full connector ecosystem

- **Goal:** GitHub, Vercel, Gmail, Supabase, Slack.
- **Requirements:** R62–R66, R89
- **Files:** `apps/orchestrator/src/connectors/`, `packages/mcp-hub/src/servers/`
- **Approach:** Prefer FOSS MCP servers over bespoke REST clients:

| Connector | FOSS integration |
| --- | --- |
| GitHub | `@modelcontextprotocol/server-github` + `@octokit/rest` |
| Vercel | `@modelcontextprotocol/server-vercel` or OpenAPI MCP shim |
| Gmail | `@modelcontextprotocol/server-gmail` (community) or Google APIs via `googleapis` |
| Supabase | `@supabase/supabase-js` + Postgres MCP via `server-postgres` |
| Slack | `@modelcontextprotocol/server-slack` or `@slack/web-api` |

Thin OAuth loopback wrappers in orchestrator; credentials from vault (U5). Connector health surfaced on project dashboard (R44).
- **Test scenarios:** Each connector lists resources; OAuth refresh succeeds; health badge green after connect.
- **Verification:** Connector integration tests with mocked OAuth + MCP tool smoke.

### U32. FOSS dependency governance and SDK inventory

- **Goal:** Enforce FOSS-first AI stack (R84–R96); keep `docs/foss-ai-stack.md` in sync with runtime deps.
- **Requirements:** R84, R95, R96
- **Files:** `docs/foss-ai-stack.md`, `scripts/foss-inventory-check.ts`, `.github/workflows/licenses.yml`
- **Dependencies:** U1
- **Approach:**
  - Root `package.json` pnpm catalog pins all `@ai-sdk/*`, `@langchain/*`, `@modelcontextprotocol/*` versions.
  - CI runs `pnpm licenses list --json` and `@cyclonedx/cyclonedx-npm` SBOM export.
  - Block GPL/AGPL/LGPL in production `dependencies` without allowlist entry in `foss-allowlist.json`.
  - `foss-inventory-check.ts` diffs `package.json` AI-related deps against `docs/foss-ai-stack.md` table; fails PR on drift.
  - Gateway adapter PRs must update inventory when adding a provider SDK.
- **Test scenarios:** Drifted inventory fails CI; copyleft dep without allowlist fails; SBOM artifact uploaded per release.
- **Verification:** `pnpm foss:check` green in CI.

### U27. Generic webhook connector

- **Goal:** Custom CI/deploy integrations.
- **Requirements:** R67
- **Files:** `apps/orchestrator/src/connectors/webhook/`
- **Approach:** Inbound signed webhooks trigger workflows; outbound POST on workflow steps.
- **Test scenarios:** Inbound webhook starts deploy-fix workflow.
- **Verification:** Webhook signature tests.

### U21. Database and email panels

- **Goal:** Query UI and email preview.
- **Requirements:** R48, R49
- **Files:** `apps/desktop/src/panels/database/`, `email/`
- **Test scenarios:** Chart renders; email draft approval UI.
- **Verification:** Component tests.

### U16. AI-native dev and debug assist

- **Goal:** Full-context inline assist.
- **Requirements:** R59, R60
- **Files:** `apps/desktop/src/panels/editor/InlineAssist.tsx`, `DebugAssist.tsx`
- **Test scenarios:** Debug proposes fix from stack trace fixture.
- **Verification:** Context builder tests.

### U12. All eight reference workflows

- **Goal:** AE1–AE8 complete in CI.
- **Requirements:** R72–R79
- **Files:** `packages/workflows/src/templates/*`, `examples/sample-next-app/`
- **Dependencies:** U7, U8, U10, U21, U28
- **Test scenarios:**
  - AE1: email → fix → deploy → draft reply
  - AE2: NL query → chart → 30-day compare
  - AE3: competitive audit markdown + screenshots
  - AE4: standup synthesis
  - AE5: weekly HTML metrics email draft
  - AE6: failed deploy fix
  - AE7: hero update live
  - AE8: changelog + Slack/Gmail draft
- **Verification:** `pnpm --filter desktop test:e2e --workflows=all`

### U29. Plugin and template marketplace

- **Goal:** In-app distribution for adapters, workflows, guardrails.
- **Requirements:** R80, R81, R15
- **Files:** `apps/marketplace/`, `apps/desktop/src/features/marketplace/`
- **Approach:** Local registry + optional remote catalog URL; ed25519 signed packages; offline uses cache.
- **Test scenarios:** Install workflow template; appears in library.
- **Verification:** Marketplace install e2e.

### U30. Tauri mobile apps

- **Goal:** iOS and Android companion.
- **Requirements:** R82, R83
- **Files:** `apps/mobile/`
- **Approach:** Tauri 2 mobile; shared `@atomic/ui`; push notifications for approvals; biometric vault unlock.
- **Test scenarios:** Covers AE13: push approval resumes workflow.
- **Verification:** Mobile simulator CI + manual device checklist.

### U11. Docker Compose self-host

- **Goal:** Single-command full stack.
- **Requirements:** R3
- **Files:** `deploy/docker-compose.yml`, Dockerfiles
- **Approach:** Services: postgres, redis, gateway, orchestrator, ollama (profile). Volumes for data. `.env.example`.
- **Test scenarios:** `docker compose up --wait` healthy; AE9 via curl.
- **Verification:** Compose CI job.

### U31. Kubernetes Helm chart

- **Goal:** Production HA deployment.
- **Requirements:** R4
- **Files:** `deploy/helm/atomic-workstation/`
- **Approach:** Helm chart with gateway HPA, ingress, secrets, Postgres/Redis subcharts optional.
- **Test scenarios:** `helm install` on kind cluster; pods ready.
- **Verification:** Helm lint + kind integration in CI.

---

## Verification Contract

| Gate | Command | When |
| --- | --- | --- |
| Unit tests | `pnpm -r test` | Every commit |
| Gateway contracts | `pnpm --filter gateway test:contract` | PR |
| All providers | `pnpm --filter gateway-providers test:matrix` | PR |
| Gateway integration | `pnpm --filter gateway test:integration` | PR |
| Orchestrator integration | `pnpm --filter orchestrator test:integration` | PR |
| Vault + audit | `pnpm --filter orchestrator test:vault` | PR |
| Workflow e2e | `pnpm --filter desktop test:e2e --workflows=all` | PR |
| Mobile smoke | `pnpm --filter mobile test:smoke` | PR |
| Docker Compose | `docker compose up --wait` | PR |
| Helm kind | `helm test atomic-workstation` | PR nightly |
| Security | secret scan + vault audit + no creds in logs | PR |
| FOSS inventory | `pnpm foss:check` | PR |
| License/SBOM | `pnpm licenses:ci` + CycloneDX artifact | PR + release |

---

## Definition of Done

**Global — nothing deferred**

- R1–R96 implemented and traced to units.
- AE1–AE14 pass (CI or documented staging for provider-specific cases).
- R84–R96 FOSS mandate satisfied: `docs/foss-ai-stack.md` current; `pnpm foss:check` green; no unapproved copyleft runtime deps.
- All R14 provider families have shipping adapters using FOSS SDKs per R85–R86.
- Desktop, mobile, Docker, Helm install paths documented and CI-verified.
- Atomic Gateway: full API, all providers, personal keys/budgets, shadow, MCP, cache, guardrails, admin, marketplace.
- Eight reference workflows runnable end-to-end.
- Bi-temporal memory operational.
- Solo local auth + vault + personal audit log operational (AE12).
- No LiteLLM or third-party gateway code.
- No team RBAC, SSO, or multi-user features shipped.
- GA release artifacts published.

**Per-phase exit**

| Phase | Exit criterion |
| --- | --- |
| P0–P1 | Gateway accepts OpenAI SDK chat; FOSS inventory + license CI green |
| P2–P3 | Full R14 provider matrix green |
| P4 | AE9, AE10, AE11, AE12 pass |
| P5 | Admin UI complete; MCP gateway live |
| P6–P7 | Workbench + memory + dev assist live |
| P8 | All connectors + personal activity feed |
| P9 | AE1–AE8 e2e green |
| P10 | Mobile AE13; Helm deploy; marketplace install |

---

## Appendix

### Provider adapter checklist (all in scope)

Every row requires a shipping adapter package with contract tests before GA:

OpenAI, Anthropic, xAI, Perplexity, Cohere, AI21, Google Gemini, Vertex AI, Azure OpenAI, Azure AI Inference, AWS Bedrock, SageMaker, OpenRouter, Together, Fireworks, Anyscale, DeepSeek, Groq, Mistral, Ollama, vLLM, LM Studio, LocalAI, Replicate, HuggingFace Inference, Baseten, Modal, Snowflake Cortex, Databricks FM, Nvidia NIM, Cloudflare Workers AI, GitHub Models, Aleph Alpha, Watsonx.

### Eight workflows traceability

| Workflow | Req | Template file |
| --- | --- | --- |
| Bug email → fix | R72 | `bug-email-to-fix.ts` |
| Analytics NL query | R73 | `analytics-query.ts` |
| Competitive audit | R74 | `competitive-audit.ts` |
| Standup prep | R75 | `standup-prep.ts` |
| Weekly metrics digest | R76 | `weekly-metrics-digest.ts` |
| Failed deploy fix | R77 | `fix-deployment.ts` |
| Hero update live | R78 | `update-hero.ts` |
| Release changelog | R79 | `release-changelog.ts` |

### FOSS AI SDK stack (canonical inventory)

Maintained in `docs/foss-ai-stack.md` and enforced by U32. Summary by layer:

| Layer | FOSS packages | Owned by |
| --- | --- | --- |
| Gateway providers | `@ai-sdk/*`, `openai`, `@anthropic-ai/sdk`, `@google/generative-ai`, `@aws-sdk/client-bedrock-runtime`, `@huggingface/inference`, `ollama`, `replicate` | U15, U23 |
| Gateway policy | Custom router, keys, budgets, shadow, guardrails | U13, U17, U18, U22 |
| Agent runtime | `@langchain/langgraph`, `@langchain/core`, `@langchain/mcp-adapters` | U6 |
| UI streaming | `ai`, `@ai-sdk/react` | U6, U14 |
| MCP transport | `@modelcontextprotocol/sdk`, `@modelcontextprotocol/server-*` | U5, U10, U19 |
| Embeddings / vectors | `@xenova/transformers`, LanceDB | U9 |
| Token counting | `js-tiktoken` / `@dqbd/tiktoken` | U18 |
| Observability | `@opentelemetry/sdk-node`, `prom-client`, Langfuse (self-host) | U22 |
| Guardrails | `redact-pii`, custom plugins | U22 |
| Connector OAuth | `openid-client` PKCE | U10, U19, U25 |
| Local vault | `keytar` | U5, U25 |
| License governance | `@cyclonedx/cyclonedx-npm`, `pnpm licenses` | U32 |

**Principle:** Atomic Gateway owns routing, policy, and keys — not provider HTTP. Adapters are thin wrappers over maintained FOSS SDKs (KTD11).

### Outside identity (unchanged non-goals)

Hosted multi-tenant SaaS, user-data model training, full VS Code parity, **multi-user workspaces, org admin, RBAC, OIDC/SAML SSO, SCIM** — these are not product goals, not deferred features.
