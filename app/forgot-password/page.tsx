import { AuthShell } from "@/components/AuthShell";
import { PasswordResetForm } from "@/components/PasswordResetForm";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      description="We will send a secure link if an account exists for the address."
    >
      <PasswordResetForm />
    </AuthShell>
  );
}
