"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useApi } from "use-hook-api";
import { useRouter } from "next/navigation";
import { useSetAtom, useAtomValue } from "jotai";
import { financialContactApi } from "@/api/retailer";
import { retailerSetupContextAtom } from "@/store/retailerSetup";
import { useMe } from "@/hooks/useMe";
import { SetupProgressHeader } from "@/components/retailer/SetupProgressHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ChevronLeft, Lock } from "lucide-react";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  FirstName: z.string().min(1, "First name is required"),
  LastName: z.string().min(1, "Last name is required"),
  Email: z.string().email("Invalid email address"),
  Phone: z.string().min(1, "Phone number is required"),
});

type FormData = z.infer<typeof schema>;

// ─── Field helper ─────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
      <AlertCircle className="h-3.5 w-3.5" />
      {message}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface FinancialContactStep3Props {
  audienceId: string;
}

export function FinancialContactStep3({ audienceId }: FinancialContactStep3Props) {
  const router = useRouter();
  const userData = useMe();
  const ctx = useAtomValue(retailerSetupContextAtom);
  const setCtx = useSetAtom(retailerSetupContextAtom);

  const [callSubmit, { loading: submitting }] = useApi({ errMsg: true });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  // Restrict access for retailer role
  if (userData && userData.role === "retailer") {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto mt-12">
            <Card>
              <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center text-center gap-4">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                  <Lock className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Access Restricted
                </h2>
                <p className="text-sm text-gray-600 max-w-xs">
                  This page is only available for setup administrators. Please contact your account manager.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const onSubmit: SubmitHandler<FormData> = (data) => {
    callSubmit(
      financialContactApi({
        audience_id: audienceId,
        current_step_name: "financial_contact",
        form_data: data,
      }),
      ({ data: responseData }: any) => {
        // Advance step in atom
        const nextStep = responseData?.next_step ?? 4;
        if (ctx) {
          setCtx({ ...ctx, currentStep: nextStep });
        }
        router.push(`/retailer/audiences/setup/step/${audienceId}/${nextStep}`);
      }
    );
  };

  const handleBack = () => {
    if (ctx) {
      setCtx({ ...ctx, currentStep: 2 });
    }
    router.push(`/retailer/audiences/setup/step/${audienceId}/2`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SetupProgressHeader stepOverride={3} />

      {/* Back navigation bar */}
      <div className="bg-white border-b sticky top-14 z-20">
        <div className="container mx-auto px-4 py-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Category Exclusions
          </button>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Financial Contact</h1>
          <p className="text-sm text-gray-500 mt-1">
            Please provide the financial contact information for your account.
          </p>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Two-column layout for name fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <Label className="text-sm font-medium mb-1.5 block">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="John"
                  {...register("FirstName")}
                  aria-invalid={!!errors.FirstName}
                  disabled={submitting}
                />
                <FieldError message={errors.FirstName?.message} />
              </div>

              {/* Last Name */}
              <div>
                <Label className="text-sm font-medium mb-1.5 block">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Doe"
                  {...register("LastName")}
                  aria-invalid={!!errors.LastName}
                  disabled={submitting}
                />
                <FieldError message={errors.LastName?.message} />
              </div>
            </div>

            {/* Email */}
            <div>
              <Label className="text-sm font-medium mb-1.5 block">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                placeholder="john.doe@example.com"
                {...register("Email")}
                aria-invalid={!!errors.Email}
                disabled={submitting}
              />
              <FieldError message={errors.Email?.message} />
            </div>

            {/* Phone */}
            <div>
              <Label className="text-sm font-medium mb-1.5 block">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                type="tel"
                placeholder="+1 (555) 123-4567"
                {...register("Phone")}
                aria-invalid={!!errors.Phone}
                disabled={submitting}
              />
              <FieldError message={errors.Phone?.message} />
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={submitting}
                className="bg-blue-gradient text-white hover:bg-blue-gradient/90 min-w-28"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Submitting...
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
