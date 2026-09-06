import { SignupScreen } from "@/components/SignupScreen";
import { redirect } from "next/navigation";

export default async function SignupPage({
    searchParams,
}: {
    searchParams: Promise<{ role?: string }>;
}) {
    const params = await searchParams;
    const role = params.role;
    if (role !== "retailer") redirect("/login");
    return <SignupScreen role="retailer" />;
}
