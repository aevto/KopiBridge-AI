import { buildCreditStatus, singaporeCreditDate } from "@/lib/credits";
import { createClient } from "@/lib/supabase/server";

export async function getCreditStatus(userId: string) {
  const supabase = await createClient();
  const creditDate = singaporeCreditDate();
  const { data, error } = await supabase
    .from("daily_credit_balances")
    .select("daily_limit, used_count")
    .eq("user_id", userId)
    .eq("credit_date", creditDate)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load today's analysis credits.");
  }

  return buildCreditStatus(data?.used_count ?? 0, data?.daily_limit ?? 3);
}
