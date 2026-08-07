# TeachAI — AI lesson planning coach

A hackathon demo. Melissa is a 30-year-old Precalculus teacher; the app coaches
her on planning lessons *with* AI rather than planning for her.

## Setup

The API key lives in `teachai/.env.local` (gitignored):

```
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

```bash
npm install
npm run dev     # restart this after editing .env.local — Vite reads it at startup
```

> The Claude API is called directly from the browser with
> `dangerouslyAllowBrowser: true`, so Vite inlines the key into the bundle and
> anything on the page can read it. Fine for a demo on your own machine;
> anything real needs these calls proxied through a server.

## The demo path

1. **Landing** — "how can i help you Melissa?" She types what she's working on.
2. **Coach replies** (streamed) and ends by asking: *Do you have any sample
   lesson plans?* Two buttons appear.
3. **Yes** → she attaches a plan (PDF or plain text; `demo/sample-lesson-plan.md`
   is a deliberately mediocre one to demo with). Claude reads it and returns:
   - what it read back, and what genuinely works
   - specific weaknesses, each anchored to a quote from *her* plan
   - a **training session** — one module per weakness, each teaching a named
     prompting move plus a complete, copy-pasteable prompt already filled in
     with her real topic and grade. **Run it here** executes the prompt live so
     she sees what it produces.
   - a **Rebuild my lesson** button that applies every move and returns the
     improved plan.
4. **No** → Claude asks four questions that would change what the lesson looks
   like, then builds a full lesson plan from her answers.

Both paths end on a downloadable lesson plan.

## Structure

| Path | What it holds |
| --- | --- |
| `src/lib/claude.ts` | Anthropic client, key handling, coach persona, every API call |
| `src/lib/schemas.ts` | Structured-output JSON schemas and the matching types |
| `src/lib/file.ts` | Reads an attached plan into a text or base64-PDF block |
| `src/App.tsx` | Phase machine and transcript |
| `src/components/` | Training session, intake form, lesson plan card, key gate |

Model is `claude-opus-5` throughout: streamed at `effort: low` for conversation,
non-streamed at `effort: high` with structured outputs for analysis and plans.
