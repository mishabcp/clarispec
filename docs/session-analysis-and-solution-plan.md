# Session Analysis & Solution Plan
**Project ID:** `12ca0380-a049-4c27-bc4f-10f34390f242`  
**Purpose:** Understand why 100% completes too fast, list flaws, and define fixes.

---

## 1. Analysis script (removed)

The one-off script that queried Supabase and wrote `docs/session-analysis-results.json` was removed after debugging. The captured results in this doc (section 2) remain for reference.

---

## 2. Session Data Results (Run 2026-03-16)

Data below is from the script run for project **CBMS** (`12ca0380-a049-4c27-bc4f-10f34390f242`).

### 2.1 Project summary
| Field | Value |
|-------|--------|
| Name | CBMS |
| Client | qwert |
| Industry | Real Estate |
| Depth | **deep** |
| Requirement score | **100** |
| Status | gathering |

### 2.2 Counts
| Metric | Count |
|--------|--------|
| User messages | **7** |
| AI questions | **9** |
| AI messages (ack + question) | 18 |

So **7 user answers** and **9 AI questions** were stored. The 9th question (user roles) was still on screen in the screenshot; the session had already reached 100% after the 8th exchange.

### 2.3 Requirement areas

All **10** areas are `is_covered: true`. Crucially, every area has the **same** `updated_at`: **`2026-03-16T09:25:08.997Z`** — **before** the first chat message (first message at `09:25:28`). So all areas were marked covered at init (analyzer or initial seed), not by the conversation.

### 2.4 Conversation flow (summary)

1. System welcome + first question (primary business challenge).
2. User: "all of the above" → ack + question (core business areas).
3. User: "all of the above" → ack + question (key process/workflow).
4. User: "all options except C" → ack + question (integrations).
5. User: "No" → ack + question (platform).
6. User: "Through a web browser..." → ack + question (data security).
7. User: "Standard security measures..." → ack + question (performance/scale).
8. User: "It needs to maintain high performance..." → ack + question (constraints).
9. (User answer to constraints question) → ack + question (user roles — last question, still unanswered in DB).

Options per question are not stored in the DB (only question text), so “options provided for each question” cannot be derived from the current schema.

### 2.5 Root cause of “100% too fast”

- **All 10 areas were set to covered at session start** (timestamp 09:25:08, before any user reply). So the session did not “gather” its way to 100%; it either started at 100% or the analyzer/init set every area to true.
- With depth **deep** and only **7–8 Q&A pairs**, the model had no incentive to ask more because coverage was already complete from the beginning.
- **Conclusion:** The main fix is **F4** — do not let the analyzer (or init) set `initialRequirementAreas` to all true; start with all areas false and score 0 so the questioner alone drives coverage.

---

## 3. How Scoring and Flow Work (Code Summary)

| Component | Behavior |
|-----------|----------|
| **Score** | Sum of weights for areas where `is_covered = true`. Max 100 (purpose 15, userRoles 10, coreFeatures 20, userFlows 15, integrations 10, platform 5, scale 5, dataPrivacy 10, nonFunctional 5, constraints 5). |
| **Who sets score/areas** | (1) **Analyzer** (once at init): sets `initialRequirementAreas` and `initialScore` from the brief. (2) **Questioner** (every turn): returns `updatedScore` and `updatedAreas` in JSON; app persists both to DB and state. |
| **Depth level** | Passed to the questioner as text (e.g. "Deep Dive"). Prompt only says "Identify what important information is still missing **based on the depth level**" — no minimum questions per area or explicit depth rules. |
| **Per-turn messages** | Each AI turn writes **two** messages: (1) `acknowledgment` (type `chat`), (2) `question` (type `question`). If the model returns the same or very similar text for both, the UI shows two identical bubbles. |

---

## 4. Flaws Identified

### F1. Score/areas fully controlled by the model with no guards
- The AI can set **any** `updatedScore` and `updatedAreas` every turn.
- There is **no rule** that an area must be asked about at least once before being set to `true`, or that "deep" means more questions per area.
- **Effect:** 100% can be reached after relatively few user answers (e.g. one answer that the model interprets as covering multiple areas).

### F2. Depth level is under-specified
- `depthLevel` is only mentioned once in the questioner prompt and is not defined (what "quick" vs "standard" vs "deep" implies in terms of number or depth of questions).
- **Effect:** "Deep Dive" does not enforce more questions or stricter coverage; the model can still mark areas covered quickly.

### F3. Duplicate or near-duplicate AI messages
- The app **always** saves two assistant messages per turn: `acknowledgment` and `question`.
- If the model returns the same (or almost the same) text for both, the UI shows two identical bubbles (e.g. "Understanding that compliance..." twice).
- **Effect:** Redundant bubbles and confusion; looks like a bug.

