import { SignupScreen } from "@/components/SignupScreen";

export default function AdminSignupPage() {
  return (
    <SignupScreen role="admin" title="Admin Signup" loginPath="/admin/login" />
  );
}

