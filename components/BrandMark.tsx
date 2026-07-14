import Link from "next/link";
import { Coffee } from "lucide-react";

export function BrandMark({
  href = "/",
  compact = false,
}: {
  href?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-3 text-espresso-900"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-espresso-900 text-white shadow-sm">
        <Coffee className="h-5 w-5" aria-hidden="true" />
      </span>
      <span
        className={`${compact ? "text-lg" : "text-lg sm:text-xl"} whitespace-nowrap font-semibold`}
      >
        KopiBridge AI
      </span>
    </Link>
  );
}
