# FOSS AI SDK Stack

Canonical inventory for Atomic-Workstation AI/ML dependencies. Kept in sync with root `package.json` via `pnpm foss:check` (U32, R96).

**Policy (R84):** Prefer OSI-approved open-source SDKs (MIT, Apache-2.0, BSD). Custom HTTP clients only when no maintained FOSS SDK exists.

---

## Gateway provider adapters

| Provider family | FOSS SDK | License | Unit |
| --- | --- | --- | --- |
| OpenAI | `@ai-sdk/openai`, `openai` | Apache-2.0 | U15 |
| Anthropic | `@ai-sdk/anthropic`, `@anthropic-ai/sdk` | Apache-2.0 | U15 |
| Google Gemini | `@ai-sdk/google`, `@google/generative-ai` | Apache-2.0 | U23 |
| Vertex AI | `@ai-sdk/google-vertex` | Apache-2.0 | U23 |
| Azure OpenAI | `@ai-sdk/azure` | Apache-2.0 | U23 |
| AWS Bedrock | `@ai-sdk/amazon-bedrock`, `@aws-sdk/client-bedrock-runtime` | Apache-2.0 | U23 |
| xAI | `@ai-sdk/xai` | Apache-2.0 | U15 |
| Perplexity | `@ai-sdk/perplexity` | Apache-2.0 | U15 |
| Cohere | `@ai-sdk/cohere` | Apache-2.0 | U15 |
| Groq | `@ai-sdk/groq` | Apache-2.0 | U15 |
| Mistral | `@ai-sdk/mistral` | Apache-2.0 | U15 |
| Together | `@ai-sdk/togetherai` | Apache-2.0 | U15 |
| Fireworks | `@ai-sdk/fireworks` | Apache-2.0 | U15 |
| DeepSeek | `@ai-sdk/deepseek` | Apache-2.0 | U15 |
| OpenRouter / local / compatible | `@ai-sdk/openai-compatible` | Apache-2.0 | U15, U23 |
| Ollama | `ollama`, `@ai-sdk/openai-compatible` | MIT | U15 |
| vLLM / LM Studio / LocalAI | `@ai-sdk/openai-compatible` | Apache-2.0 | U15 |
| HuggingFace | `@huggingface/inference` | Apache-2.0 | U23 |
| Replicate | `replicate` | MIT | U23 |
| SageMaker | `@aws-sdk/client-sagemaker-runtime` | Apache-2.0 | U23 |
| AI21 | `ai21` or `@ai-sdk/openai-compatible` | Apache-2.0 | U15 |

Enterprise providers without dedicated `@ai-sdk/*` packages use official OSS clients or `@ai-sdk/openai-compatible` with documented REST shims (U23).

---

## Agent orchestration

| Concern | FOSS SDK | License | Unit |
| --- | --- | --- | --- |
| Graph runtime | `@langchain/langgraph` | MIT | U6 |
| Core primitives | `@langchain/core` | MIT | U6 |
| MCP tool binding | `@langchain/mcp-adapters` | MIT | U6 |
| Streaming / tools | `ai` (Vercel AI SDK) | Apache-2.0 | U6 |
| React chat UI | `@ai-sdk/react` | Apache-2.0 | U14 |

All LLM calls route through Atomic Gateway (`http://localhost:4000/v1`), not direct provider APIs (R61).

---

## MCP protocol

| Concern | FOSS SDK | License | Unit |
| --- | --- | --- | --- |
| Client + server transports | `@modelcontextprotocol/sdk` | MIT | U5, U19 |
| Filesystem tools | `@modelcontextprotocol/server-filesystem` | MIT | U5 |
| GitHub tools | `@modelcontextprotocol/server-github` | MIT | U10 |
| Git tools | `@modelcontextprotocol/server-git` | MIT | U5 |
| Postgres tools | `@modelcontextprotocol/server-postgres` | MIT | U10 |
| OpenAPI → MCP | `openapi-mcp` (or custom generator) | MIT | U19 |

---

## Memory and embeddings

| Concern | FOSS SDK | License | Unit |
| --- | --- | --- | --- |
| Local embeddings | `@xenova/transformers` | Apache-2.0 | U9 |
| Vector index | `@lancedb/lancedb` | Apache-2.0 | U9 |
| Graph store | Postgres + `pgvector` via Drizzle ORM | PostgreSQL / Apache-2.0 | U9 |

---

## Gateway operations

| Concern | FOSS SDK | License | Unit |
| --- | --- | --- | --- |
| Token counting | `js-tiktoken` / `@dqbd/tiktoken` | MIT | U18 |
| Cache / queues | `ioredis`, `bullmq` | MIT | U22 |
| PII guardrails | `redact-pii` | MIT | U22 |
| Tracing | `@opentelemetry/sdk-node` | Apache-2.0 | U22 |
| Metrics | `prom-client` | Apache-2.0 | U22 |
| LLM trace UI (optional) | Langfuse (self-hosted) | MIT | U22 |
| Secrets | `keytar`, `@aws-sdk/client-secrets-manager`, `node-vault` | MIT / Apache-2.0 | U18 |

---

## Identity and connectors

| Concern | FOSS SDK | License | Unit |
| --- | --- | --- | --- |
| OIDC | `openid-client` | MIT | U25 |
| SAML | `@node-saml/node-saml` | MIT | U25 |
| CI IdP fixture | Keycloak | Apache-2.0 | U25 |
| GitHub REST | `@octokit/rest` | MIT | U10 |
| Supabase | `@supabase/supabase-js` | MIT | U10 |
| Slack | `@slack/web-api` | MIT | U10 |
| Google APIs | `googleapis` | Apache-2.0 | U10 |

---

## License governance (U32)

- **Allowed (runtime):** MIT, Apache-2.0, BSD, ISC, PostgreSQL License.
- **Blocked without allowlist:** GPL, AGPL, LGPL, SSPL.
- **CI:** `pnpm licenses list --json`, `@cyclonedx/cyclonedx-npm` SBOM, `pnpm foss:check` inventory drift.

---

## What we build ourselves (not FOSS replacements)

Atomic Gateway policy layer only — no third-party AI gateway products (no LiteLLM):

- Virtual keys, budgets, RPM/TPM
- Fallback chains, shadow A/B routing
- Bi-temporal knowledge graph
- Workbench UX and connector OAuth flows
- Team/org RBAC and audit log

These are first-party code in `apps/gateway`, `apps/orchestrator`, and `apps/desktop`.
