# KopiBridge AI

KopiBridge AI is an evidence-led resume-to-role analysis product for students, graduates, and early-career candidates. It compares resume evidence with a target job description, separates safe claims from proof-first gaps, and builds a practical application roadmap.

The scoring, evidence-strength, gap-severity, and honesty-label engine is deterministic TypeScript. An optional server-side OpenAI layer refines the written guidance using structured outputs. If OpenAI is unavailable or unconfigured, the complete local report remains available.

## Product Flow

1. Create an account or log in with email and password.
2. Upload a text-based PDF, paste text, or consent to AI extraction of a scanned PDF/PNG/JPEG/WebP (up to three pages).
3. Paste a target job description and confirm the detected role and company.
4. Run a server-authenticated analysis using one daily credit.
5. Review a private structured report and print or save it as PDF.
6. Revisit or delete the report from History.
7. Practise one report question: record or upload a short answer, review its transcript, then save grounded feedback with the same private report.

Each user receives three analyses per Singapore calendar day. Credits are reserved atomically in Postgres, duplicate requests are idempotent, and internal failures trigger a refund transaction.

## Stack

- Next.js App Router, React, TypeScript, and Tailwind CSS
- Supabase Auth with cookie-based sessions
- Supabase Postgres with row-level security
- PDF.js for browser-side PDF text extraction
- Zod for request validation
- OpenAI Responses API for optional structured guidance refinement
- Vitest and Playwright for automated checks

## Local Setup

Install dependencies:

```bash
npm install
```

Create a Supabase project, then copy the environment template:

```bash
cp .env.example .env.local
```

Set these values in `.env.local`:

```text
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
OPENAI_API_KEY=your_server_side_project_key
OPENAI_MODEL=gpt-5.6-terra
OPENAI_VISION_MODEL=gpt-4.1-mini
OPENAI_TRANSCRIPTION_MODEL=gpt-4o-mini-transcribe
```

Never expose an OpenAI key, Supabase secret, or service-role key in a `NEXT_PUBLIC_` variable. `OPENAI_MODEL` is optional and defaults to `gpt-5.6-terra`.

Link the CLI and preview the migration:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push --dry-run
```

After reviewing the SQL, apply it:

```bash
npx supabase db push
```

Start the app:

```bash
npm run dev
```

Open `http://127.0.0.1:3000`.

## Supabase Auth Configuration

In Supabase Auth URL Configuration, use:

- Site URL: `https://kopi-bridge-ai.vercel.app`
- Local redirects: `http://127.0.0.1:3000/**` and `http://localhost:3000/**`
- Production redirect: `https://kopi-bridge-ai.vercel.app/**`

Email/password sign-up works with Supabase's default email provider. For production use, configure a reliable SMTP provider and keep email confirmation enabled. The app supports PKCE callback, token-hash confirmation, password reset, and persistent cookie sessions.

## Database and Security

The migration in `supabase/migrations/` creates:

- `analyses`: private structured reports and minimum revisit metadata
- `daily_credit_balances`: one row per user and Singapore date
- `credit_transactions`: auditable deductions, refunds, and future adjustments
- transactional functions for reserve, complete, and refund behavior
- owner-only row-level security policies
- `model_operations`: owner-scoped, idempotent media reservations with six attempts per kind per Singapore day
- `interview_practice`: reviewed answer, question, structured feedback, model identifier and date; deleted with its parent report

Raw uploads are not stored by KopiBridge. Selectable PDF text is extracted in the browser; scanned pages are rasterised and sent to OpenAI only after consent. Audio is converted on-device to mono 16kHz PCM WAV, validated server-side (including the 90-second limit), and transcribed only after consent. Provider retention policies still apply; `store: false` is not a zero-retention guarantee. Reviewed interview text and feedback are saved privately; raw audio and page images are not.

Full resume and job-description inputs are not retained in history. Contact details are redacted from the text guidance context, but redaction is not perfect. Saved reports include evidence snippets and may therefore contain personal information. The deterministic report remains authoritative for scores and claim labels. Interview claims do not upgrade that evidence. Citation enums constrain feedback quotations to actual transcript spans; interpretation still needs human review.

The additive migration `20260927203904_add_multimodal_career_workflow.sql` was applied to the configured project with explicit approval. Media attempt limits do not spend the three full-analysis credits. Failed media attempts count towards six/day limits to bound provider abuse. Account deletion is not yet a self-service feature.

## Validation

```bash
npm run format
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

The full authentication, database, and transaction flow requires a configured Supabase project or a running local Supabase stack.

## CM3020 Section 4.1 Evaluation

Three distinct pretrained model IDs handle image, text and audio inputs. Text-only fallback does not satisfy the complete three-model demo; run the consented scan-to-report-to-interview path for that demonstration.

```bash
# Synthetic fixtures only; these commands make paid provider requests.
npx tsx --tsconfig scripts/evaluation-tsconfig.json scripts/evaluate-models.ts
# Uses CLI authentication to create/delete only disposable QA accounts.
npx tsx scripts/run-multimodal-qa.ts
```

The QA runner is explicitly tied to this configured Supabase project. It captures synthetic-data screenshots and checks the full workflow, persistence, ownership, concurrent duplicates, credit exhaustion and deletion. It never prints API keys or test passwords. Use a staging project for ongoing CI. PGlite tests execute migrations and ownership/quota cases without a hosted database; they do not represent a distributed concurrency benchmark.

Evaluation files live in `reports/evaluation/`; fixtures in `tests/fixtures/multimodal/`. `model-results.json` preserves rejected first-iteration quotations and successful constrained-quotation reruns. Word error rate is case/punctuation-normalised and comes from a tiny synthetic dataset, not representative human speech or hiring outcomes. No user-study results are claimed.

Production hardening still includes MFA/leaked-password settings, a richer semantic/negation benchmark, an independently reviewed provider-output quality rubric, account-wide deletion, and cross-browser microphone/print testing. The hosted security advisor flags authenticated security-definer RPCs: these are intentional owner-checked operations but are not a claim of independent security certification. Owner-writable report RPCs should not be treated as tamper-proof academic or employment credentials.

## Deployment

Add the two public Supabase variables plus the server-only `OPENAI_API_KEY` and optional three model variables to Vercel for Production and Preview environments. Apply migrations before enabling the new features. Use Node 22 as declared in package.json. Do not deploy a service-role or OpenAI key to the browser. Verify the live deployment after each release; local validation alone does not prove that production contains the latest commit.

## Final Project Report

The [final report](reports/KopiBridge-AI-Final-Project-Report.pdf) documents the three-model workflow, implementation, test plan, model comparisons, results, and limitations. An editable [Word version](reports/KopiBridge-AI-Final-Project-Report.docx), synthetic [evaluation results](reports/evaluation/), and annotated screenshots in `reports/final-report-assets/multimodal/` are included for reproducibility. The report does not claim a human user study or measured hiring outcomes.
