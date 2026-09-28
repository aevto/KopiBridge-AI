import { PGlite } from "@electric-sql/pglite";
import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const userA = "11111111-1111-4111-8111-111111111111";
const userB = "22222222-2222-4222-8222-222222222222";
const reportId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
let db: PGlite;
async function identity(id: string) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
  await db.exec("set role authenticated");
}
async function reserve(
  kind = "vision",
  key = crypto.randomUUID(),
  id: string | null = null,
) {
  const result = await db.query<{
    accepted: boolean;
    reason: string;
    operation_id: string;
    remaining: number;
  }>("select * from public.reserve_model_operation($1, $2, $3)", [
    kind,
    key,
    id,
  ]);
  return result.rows[0];
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create schema auth; create schema extensions;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create function extensions.gen_random_uuid() returns uuid language sql as $$ select gen_random_uuid() $$;
    grant usage on schema public, auth to authenticated, anon;
    insert into auth.users values ('${userA}'), ('${userB}');`);
  // PGlite has core UUID generation but not Supabase's pgcrypto extension wrapper.
  await db.exec(
    readFileSync(
      "supabase/migrations/20260714065102_create_kopibridge_saas_foundation.sql",
      "utf8",
    ).replace(
      "create extension if not exists pgcrypto with schema extensions;",
      "",
    ),
  );
  await db.exec(
    readFileSync(
      "supabase/migrations/20260927203904_add_multimodal_career_workflow.sql",
      "utf8",
    ),
  );
}, 30_000);
beforeEach(async () => {
  await db.exec(
    "reset role; truncate public.interview_practice, public.model_operations, public.credit_transactions, public.daily_credit_balances, public.analyses cascade;",
  );
  await db.query(
    "insert into public.analyses(id,user_id,target_role,overall_score,score_label,final_recommendation,report,idempotency_key) values($1,$2,'AI Engineer',50,'Partial match','Build proof',$3,$4)",
    [
      reportId,
      userA,
      JSON.stringify({
        interviewPreparation: { questions: ["Describe a project you built."] },
      }),
      crypto.randomUUID(),
    ],
  );
  await identity(userA);
});
afterAll(async () => {
  await db.close();
});

describe("executable PostgreSQL media security", () => {
  it("accepts only six attempts and blocks duplicates without another reservation", async () => {
    const key = crypto.randomUUID();
    expect((await reserve("vision", key)).accepted).toBe(true);
    expect((await reserve("vision", key)).reason).toBe("duplicate");
    const results = await Promise.all(
      Array.from({ length: 8 }, () => reserve()),
    );
    expect(results.filter((row) => row.accepted)).toHaveLength(5);
    expect((await reserve()).reason).toBe("daily_limit");
  });
  it("uses the Singapore date and does not spend full-analysis credits", async () => {
    await reserve();
    const rows = await db.query<{ correct: boolean }>(
      "select usage_date = timezone('Asia/Singapore', now())::date as correct from public.model_operations",
    );
    expect(rows.rows[0].correct).toBe(true);
    expect(
      (await db.query("select * from public.daily_credit_balances")).rows,
    ).toHaveLength(0);
    await db.exec(
      "reset role; update public.model_operations set usage_date = usage_date - 1;",
    );
    await identity(userA);
    expect((await reserve()).remaining).toBe(5);
  });
  it("rejects anonymous execution, foreign reports, and direct usage deletion", async () => {
    await db.exec("reset role; set role anon;");
    await expect(reserve()).rejects.toThrow(/permission denied/);
    await identity(userB);
    expect(
      (await reserve("interview", crypto.randomUUID(), reportId)).reason,
    ).toBe("not_found");
    await identity(userA);
    await reserve();
    await expect(
      db.exec("delete from public.model_operations"),
    ).rejects.toThrow(/permission denied/);
  });
  it("saves once, isolates owners, and cascades practice deletion while retaining usage", async () => {
    const operation = await reserve("interview", crypto.randomUUID(), reportId);
    const args = [
      operation.operation_id,
      "Describe a project you built.",
      "I built and tested a small Python service for a class project.",
      JSON.stringify({ summary: "Test feedback" }),
      "openai",
      "test-model",
    ];
    const query =
      "select public.save_interview_practice($1,$2,$3,$4,$5,$6) as id";
    const first = await db.query(query, args);
    expect((await db.query(query, args)).rows).toEqual(first.rows);
    await identity(userB);
    expect(
      (await db.query("select * from public.interview_practice")).rows,
    ).toHaveLength(0);
    await expect(db.query(query, args)).rejects.toThrow(/Owned report/);
    await identity(userA);
    await db.query("delete from public.analyses where id=$1", [reportId]);
    expect(
      (await db.query("select * from public.interview_practice")).rows,
    ).toHaveLength(0);
    expect(
      (await db.query("select * from public.model_operations")).rows,
    ).toHaveLength(1);
  });
  it("does not let a practice answer alter the underlying report", async () => {
    const operation = await reserve("interview", crypto.randomUUID(), reportId);
    await expect(
      db.query("select public.save_interview_practice($1,$2,$3,$4,$5,$6)", [
        operation.operation_id,
        "A made up question",
        "I built a project and tested all of its main features.",
        "{}",
        "openai",
        "test-model",
      ]),
    ).rejects.toThrow(/Question must belong/);
    await expect(
      db.query("update public.analyses set overall_score=100 where id=$1", [
        reportId,
      ]),
    ).rejects.toThrow(/permission denied/);
  });
  it("enforces three full analyses and idempotent refunds in the existing credit system", async () => {
    const reservations = [];
    for (let i = 0; i < 3; i++)
      reservations.push(
        (
          await db.query<{ reservation_id: string; accepted: boolean }>(
            "select * from public.reserve_analysis_credit($1)",
            [crypto.randomUUID()],
          )
        ).rows[0],
      );
    expect(reservations.every((r) => r.accepted)).toBe(true);
    expect(
      (
        await db.query<{ reason: string }>(
          "select * from public.reserve_analysis_credit($1)",
          [crypto.randomUUID()],
        )
      ).rows[0].reason,
    ).toBe("no_credits");
    expect(
      (
        await db.query<{ refunded: boolean }>(
          "select public.refund_analysis_credit($1) as refunded",
          [reservations[0].reservation_id],
        )
      ).rows[0].refunded,
    ).toBe(true);
    expect(
      (
        await db.query<{ refunded: boolean }>(
          "select public.refund_analysis_credit($1) as refunded",
          [reservations[0].reservation_id],
        )
      ).rows[0].refunded,
    ).toBe(false);
    expect(
      (
        await db.query<{ used_count: number }>(
          "select used_count from public.daily_credit_balances",
        )
      ).rows[0].used_count,
    ).toBe(2);
  });
});
