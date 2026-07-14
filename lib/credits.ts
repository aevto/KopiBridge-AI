export const DAILY_ANALYSIS_LIMIT = 3;
export const CREDIT_TIME_ZONE = "Asia/Singapore";

export interface CreditStatus {
  limit: number;
  used: number;
  remaining: number;
  creditDate: string;
  resetsAt: string;
}

export function singaporeCreditDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CREDIT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function nextSingaporeReset(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: CREDIT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  const utcEquivalent = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day) + 1,
    0,
    0,
    0,
  );

  return new Date(utcEquivalent - 8 * 60 * 60 * 1000);
}

export function buildCreditStatus(
  used = 0,
  limit = DAILY_ANALYSIS_LIMIT,
  now = new Date(),
): CreditStatus {
  const safeUsed = Math.max(0, Math.min(used, limit));

  return {
    limit,
    used: safeUsed,
    remaining: Math.max(0, limit - safeUsed),
    creditDate: singaporeCreditDate(now),
    resetsAt: nextSingaporeReset(now).toISOString(),
  };
}
