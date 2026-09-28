import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { execFileSync, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";

async function main() {
  loadEnvConfig(process.cwd());
  const keys = JSON.parse(
    execFileSync(
      "npx",
      [
        "supabase",
        "projects",
        "api-keys",
        "--project-ref",
        "mnsdjcqofdhcrfnlapwa",
        "--output",
        "json",
      ],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 30000 },
    ),
  );
  const key = keys.find(
    (entry: { name: string }) => entry.name === "service_role",
  )?.api_key;
  if (!key) throw new Error("Test account administration unavailable.");
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const created: string[] = [];
  const env = { ...process.env };
  try {
    for (const prefix of ["USER", "SECONDARY"]) {
      const email = `kopibridge-qa-${randomUUID()}@example.com`;
      const password = `Qa9!${randomUUID()}`;
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error || !data.user)
        throw new Error("Unable to provision a disposable QA account.");
      created.push(data.user.id);
      env[`KOPIBRIDGE_TEST_${prefix}_EMAIL`] = email;
      env[`KOPIBRIDGE_TEST_${prefix}_PASSWORD`] = password;
    }
    const result = spawnSync(
      "npx",
      ["playwright", "test", "multimodal.spec.ts", "--project=desktop"],
      { env, stdio: "inherit" },
    );
    process.exitCode = result.status ?? 1;
  } finally {
    for (const id of created) {
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) console.error("Disposable QA account cleanup failed.");
    }
    console.log(
      `Cleaned up ${created.length} disposable QA accounts; existing users were not modified.`,
    );
  }
}
void main();
