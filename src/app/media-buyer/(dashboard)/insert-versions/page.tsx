"use client";

import { useEffect, useState, useRef } from "react";
import { useApi } from "use-hook-api";
import { toast } from "react-toastify";
import {
  fetchInsertFormatsApi,
  fetchInsertVersionsApi,
  type InsertFormat,
  type InsertVersion,
} from "@/api/mediaBuyer";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { InsertFormatCards } from "@/components/media-buyer/insert-versions/InsertFormatCards";
import { InsertVersionsTable } from "@/components/media-buyer/insert-versions/InsertVersionsTable";
import { CreateInsertVersionModal } from "@/components/media-buyer/insert-versions/CreateInsertVersionModal";
import { EditInsertVersionModal } from "@/components/media-buyer/insert-versions/EditInsertVersionModal";
import { UploadArtworkModal } from "@/components/media-buyer/insert-versions/UploadArtworkModal";
import { UploadInkjetCsvModal } from "@/components/media-buyer/insert-versions/UploadInkjetCsvModal";
import { ViewArtworkModal } from "@/components/media-buyer/insert-versions/ViewArtworkModal";
import { extractErrorMessage } from "@/lib/apiError";

export default function MediaBuyerInsertVersionsPage() {
  const [formats, setFormats] = useState<InsertFormat[]>([]);
  const [versions, setVersions] = useState<InsertVersion[]>([]);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<InsertFormat | null>(null);
  const [editingVersion, setEditingVersion] = useState<InsertVersion | null>(null);
  const [artworkVersion, setArtworkVersion] = useState<InsertVersion | null>(null);
  const [inkjetVersion, setInkjetVersion] = useState<InsertVersion | null>(null);
  const [viewArtworkVersion, setViewArtworkVersion] = useState<InsertVersion | null>(null);

  // APIs
  const [callGetFormats, { loading: loadingFormats }] = useApi({
    both: false,
    errMsg: false,
  });

  const [callGetVersions, { loading: loadingVersions }] = useApi({
    both: false,
    errMsg: false,
  });

  const callGetFormatsRef = useRef(callGetFormats);
  callGetFormatsRef.current = callGetFormats;

  const callGetVersionsRef = useRef(callGetVersions);
  callGetVersionsRef.current = callGetVersions;

  const loadFormats = () => {
    callGetFormatsRef.current(
      fetchInsertFormatsApi(),
      (res: any) => {
        const list: InsertFormat[] = res?.data ?? res ?? [];
        if (Array.isArray(list)) {
          setFormats(list);
        }
      },
      (err: any) => {
        const msg = extractErrorMessage(err, "Failed to load insert formats.");
        toast.error(msg);
      }
    );
  };

  const loadVersions = () => {
    callGetVersionsRef.current(
      fetchInsertVersionsApi(),
      (res: any) => {
        const list: InsertVersion[] = res?.data ?? res ?? [];
        if (Array.isArray(list)) {
          setVersions(list);
        }
      },
      (err: any) => {
        const msg = extractErrorMessage(err, "Failed to load insert versions.");
        toast.error(msg);
      }
    );
  };

  useEffect(() => {
    loadFormats();
    loadVersions();
  }, []);

  const handleOpenCreate = (format: InsertFormat | null) => {
    setSelectedFormat(format);
    setCreateModalOpen(true);
  };

  const handleVersionCreated = (newVersion: InsertVersion) => {
    setVersions((prev) => [newVersion, ...prev.filter((v) => v.id !== newVersion.id)]);
    loadVersions();
  };

  const handleVersionUpdated = (updated: InsertVersion) => {
    setVersions((prev) =>
      prev.map((v) => (v.id === updated.id ? { ...v, ...updated } : v))
    );
    loadVersions();
  };

  const handleArtworkUploaded = (updated: InsertVersion) => {
    setVersions((prev) =>
      prev.map((v) =>
        v.id === updated.id ? { ...v, ...updated, artwork_uploaded: true } : v
      )
    );
    loadVersions();
  };

  const handleInkjetUploaded = (updated: InsertVersion) => {
    setVersions((prev) =>
      prev.map((v) =>
        v.id === updated.id
          ? {
              ...v,
              ...updated,
              inkjet_csv_uploaded: true,
            }
          : v
      )
    );
    loadVersions();
  };

  return (
    <ProtectedRoute requiredRole={["media_buyer_admin", "media_buyer_standard"]}>
      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Insert Formats Cards Grid */}
        <InsertFormatCards
          formats={formats}
          loading={loadingFormats}
          onCreateVersion={handleOpenCreate}
        />

        {/* Insert Versions Table */}
        <InsertVersionsTable
          versions={versions}
          loading={loadingVersions}
          onOpenCreate={() => handleOpenCreate(null)}
          onEditVersion={(v) => setEditingVersion(v)}
          onUploadArtwork={(v) => setArtworkVersion(v)}
          onUploadInkjetCsv={(v) => setInkjetVersion(v)}
          onViewArtwork={(v) => setViewArtworkVersion(v)}
        />

        {/* Create Modal */}
        <CreateInsertVersionModal
          formats={formats}
          initialFormat={selectedFormat}
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onSuccess={handleVersionCreated}
        />

        {/* Edit Modal */}
        <EditInsertVersionModal
          version={editingVersion}
          open={!!editingVersion}
          onOpenChange={(open) => !open && setEditingVersion(null)}
          onSuccess={handleVersionUpdated}
        />

        {/* Upload Artwork Modal */}
        <UploadArtworkModal
          version={artworkVersion}
          open={!!artworkVersion}
          onOpenChange={(open) => !open && setArtworkVersion(null)}
          onSuccess={handleArtworkUploaded}
        />

        {/* View Artwork Modal */}
        <ViewArtworkModal
          version={viewArtworkVersion}
          open={!!viewArtworkVersion}
          onOpenChange={(open) => !open && setViewArtworkVersion(null)}
          onReupload={() => {
            const v = viewArtworkVersion;
            setViewArtworkVersion(null);
            setArtworkVersion(v);
          }}
        />

        {/* Upload Inkjet CSV Modal */}
        <UploadInkjetCsvModal
          version={inkjetVersion}
          open={!!inkjetVersion}
          onOpenChange={(open) => !open && setInkjetVersion(null)}
          onSuccess={handleInkjetUploaded}
        />
      </main>
    </ProtectedRoute>
  );
}
