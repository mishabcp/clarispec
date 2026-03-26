# AI Provider Strategy: Groq + Gemini with Fallback

## 1. What we will do

| Step | Action |
|------|--------|
| **1** | Add an **AI provider abstraction** so the app calls a single interface (`generateText(systemPrompt, userPrompt, options)`) instead of Gemini directly. |
| **2** | Implement **Groq** as the **primary** provider (one model for chat/analyze, one for document generation). |
| **3** | Implement **Gemini** as the **first fallback** when Groq returns `429 Too Many Requests` (or other transient errors). |
| **4** | Optionally use a **second Groq model** as fallback when the primary Groq model hits limits (different RPM/TPM/TPD). |
| **5** | Use response headers (`x-ratelimit-remaining-*`) to optionally log or warn before hitting limits. |

When one model’s limit is hit we **do use backup models**: first try another Groq model (if configured), then try Gemini. So the order is: **Primary Groq → Backup Groq (optional) → Gemini**.

---

## 2. Ideal model list for Clarispec

Clarispec needs:

- **Chat & analyze:** short, frequent requests; response ~500–2000 tokens; must support system + user prompt and return plain text (often JSON).
- **Document generation:** fewer requests, but **long output** (up to ~8K tokens per doc); multiple docs per project; needs stability and consistency.

### Recommended primary + fallback

| Use case | Primary (Groq) | Why | Fallback 1 (Groq) | Fallback 2 (Gemini) |
|----------|----------------|-----|-------------------|----------------------|
| **Chat / Analyze** | `meta-llama/llama-4-scout-17b-16e-instruct` | 30K TPM, 500K TPD, strong instruction following | `llama-3.1-8b-instant` (14.4K RPD, 500K TPD) | Gemini 2.5 Flash or 3.1 Flash Lite |
| **Document generation** | `meta-llama/llama-4-scout-17b-16e-instruct` | Same model, 30K TPM allows several 8K docs per minute | `llama-3.3-70b-versatile` (12K TPM) or `llama-3.1-8b-instant` | Gemini 2.5 Flash (250K TPM) |

**Alternative (simpler):** Use **one** Groq model for everything, e.g. `llama-4-scout-17b-16e-instruct` (30K TPM, 500K TPD), with Gemini as the only fallback when Groq returns 429.

### Full model reference (Groq free tier)

| Model ID | RPM | RPD | TPM | TPD | Best for |
|----------|-----|-----|-----|-----|----------|
| **meta-llama/llama-4-scout-17b-16e-instruct** | 30 | 1K | **30K** | **500K** | **Primary: chat + docs** (best balance) |
| llama-3.1-8b-instant | 30 | 14.4K | 6K | 500K | Fallback chat; high RPD |
| llama-3.3-70b-versatile | 30 | 1K | 12K | 100K | Fallback docs (stronger, lower TPD) |
| qwen/qwen3-32b | 60 | 1K | 6K | 500K | Alternative primary; 60 RPM |
| moonshotai/kimi-k2-instruct | 60 | 1K | 10K | 300K | Alternative; 60 RPM |
| groq/compound, compound-mini | 30 | **250** | 70K | - | Avoid as primary: only 250 RPD |

### Gemini (free tier) – fallback only

| Model | RPM | TPM | RPD | Note |
|-------|-----|-----|-----|------|
| Gemini 2.5 Flash | 5 | 250K | 20 | Current default; good fallback |
| Gemini 3.1 Flash Lite | 15 | 250K | **500** | Best Gemini fallback (more RPD) |
| Gemini 2.5 Flash Lite | 10 | 250K | 20 | Alternative |

---

## 3. When a model limit is hit: backup flow

1. **Detect 429** (or rate-limit error) from the current provider/model.
2. **If primary is Groq:** retry the same request with the **backup Groq model** (e.g. `llama-3.1-8b-instant` for chat, or `llama-3.3-70b-versatile` for docs). Optionally respect `retry-after` before retrying.
3. **If backup Groq also returns 429** (or no backup Groq): retry with **Gemini** (e.g. Gemini 2.5 Flash or 3.1 Flash Lite).
4. **If Gemini also fails:** return a clear error to the user (“All AI providers are temporarily at capacity; please try again in a few minutes”) and optionally log for monitoring.

So **yes, we use backup models** when one model’s limit is hit: first another Groq model, then Gemini.

---

## 4. Implementation checklist

- [ ] Add env vars: `GROQ_API_KEY`, `GROQ_CHAT_MODEL`, `GROQ_DOCS_MODEL`, keep `GEMINI_API_KEY` and `GEMINI_MODEL` for fallback.
- [ ] Create `lib/ai/provider.ts`: interface `generateText(system, user, { maxTokens, temperature })` and implementations for Groq and Gemini.
- [ ] Create `lib/ai/fallback.ts` (or inside provider): try primary → on 429 try backup Groq → then try Gemini; return first successful text.
- [ ] Update `app/api/ai/chat/route.ts` and `app/api/ai/analyze/route.ts` to use the new provider/fallback instead of `getGeminiModel()`.
- [ ] Update `lib/documents/generator.ts` to use the new provider/fallback instead of `getGeminiModelForDocs()`.
- [ ] Optionally: log `x-ratelimit-remaining-requests` / `x-ratelimit-remaining-tokens` from Groq responses to anticipate limits.
- [ ] Update `Clarispec_Complete_Documentation.md` (env vars, Section 10 AI System, deployment).

---

## 5. Summary

- **Primary:** Groq with `meta-llama/llama-4-scout-17b-16e-instruct` for both chat and docs (or separate chat/docs models from the table).
- **Backup when limit hit:** (1) Second Groq model, then (2) Gemini (e.g. 2.5 Flash or 3.1 Flash Lite).
- **Ideal model:** For a single primary, **llama-4-scout-17b-16e-instruct** is the best fit (30K TPM, 500K TPD). Use **Gemini 3.1 Flash Lite** as main fallback (500 RPD, 250K TPM).
