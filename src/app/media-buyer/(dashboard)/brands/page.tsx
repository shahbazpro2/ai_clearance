"use client";

import { useEffect, useState, useRef } from "react";
import { useApi } from "use-hook-api";
import { toast } from "react-toastify";
import {
  fetchSubmittedBrandsApi,
  type BrandSubmission,
} from "@/api/mediaBuyer";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AddBrandSection } from "@/components/media-buyer/brands/AddBrandSection";
import { BrandListTable } from "@/components/media-buyer/brands/BrandListTable";
import { EditBrandModal } from "@/components/media-buyer/brands/EditBrandModal";
import { DeleteBrandDialog } from "@/components/media-buyer/brands/DeleteBrandDialog";
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";

export default function MediaBuyerBrandsPage() {
  const [brands, setBrands] = useState<BrandSubmission[]>([]);
  const [editingBrand, setEditingBrand] = useState<BrandSubmission | null>(null);
  const [deletingBrand, setDeletingBrand] = useState<BrandSubmission | null>(null);

  const [callGetBrands, { data, loading }] = useApi({
    both: false,
    errMsg: false,
  });

  const callGetBrandsRef = useRef(callGetBrands);
  callGetBrandsRef.current = callGetBrands;

  const loadBrands = () => {
    callGetBrandsRef.current(
      fetchSubmittedBrandsApi(),
      (res: any) => {
        const list: BrandSubmission[] = res?.data ?? res ?? [];
        if (Array.isArray(list)) {
          setBrands(list);
        }
      }
    );
  };

  useEffect(() => {
    loadBrands();
  }, []);

  useEffect(() => {
    if (data) {
      const list: BrandSubmission[] = data?.data ?? data ?? [];
      if (Array.isArray(list)) {
        setBrands(list);
      }
    }
  }, [data]);

  const handleBrandsAdded = (newBrands: BrandSubmission[]) => {
    if (!Array.isArray(newBrands) || newBrands.length === 0) {
      loadBrands();
      return;
    }

    setBrands((prev) => {
      const existingMap = new Map(prev.map((b) => [b.brand_submission_id, b]));
      const existingDomainMap = new Map(
        prev.map((b) => [b.domain.toLowerCase(), b.brand_submission_id])
      );

      newBrands.forEach((item) => {
        const domainKey = item.domain.toLowerCase();
        if (existingDomainMap.has(domainKey)) {
          const prevId = existingDomainMap.get(domainKey)!;
          existingMap.delete(prevId);
        }
        existingMap.set(item.brand_submission_id, item);
      });

      return Array.from(existingMap.values());
    });

    loadBrands();
  };

  const handleBrandUpdated = (updatedBrand: BrandSubmission) => {
    setBrands((prev) =>
      prev.map((b) =>
        b.brand_submission_id === updatedBrand.brand_submission_id
          ? updatedBrand
          : b
      )
    );
    loadBrands();
  };

  const handleBrandDeleted = (brandSubmissionId: string) => {
    setBrands((prev) =>
      prev.filter((b) => b.brand_submission_id !== brandSubmissionId)
    );
  };

  return (
    <ProtectedRoute requiredRole={["media_buyer_admin", "media_buyer_standard"]}>
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Brand Setup</h1>
            <p className="text-sm text-gray-500 mt-1">
              Add and manage the brands you want to use for campaign creation.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={loadBrands}
            disabled={loading}
            className="flex items-center gap-2 self-start sm:self-auto"
          >
            <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Add Brand Section */}
        <AddBrandSection onBrandsAdded={handleBrandsAdded} />

        {/* Brand List Section */}
        <BrandListTable
          brands={brands}
          loading={loading}
          onEditBrand={(brand) => setEditingBrand(brand)}
          onDeleteBrand={(brand) => setDeletingBrand(brand)}
        />

        {/* Edit Modal */}
        <EditBrandModal
          brand={editingBrand}
          open={!!editingBrand}
          onOpenChange={(open) => !open && setEditingBrand(null)}
          onSuccess={handleBrandUpdated}
        />

        {/* Delete Dialog */}
        <DeleteBrandDialog
          brand={deletingBrand}
          open={!!deletingBrand}
          onOpenChange={(open) => !open && setDeletingBrand(null)}
          onSuccess={handleBrandDeleted}
        />
      </main>
    </ProtectedRoute>
  );
}
