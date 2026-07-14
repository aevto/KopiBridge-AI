import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  FileSearch,
  Fingerprint,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";

export default function HomePage() {
  return (
    <main className="overflow-hidden bg-[#fcfaf7]">
      <PublicHeader />
      <section
        className="relative flex min-h-[570px] items-center border-b border-espresso-100 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(29,17,16,.96) 0%, rgba(29,17,16,.88) 46%, rgba(29,17,16,.28) 100%), url('/hero-desk.png')",
        }}
      >
        <div className="mx-auto w-full max-w-7xl px-5 py-16 md:px-8 md:py-20">
          <div className="max-w-3xl text-white">
            <p className="text-xs font-bold uppercase text-espresso-200">
              KopiBridge AI
            </p>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.08] sm:text-6xl">
              See what stands between your resume and the role you want.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-espresso-100">
              Compare the evidence in your resume with a real job description.
              Leave with a grounded fit estimate, honest claim guidance, and a
              practical plan for what to do next.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-5 py-3.5 font-semibold text-espresso-900 shadow-sm transition hover:bg-espresso-50"
              >
                Create free account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-md border border-white/35 px-5 py-3.5 font-semibold text-white transition hover:bg-white/10"
              >
                Log in
              </Link>
            </div>
            <p className="mt-5 flex items-center gap-2 text-xs text-espresso-200">
              <ShieldCheck className="h-4 w-4 text-sage-500" />
              Three private analyses per day. No employment guarantees or
              inflated claims.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-espresso-100 bg-[#f7f2eb] py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 md:px-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase text-sage-700">
              A report you can act on
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-espresso-900">
              Know whether to apply, edit, or build proof first.
            </h2>
            <p className="mt-5 text-base leading-7 text-espresso-600">
              KopiBridge separates evidence you already have from wording that
              needs care and claims you have not earned yet. The result is
              shorter, safer, and more useful than a keyword total.
            </p>
            <div className="mt-7 space-y-4">
              <Benefit
                icon={<BadgeCheck />}
                title="Evidence checker"
                text="Every important claim is labelled Safe to add now, Reframe carefully, or Needs proof first."
              />
              <Benefit
                icon={<Route />}
                title="Proof-building roadmap"
                text="Tasks create visible evidence through code, tests, documentation, deployment, or measurable outcomes."
              />
              <Benefit
                icon={<Target />}
                title="Application decision"
                text="The report ends with a nuanced recommendation based on the resume and role."
              />
            </div>
          </div>
          <div className="rounded-lg border border-espresso-100 bg-white p-5 shadow-soft sm:p-7">
            <div className="flex items-center justify-between gap-4 border-b border-espresso-100 pb-5">
              <div>
                <p className="text-xs font-bold uppercase text-espresso-400">
                  Example decision brief
                </p>
                <h3 className="mt-2 text-xl font-semibold text-espresso-900">
                  Junior AI Engineer
                </h3>
              </div>
              <span className="text-4xl font-semibold text-espresso-900">
                68%
              </span>
            </div>
            <div className="grid gap-5 py-6 sm:grid-cols-2">
              <div className="border-l-2 border-sage-600 pl-4">
                <p className="text-xs font-bold uppercase text-sage-700">
                  Existing strength
                </p>
                <p className="mt-2 font-semibold text-espresso-900">
                  Python project evidence
                </p>
                <p className="mt-1 text-sm leading-6 text-espresso-500">
                  Supported by named libraries and project context.
                </p>
              </div>
              <div className="border-l-2 border-clay-600 pl-4">
                <p className="text-xs font-bold uppercase text-clay-700">
                  Priority gap
                </p>
                <p className="mt-2 font-semibold text-espresso-900">
                  Deployment evidence
                </p>
                <p className="mt-1 text-sm leading-6 text-espresso-500">
                  Build and verify a live deployment before adding the claim.
                </p>
              </div>
            </div>
            <div className="border-t border-espresso-100 pt-5">
              <p className="text-xs font-bold uppercase text-espresso-400">
                Recommended next move
              </p>
              <p className="mt-2 text-lg font-semibold text-espresso-900">
                Apply after light resume edits
              </p>
              <p className="mt-2 text-sm leading-6 text-espresso-500">
                Strengthen supported project evidence and prepare an honest
                answer for the deployment gap.
              </p>
            </div>
            <p className="mt-5 text-[11px] leading-5 text-espresso-400">
              Example only. Scores estimate resume-to-role alignment, not hiring
              success.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase text-sage-700">
              How it works
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold text-espresso-900">
              A focused path from role to roadmap.
            </h2>
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            <Step
              number="01"
              icon={<FileSearch />}
              title="Bring the evidence"
              text="Upload a text-based PDF or paste resume text, then add the full job description."
            />
            <Step
              number="02"
              icon={<Fingerprint />}
              title="Check claim safety"
              text="The deterministic engine maps requirement evidence without inventing experience or metrics."
            />
            <Step
              number="03"
              icon={<Sparkles />}
              title="Act on the gaps"
              text="Use the report, interview questions, and proof tasks to decide what deserves your time."
            />
          </div>
        </div>
      </section>

      <section className="border-y border-espresso-100 bg-sage-50 py-14">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 md:px-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
          <div>
            <span className="flex h-12 w-12 items-center justify-center rounded-md bg-white text-sage-700 shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <h2 className="mt-5 font-display text-3xl font-semibold text-espresso-900">
              Privacy designed into the workflow.
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <PrivacyPoint
              title="Files stay temporary"
              text="PDF extraction happens in your browser and the uploaded file is not retained."
            />
            <PrivacyPoint
              title="Text is minimised"
              text="Resume and role text is processed for the request, then only the structured report is saved."
            />
            <PrivacyPoint
              title="Reports stay private"
              text="Authentication and owner-only database policies protect saved history."
            />
          </div>
        </div>
      </section>

      <section className="bg-espresso-900 py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 px-5 md:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase text-espresso-200">
              Make the next application more deliberate
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold leading-tight">
              Turn one job description into your clearest next move.
            </h2>
          </div>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-5 py-3.5 font-semibold text-espresso-900"
          >
            Start free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
      <footer className="bg-espresso-900 pb-8 text-espresso-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 border-t border-white/10 px-5 pt-6 text-xs sm:flex-row sm:items-center sm:justify-between md:px-8">
          <p>KopiBridge AI. Career guidance should be verified before use.</p>
          <div className="flex gap-5">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Benefit({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-4">
      <span className="mt-0.5 text-sage-700 [&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </span>
      <div>
        <h3 className="font-semibold text-espresso-900">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-espresso-500">{text}</p>
      </div>
    </div>
  );
}

function Step({
  number,
  icon,
  title,
  text,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <article className="border-t border-espresso-200 pt-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-espresso-400">{number}</span>
        <span className="text-sage-700 [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      </div>
      <h3 className="mt-5 text-xl font-semibold text-espresso-900">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-espresso-500">{text}</p>
    </article>
  );
}

function PrivacyPoint({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <CheckCircle2 className="h-4 w-4 text-sage-700" />
      <h3 className="mt-3 font-semibold text-espresso-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-espresso-500">{text}</p>
    </div>
  );
}
