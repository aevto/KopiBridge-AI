import { PublicHeader } from "@/components/PublicHeader";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#fcfaf7]">
      <PublicHeader />
      <article className="mx-auto max-w-3xl px-5 py-14 md:px-8">
        <p className="text-xs font-bold uppercase text-sage-700">Terms</p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-espresso-900">
          Responsible use of KopiBridge
        </h1>
        <Term title="Career guidance, not a hiring prediction">
          Scores and recommendations estimate alignment between supplied text.
          They are not professional recruitment advice and do not guarantee any
          employment result.
        </Term>
        <Term title="Your responsibility">
          Only add resume claims you can defend. Review all generated guidance
          for accuracy before using it in an application or interview.
        </Term>
        <Term title="Acceptable use">
          Do not upload content you are not authorised to process, attempt to
          access another user's data, or interfere with credit and security
          controls.
        </Term>
        <Term title="Service availability">
          This is an early-stage product. Features, limits, and availability may
          change, and uninterrupted service is not promised.
        </Term>
      </article>
    </main>
  );
}

function Term({
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
