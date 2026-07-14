import { AuthShell } from "@/components/AuthShell";
import { UpdatePasswordForm } from "@/components/UpdatePasswordForm";

export default function UpdatePasswordPage() {
  return (
    <AuthShell
      title="Choose a new password"
      description="Use at least eight characters and avoid reusing a password from another service."
    >
      <UpdatePasswordForm />
    </AuthShell>
  );
}
