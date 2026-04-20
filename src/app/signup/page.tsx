import { SignupScreen } from "@/components/SignupScreen";

export default async function SignupPage({
    searchParams,
}: {
    searchParams: Promise<{ role?: string }>;
}) {
    const params = await searchParams;
    const role = params.role;
    const normalizedRole =
        role === "admin" || role === "retailer" ? role : undefined;
    return <SignupScreen role={normalizedRole} />;
}
