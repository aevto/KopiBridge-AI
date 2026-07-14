import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export function PublicHeader() {
  return (
    <header className="no-print border-b border-espresso-100/80 bg-[#fcfaf7]/90 backdrop-blur">
      <div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-2 px-4 py-4 sm:gap-4 sm:px-5 md:px-8">
        <BrandMark />
        <nav
          className="flex flex-none items-center gap-1 sm:gap-2"
          aria-label="Public navigation"
        >
          <Link
            href="/login"
            className="rounded-md px-3 py-2 text-sm font-semibold text-espresso-700 transition hover:bg-espresso-50"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-espresso-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-espresso-700"
          >
            Start free
          </Link>
        </nav>
      </div>
    </header>
  );
}
