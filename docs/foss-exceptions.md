# FOSS REST Shim Exceptions

Providers without a maintained `@ai-sdk/*` or official OSS client require thin REST adapters inside `packages/gateway-providers/`. Each exception is documented here per R84/R96 and validated by `pnpm foss:check`.

**Policy:** Prefer adding an `@ai-sdk/openai-compatible` shim with a documented `baseURL` before writing bespoke HTTP. Custom REST only when the provider API is non-OpenAI-compatible.

---

## Approved REST shims (Tier 3)

| Provider | Shim approach | License of our code | Unit | Notes |
| --- | --- | --- | --- | --- |
| Snowflake Cortex | `@ai-sdk/openai-compatible` or custom REST in `snowflake/` | MIT (our code) | U23 | Snowflake API is proprietary; we only call it |
| Databricks Foundation Models | `@ai-sdk/openai-compatible` + Databricks serving endpoints | MIT | U23 | OpenAI-compatible serving URL when available |
| Nvidia NIM | `@ai-sdk/openai-compatible` | MIT | U23 | NIM exposes OpenAI-compatible surface |
| Watsonx (IBM) | Custom REST adapter | MIT | U23 | No maintained FOSS SDK |
| Aleph Alpha | Custom REST adapter | MIT | U23 | No `@ai-sdk` package |
| Baseten | `@ai-sdk/openai-compatible` or REST | MIT | U23 | Check endpoint compatibility |
| Modal | Custom REST via Modal inference API | MIT | U23 | No official JS SDK |
| Anyscale | `@ai-sdk/openai-compatible` | MIT | U23 | OpenAI-compatible gateway |
| Azure AI Inference (non-OpenAI models) | `@ai-sdk/azure` or REST fallback | MIT | U23 | Prefer Azure SDK |
| AI21 | `ai21` npm if license passes U32; else REST | Verify in U32 | U15 | Run `pnpm licenses` on add |

---

## Custom MCP servers (not gateway REST)

| Integration | Approach | Unit | Notes |
| --- | --- | --- | --- |
| Vercel | `packages/mcp-servers/vercel` | U10 | No official `@modelcontextprotocol/server-vercel` |
| Gmail | `packages/mcp-servers/gmail` + `googleapis` | U10 | OAuth via `openid-client` PKCE |
| Slack | `packages/mcp-servers/slack` + `@slack/web-api` | U10 | Bot/user token via vault |

---

## Explicitly excluded from default pipeline

| Package | Reason |
| --- | --- |
| `@anthropic-ai/sdk` moderation hooks | Proprietary API surface; use `redact-pii` guardrails instead (R93) |
| LangSmith SaaS SDK | Proprietary; use self-hosted Langfuse (R92/R28) |
| LiteLLM | Third-party gateway product (non-goal) |

---

## Adding a new exception

1. Open PR updating this file with provider, shim type, and license verification.
2. Add adapter under `packages/gateway-providers/<name>/`.
3. Add contract tests with nock fixtures.
4. Update `docs/foss-ai-stack.md` if a new FOSS dependency is introduced.
5. `pnpm foss:check` must pass.
