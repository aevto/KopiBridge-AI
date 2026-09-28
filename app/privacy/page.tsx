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
          you and create a report. When AI guidance is configured, bounded text
          is sent from the authenticated server to the OpenAI API. Contact email
          addresses and phone-number patterns are removed first.
        </PrivacySection>
        <PrivacySection title="What is stored">
          Supabase stores your account and private structured reports:
          target-role metadata, report date, score, recommendation, evidence
          snippets, and action guidance. Full resume text, full job-description
          text, and uploaded PDF files are not stored in analysis history. When
          you save interview feedback, the reviewed answer, question, feedback,
          model identifier, and date are stored with your report.
          Processing-attempt records contain identifiers, feature, and date, not
          the uploaded media. They enforce daily limits.
        </PrivacySection>
        <PrivacySection title="Uploaded files">
          Text-based PDF extraction runs in your browser. With your explicit
          consent, scanned pages or resume images are sent to OpenAI for
          reading. Those images can contain contact details; remove them before
          upload if you do not want them processed. The extracted text is
          available for correction before analysis. Interview audio is sent to
          OpenAI only after you choose transcription and consent. KopiBridge
          processes media in memory and does not save the original PDF, images,
          or audio.
        </PrivacySection>
        <PrivacySection title="AI processing">
          The local engine calculates scores and evidence classifications.
          OpenAI may refine the written guidance but cannot replace those fixed
          results. KopiBridge disables retrievable response storage for these
          text and vision requests; this is not a promise of zero provider
          retention. OpenAI processes API data under its own applicable data
          policies. Check extracted text, transcripts, and feedback before using
          them. Audio feedback assesses answer content, not personality or
          emotion.
        </PrivacySection>
        <PrivacySection title="Access and deletion">
          Database row-level security restricts reports to their owner. You can
          delete individual reports from History, which also deletes associated
          interview answers and feedback. Processing-attempt records remain to
          enforce limits and are removed when the account is deleted. Account
          deletion is not yet self-service and should be handled through the
          project administrator.
        </PrivacySection>
        <PrivacySection title="Limits of the guidance">
          Scores are deterministic estimates and written recommendations may be
          AI-assisted. Verify every suggestion before changing your resume.
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
