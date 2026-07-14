# KopiBridge AI

KopiBridge AI is an evidence-led resume-to-role analysis product for students, graduates, and early-career candidates. It compares resume evidence with a target job description, separates safe claims from proof-first gaps, and builds a practical application roadmap.

The scoring and guidance engine is deterministic TypeScript. No OpenAI key, LLM route, or model provider is required.

## Product Flow

1. Create an account or log in with email and password.
2. Upload a text-based PDF resume or paste resume text.
3. Paste a target job description and confirm the detected role and company.
4. Run a server-authenticated analysis using one daily credit.
5. Review a private structured report and print or save it as PDF.
6. Revisit or delete the report from History.

Each user receives three analyses per Singapore calendar day. Credits are reserved atomically in Postgres, duplicate requests are idempotent, and internal failures trigger a refund transaction.

## Stack

- Next.js App Router, React, TypeScript, and Tailwind CSS
- Supabase Auth with cookie-based sessions
- Supabase Postgres with row-level security
- PDF.js for browser-side PDF text extraction
- Zod for request validation
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
```

Never expose a Supabase secret or service-role key in a `NEXT_PUBLIC_` variable.

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

Uploaded PDF files are not stored. PDF extraction occurs in the browser. Extracted resume and job-description text is processed by the authenticated server route but is not retained in history. Saved reports contain role metadata, scores, recommendations, and short evidence snippets needed to understand the report.

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

## Deployment

Add the two public Supabase environment variables to Vercel for Production and Preview environments. Apply the migration before enabling authenticated users. Do not deploy a service-role key to the browser.
