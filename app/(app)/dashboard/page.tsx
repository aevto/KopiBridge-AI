import Link from "next/link";
import { ArrowRight, Compass, FilePlus2, ShieldCheck } from "lucide-react";
import { CreditCard } from "@/components/CreditCard";
import { HistoryList } from "@/components/HistoryList";
import { requireUser } from "@/lib/auth";
import { getCreditStatus } from "@/lib/credit-status";
import { getRecentAnalyses } from "@/lib/history";

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const [credits, recent] = await Promise.all([
    getCreditStatus(user.id),
    getRecentAnalyses(user.id, 4),
  ]);
  const name = user.email?.split("@")[0] ?? "there";

  return (
    <div className="space-y-10">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_340px]">
        <div className="relative overflow-hidden rounded-lg bg-espresso-900 p-7 text-white shadow-soft sm:p-9">
          <p className="text-sm font-semibold text-espresso-200">
            Welcome back, {name}
          </p>
          <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">
            Turn the next job description into a focused application plan.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-espresso-100">
            See what is already defensible, what needs careful reframing, and
            what deserves real proof before you claim it.
          </p>
          <Link
            href="/analysis/new"
            className="mt-7 inline-flex items-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-semibold text-espresso-900 transition hover:bg-espresso-50"
          >
            <FilePlus2 className="h-4 w-4" />
            New analysis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <CreditCard credits={credits} />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <DashboardPrinciple
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Evidence before claims"
          text="Suggestions are separated into safe, careful, and proof-first actions."
        />
        <DashboardPrinciple
          icon={<Compass className="h-5 w-5" />}
          title="A decision, not a data dump"
          text="Every report ends with a clear apply, edit, or prepare recommendation."
        />
        <DashboardPrinciple
          icon={<FilePlus2 className="h-5 w-5" />}
          title="Private by default"
          text="We save structured reports, not uploaded PDF files or full resume text."
        />
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase text-sage-700">
              Your workspace
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-espresso-900">
              Recent analyses
            </h2>
          </div>
          {recent.length ? (
            <Link
              href="/history"
              className="text-sm font-semibold text-sage-700"
            >
              View all
            </Link>
          ) : null}
        </div>
        <HistoryList items={recent} compact />
      </section>
    </div>
  );
}

function DashboardPrinciple({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="border-l-2 border-sage-500 bg-white px-5 py-4">
      <span className="text-sage-700">{icon}</span>
      <h3 className="mt-3 font-semibold text-espresso-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-espresso-500">{text}</p>
    </div>
  );
}
