import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  label: string;
}

export function LoadingState({ label }: LoadingStateProps) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-espresso-100 bg-white px-4 py-3 text-sm leading-6 text-espresso-700 shadow-sm">
      <Loader2
        className="h-4 w-4 animate-spin text-sage-600"
        aria-hidden="true"
      />
      <span>{label}</span>
    </div>
  );
}