### F4. Analyzer can pre-fill score and areas
- The **analyzer** can set `initialRequirementAreas` and `initialScore` from the brief alone (no user answers yet).
- If it marks several areas as already covered, the session starts with a high score and the questioner may ask fewer questions before 100%.
- **Effect:** Fewer questions needed to reach 100%.

### F5. No minimum-question or pacing policy
- There is no rule such as "ask at least one question per area before marking it covered" or "for deep, ask at least two questions per area."
- **Effect:** The model can mark an area covered after a single answer (or even without a direct question for that area if it infers from context).

### F6. No validation of model score math
- The app trusts `updatedScore` from the model. It does not recompute score from `updatedAreas` using the fixed weights in `calculateScore()`.
- **Effect:** Possible mismatch between displayed score and actual coverage (if the model sends inconsistent numbers).

---

## 5. Solution Plan

### 5.1 Enforce depth in the questioner (reduce F1, F2, F5)
- **Change:** In `lib/ai/prompts/questioner.ts`, add explicit depth rules, for example:
  - **quick:** One question per area is enough; you may set an area to covered after one relevant answer.
  - **standard:** Prefer at least one question per area; do not set an area to covered until you have asked at least one question that targets it.
  - **deep:** For each area, ask at least one focused question before marking it covered; for critical areas (e.g. purpose, coreFeatures, userRoles), prefer 2+ questions or follow-ups if the first answer is vague.
- **Optional:** Pass a small table of "questions asked per area so far" (derived from `questionCategory` in history or from a new field) so the model can see how many times each area was addressed.

### 5.2 Don’t mark areas covered without a targeted question (reduce F1, F5)
- **Change:** In the questioner prompt, add a rule: "Do not set an area to true in updatedAreas unless you have asked at least one question that explicitly targets that area (matching questionCategory) and the user has answered."
- **Optional (backend):** When applying `updatedAreas`, only allow setting an area to `true` if that area appears as `questionCategory` in at least one prior assistant question in the conversation (logic in API or ChatInterface). This is a hard guard.

### 5.3 Deduplicate acknowledgment vs question (fix F3)
- **Change in app:** Before saving, if `acknowledgment` and `question` are the same (or very similar, e.g. trim and equality or high similarity), save only one message (e.g. as `question`) so the UI does not show two identical bubbles.
- **Change in prompt:** In the questioner prompt, state: "Your acknowledgment must be 1–2 short sentences. Your question must be a distinct, new question; do not repeat the acknowledgment as the question."

### 5.4 Cap or soften analyzer initial score/areas (reduce F4)
- **Change:** In the analyzer prompt, add: "Set initialRequirementAreas to false for all areas; we will set them true only after the user answers questions. Set initialScore to 0."
- **Alternative:** Keep analyzer suggestions for "gaps" and "conversation plan" but do not persist `initialRequirementAreas` / `initialScore` to DB; start the session with all areas false and score 0. Then the questioner alone drives coverage.

### 5.5 Recompute score from areas (fix F6)
- **Change:** When the app receives `updatedAreas` from the questioner, compute `score = calculateScore(updatedAreas)` and use that value for persistence and UI instead of `updatedScore` from the model. Optionally still send `updatedScore` in the prompt so the model knows the current score, but do not trust it for storage.

### 5.6 Optional: Minimum question count before 100%
- **Change:** In the questioner prompt or in app logic: "Do not set updatedScore to 100 (or do not set all areas to true) until at least N user answers have been given," with N depending on depth (e.g. quick 8, standard 12, deep 18). Enforce in app by ignoring a model response that sets score to 100 when user message count is below the threshold, and ask the model to continue with more questions.

---

## 6. Suggested Implementation Order

Session data confirms **F4 is the primary cause**: all areas were set covered at init (09:25:08), so 100% was never “earned” by the conversation. Recommended order:

1. **F4 (analyzer)** — **Do first.** Start with all areas false and score 0; do not persist analyzer’s `initialRequirementAreas` / `initialScore` to DB (or instruct analyzer to return all false and 0). Then the questioner alone drives coverage.
2. **F6 (score validation)** — Recompute score from `updatedAreas` via `calculateScore()`; do not trust `updatedScore` from the model for storage/UI.
3. **F3 (duplicate messages)** — Dedupe ack vs question when saving (if identical or near-identical, save only one).
4. **F2 + F1 + F5 (depth and pacing)** — Add explicit depth rules and “do not mark area covered without a targeted question” in the questioner prompt; optionally enforce in backend.

With F4 fixed, a “deep” session should require the model to ask at least one question per area before marking it covered, and the conversation will drive the score from 0 to 100 instead of starting at 100.
