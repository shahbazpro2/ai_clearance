"use client";

import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AlertCircle } from "lucide-react";

interface StateCode {
  value: string;
  label: string;
}

interface DCFormFieldsProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  stateCodes: StateCode[];
  loadingStates: boolean;
  submitting: boolean;
  isAllocationValid: boolean;
  onAddNew?: () => void;
}

function FieldError({ message }: { message?: any }) {
  if (!message) return null;
  const msg = typeof message === "string" ? message : message?.message;
  if (!msg) return null;
  return (
    <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
      <AlertCircle className="h-3.5 w-3.5" />
      {msg}
    </div>
  );
}

export function DCFormFields({
  register,
  errors,
  watch,
  setValue,
  stateCodes,
  loadingStates,
  submitting,
  isAllocationValid,
  onAddNew,
}: DCFormFieldsProps) {
  return (
    <div className="space-y-5">
      {/* DC Name */}
      <div>
        <Label className="text-sm font-medium mb-1.5 block">
          Distribution Center Name <span className="text-red-500">*</span>
        </Label>
        <Input
          placeholder="e.g., Dallas DC"
          {...register("distribution_center_name")}
          disabled={submitting}
        />
        <FieldError message={errors.distribution_center_name?.message} />
      </div>

      {/* Allocation Percentage */}
      <div>
        <Label className="text-sm font-medium mb-1.5 block">
          Allocation Percentage <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Input
            type="number"
            min="0"
            max="100"
            placeholder="40"
            {...register("allocation_percentage")}
            disabled={submitting}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
        </div>
        <FieldError message={errors.allocation_percentage?.message} />
      </div>

      {/* Inventory Contact */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Inventory Contact</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium mb-1.5 block">
              First Name <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="John"
              {...register("inventory_contact.FirstName")}
              disabled={submitting}
            />
            <FieldError message={(errors.inventory_contact as any)?.FirstName?.message} />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">
              Last Name <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="Smith"
              {...register("inventory_contact.LastName")}
              disabled={submitting}
            />
            <FieldError message={(errors.inventory_contact as any)?.LastName?.message} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <Label className="text-sm font-medium mb-1.5 block">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              type="email"
              placeholder="john@example.com"
              {...register("inventory_contact.Email")}
              disabled={submitting}
            />
            <FieldError message={(errors.inventory_contact as any)?.Email?.message} />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">
              Phone <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="555-1234"
              {...register("inventory_contact.Phone")}
              disabled={submitting}
            />
            <FieldError message={(errors.inventory_contact as any)?.Phone?.message} />
          </div>
        </div>
      </div>

      {/* Shipping Info */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Shipping Information</h3>
        <div>
          <Label className="text-sm font-medium mb-1.5 block">
            Ship To Name <span className="text-red-500">*</span>
          </Label>
          <Input
            placeholder="Warehouse Name"
            {...register("ship_to_name")}
            disabled={submitting}
          />
          <FieldError message={errors.ship_to_name?.message} />
        </div>
        <div className="mt-4">
          <Label className="text-sm font-medium mb-1.5 block">
            Address <span className="text-red-500">*</span>
          </Label>
          <Input
            placeholder="123 Main St"
            {...register("shipping_address_1")}
            disabled={submitting}
          />
          <FieldError message={errors.shipping_address_1?.message} />
        </div>
        <div className="mt-4">
          <Label className="text-sm font-medium mb-1.5 block">
            Address Line 2
          </Label>
          <Input
            placeholder="Suite 100"
            {...register("shipping_address_2")}
            disabled={submitting}
          />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <Label className="text-sm font-medium mb-1.5 block">
              City <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="Dallas"
              {...register("city")}
              disabled={submitting}
            />
            <FieldError message={errors.city?.message} />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">
              State <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watch("state")}
              onValueChange={(val) => setValue("state", val)}
              disabled={submitting || loadingStates}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {stateCodes.map((state: StateCode) => (
                  <SelectItem key={state.value} value={state.value}>
                    {state.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={errors.state?.message} />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">
              ZIP Code <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="75001"
              {...register("zip_code")}
              disabled={submitting}
            />
            <FieldError message={errors.zip_code?.message} />
          </div>
        </div>
        <div className="mt-4">
          <Label className="text-sm font-medium mb-1.5 block">
            Shipping Instructions
          </Label>
          <Input
            placeholder="e.g., Leave at dock"
            {...register("shipping_instructions")}
            disabled={submitting}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t mt-6">
        <Button
          type="button"
          onClick={onAddNew}
          disabled={submitting}
          variant="outline"
          className="w-full"
        >
          + Add New Distribution Center
        </Button>
      </div>
    </div>
  );
}
