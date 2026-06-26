import { AlertCircle } from "lucide-react";

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <div className="flex items-start gap-3 rounded-md border border-clay-100 bg-clay-50 px-4 py-3 text-sm leading-6 text-clay-700">
      <AlertCircle className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
