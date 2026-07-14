import { HistoryList } from "@/components/HistoryList";
import { requireUser } from "@/lib/auth";
import { getRecentAnalyses } from "@/lib/history";

export default async function HistoryPage() {
  const user = await requireUser("/history");
  const items = await getRecentAnalyses(user.id, 50);
  return (
    <div>
      <p className="text-xs font-bold uppercase text-sage-700">
        Private archive
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-espresso-900">
        Analysis history
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-espresso-500">
        Revisit structured reports without retaining your uploaded PDF or full
        resume text.
      </p>
      <div className="mt-7">
        <HistoryList items={items} />
      </div>
    </div>
  );
}
