import { PublicHeader } from "@/components/PublicHeader";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#fcfaf7]">
      <PublicHeader />
      <article className="mx-auto max-w-3xl px-5 py-14 md:px-8">
        <p className="text-xs font-bold uppercase text-sage-700">Privacy</p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-espresso-900">
          How KopiBridge handles your data
        </h1>
        <p className="mt-4 text-sm leading-7 text-espresso-500">
          This page describes the current early-stage product implementation. It
          should be updated if the architecture changes.
        </p>
        <PrivacySection title="What is processed">
          Your account email, extracted resume text, job-description text,
          target role, and optional company name are processed to authenticate
          you and create a report.
        </PrivacySection>
        <PrivacySection title="What is stored">
          Supabase stores your account and private structured reports:
          target-role metadata, report date, score, recommendation, evidence
          snippets, and action guidance. Full resume text, full job-description
          text, and uploaded PDF files are not stored in analysis history.
        </PrivacySection>
        <PrivacySection title="Uploaded files">
          PDF extraction runs in your browser. The PDF file itself is not
          uploaded or permanently retained by KopiBridge. The extracted text is
          sent to the authenticated analysis endpoint for processing.
        </PrivacySection>
        <PrivacySection title="Access and deletion">
          Database row-level security restricts reports to their owner. You can
          delete individual reports from History. Account deletion is not yet
          self-service and should be handled through the project administrator.
        </PrivacySection>
        <PrivacySection title="Limits of the guidance">
          Recommendations are deterministic estimates and should be verified.
          KopiBridge does not guarantee interviews, offers, employment, or
          hiring outcomes.
        </PrivacySection>
      </article>
    </main>
  );
}

function PrivacySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-9 border-t border-espresso-100 pt-6">
      <h2 className="text-xl font-semibold text-espresso-900">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-espresso-600">{children}</p>
    </section>
  );
}
