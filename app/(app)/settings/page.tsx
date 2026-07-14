import Link from "next/link";
import { Database, FileX2, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await requireUser("/settings");
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-bold uppercase text-sage-700">
        Account and trust
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-espresso-900">
        Settings
      </h1>
      <section className="mt-7 rounded-lg border border-espresso-100 bg-white p-6 shadow-card">
        <h2 className="text-lg font-semibold text-espresso-900">Account</h2>
        <p className="mt-2 text-sm text-espresso-500">
          Signed in as {user.email}
        </p>
      </section>
      <section className="mt-5 space-y-5 rounded-lg border border-espresso-100 bg-white p-6 shadow-card">
        <h2 className="text-lg font-semibold text-espresso-900">
          How your data is handled
        </h2>
        <TrustRow
          icon={<FileX2 />}
          title="Uploaded files are temporary"
          text="PDF extraction happens in your browser. The uploaded file is not sent to or retained by KopiBridge."
        />
        <TrustRow
          icon={<Database />}
          title="Only structured reports are saved"
          text="We retain target-role metadata and the generated structured report so you can revisit history. Full resume and job-description text are not stored."
        />
        <TrustRow
          icon={<ShieldCheck />}
          title="Recommendations need verification"
          text="KopiBridge estimates alignment and does not guarantee interviews, offers, or employment."
        />
        <div className="flex gap-4 text-sm font-semibold">
          <Link href="/privacy" className="text-sage-700">
            Privacy
          </Link>
          <Link href="/terms" className="text-sage-700">
            Terms
          </Link>
        </div>
      </section>
    </div>
  );
}

function TrustRow({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-4">
      <span className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-md bg-sage-50 text-sage-700 [&>svg]:h-4 [&>svg]:w-4">
        {icon}
      </span>
      <div>
        <h3 className="font-semibold text-espresso-900">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-espresso-500">{text}</p>
      </div>
    </div>
  );
}
