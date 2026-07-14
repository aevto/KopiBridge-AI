import { AnalysisWorkspace } from "@/components/AnalysisWorkspace";
import { requireUser } from "@/lib/auth";
import { getCreditStatus } from "@/lib/credit-status";

export default async function NewAnalysisPage() {
  const user = await requireUser("/analysis/new");
  const credits = await getCreditStatus(user.id);
  return <AnalysisWorkspace initialCredits={credits} />;
}
