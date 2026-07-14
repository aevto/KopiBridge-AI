import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  path.resolve(
    "supabase/migrations/20260714065102_create_kopibridge_saas_foundation.sql",
  ),
  "utf8",
).toLowerCase();

describe("database security and credit transaction contract", () => {
  it("enables owner-only row-level security", () => {
    expect(migration).toContain(
      "alter table public.analyses enable row level security",
    );
    expect(migration).toContain("(select auth.uid()) = user_id");
    expect(migration).toContain(
      "revoke all on table public.analyses from anon",
    );
  });

  it("serialises deductions and supports idempotency", () => {
    expect(migration).toContain("for update");
    expect(migration).toContain("credit_transactions_user_idempotency_idx");
    expect(migration).toContain(
      "reserve_analysis_credit(p_idempotency_key text)",
    );
    expect(migration).not.toContain("reserve_analysis_credit(p_user_id");
    expect(migration).toContain("store_completed_analysis");
    expect(migration).toContain(
      "grant select, delete on table public.analyses to authenticated",
    );
    expect(migration).not.toContain(
      "grant select, insert, delete on table public.analyses",
    );
  });

  it("restores failed credits and uses the Singapore reset date", () => {
    expect(migration).toContain("failed_analysis_refund");
    expect(migration).toContain("greatest(used_count - 1, 0)");
    expect(migration).toContain("asia/singapore");
  });

  it("restricts security-definer functions to authenticated callers", () => {
    expect(migration).toContain(
      "revoke all on function public.reserve_analysis_credit(text) from public, anon",
    );
    expect(migration).toContain(
      "grant execute on function public.reserve_analysis_credit(text) to authenticated",
    );
  });
});
