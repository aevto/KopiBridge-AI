"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Clock3, FilePlus2, LogOut, Settings } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { createClient } from "@/lib/supabase/client";
import type { CreditStatus } from "@/lib/credits";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/analysis/new", label: "New analysis", icon: FilePlus2 },
  { href: "/history", label: "History", icon: Clock3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({
  children,
  email,
  credits,
}: {
  children: React.ReactNode;
  email: string;
  credits: CreditStatus;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0]">
      <header className="no-print sticky top-0 z-30 border-b border-espresso-100 bg-[#fcfaf7]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 md:px-8">
          <BrandMark href="/dashboard" compact />
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-espresso-700">
                {credits.remaining} of {credits.limit} analyses remaining
              </p>
              <p className="mt-0.5 text-[11px] text-espresso-400">
                Resets midnight Singapore time
              </p>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Log out"
              className="flex h-10 w-10 items-center justify-center rounded-md border border-espresso-100 bg-white text-espresso-600 transition hover:border-clay-100 hover:text-clay-700"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Log out</span>
            </button>
          </div>
        </div>
        <nav
          className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-5 pb-3 md:px-8"
          aria-label="Application navigation"
        >
          {navigation.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex flex-none items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${active ? "bg-espresso-900 text-white" : "text-espresso-500 hover:bg-espresso-50 hover:text-espresso-900"}`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-10">
        {children}
      </main>
      <footer className="no-print mx-auto flex max-w-7xl flex-col gap-2 border-t border-espresso-100 px-5 py-6 text-xs text-espresso-400 sm:flex-row sm:items-center sm:justify-between md:px-8">
        <span>{email}</span>
        <span>
          KopiBridge estimates resume alignment. It does not predict hiring
          outcomes.
        </span>
      </footer>
    </div>
  );
}
