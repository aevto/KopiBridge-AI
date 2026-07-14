import { BrandMark } from "@/components/BrandMark";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#f7f2eb] px-5 py-8 sm:py-14">
      <div className="mx-auto max-w-md">
        <div className="mb-8 flex justify-center">
          <BrandMark />
        </div>
        <section className="rounded-lg border border-espresso-100 bg-white p-6 shadow-soft sm:p-8">
          <p className="text-xs font-bold uppercase text-sage-700">
            Your private workspace
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-espresso-900">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-espresso-500">
            {description}
          </p>
          <div className="mt-7">{children}</div>
        </section>
        <p className="mt-5 text-center text-xs leading-5 text-espresso-400">
          Three analyses per day. Reset at midnight Singapore time.
        </p>
      </div>
    </main>
  );
}
