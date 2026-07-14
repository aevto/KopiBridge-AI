import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f5f0] p-5">
      <section className="w-full max-w-lg rounded-lg border border-espresso-100 bg-white p-8 text-center shadow-soft">
        <div className="flex justify-center">
          <BrandMark />
        </div>
        <FileQuestion className="mx-auto mt-8 h-8 w-8 text-espresso-300" />
        <h1 className="mt-5 text-3xl font-semibold text-espresso-900">
          Report not found
        </h1>
        <p className="mt-3 text-sm leading-6 text-espresso-500">
          The page may have been deleted, or this account does not have access
          to it.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex rounded-md bg-espresso-900 px-5 py-3 text-sm font-semibold text-white"
        >
          Return to dashboard
        </Link>
      </section>
    </main>
  );
}
