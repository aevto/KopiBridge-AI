# KopiBridge AI

KopiBridge AI is a Stage 1 working prototype for a resume-to-AI-tech-role gap analyser.

The local engine is the source of truth: it extracts resume text from a PDF in the browser, compares it with a pasted AI-tech job description, and generates a complete `AnalysisResult` without requiring an LLM.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:3000`.

## Prototype Flow

1. Upload a PDF resume or click `Use Sample Resume Text`.
2. Review and edit the extracted resume text.
3. Paste a target AI-tech job description or click `Load Demo Job Description`.
4. Click `Analyse Gap`.
5. Review the match score, top gaps, priority actions, role summary, evidence map, and 30-day roadmap.
6. Click `Save Report` to open the browser print dialog and save the report as a PDF.

## Stage 1 Scope

- Next.js App Router, TypeScript, React, and Tailwind CSS.
- Client-side PDF text extraction with PDF.js.
- Pure local TypeScript analysis via `analyseResumeAgainstJob(resumeText, jobDescription)`.
- Demo data for reliable presentations and recordings.
- Responsive dashboard and print-friendly report styling.

Stage 2 LLM wording polish is intentionally not included yet, so the prototype remains reliable without API keys.
