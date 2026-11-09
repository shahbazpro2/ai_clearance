"use client";

import { useState, useMemo } from "react";
import type { InsertVersion } from "@/api/mediaBuyer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Pencil,
  Upload,
  CheckCircle2,
  XCircle,
  Search,
  Plus,
  Layers,
  Eye,
} from "lucide-react";

interface InsertVersionsTableProps {
  versions: InsertVersion[];
  loading: boolean;
  onOpenCreate: () => void;
  onEditVersion: (version: InsertVersion) => void;
  onUploadArtwork: (version: InsertVersion) => void;
  onUploadInkjetCsv?: (version: InsertVersion) => void;
  onViewArtwork?: (version: InsertVersion) => void;
}

export function InsertVersionsTable({
  versions,
  loading,
  onOpenCreate,
  onEditVersion,
  onUploadArtwork,
  onViewArtwork,
}: InsertVersionsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredVersions = useMemo(() => {
    return versions.filter((item) => {
      const term = searchTerm.toLowerCase().trim();
      if (!term) return true;
      const matchesName = item.version_name.toLowerCase().includes(term);
      const matchesFormat = item.format?.name?.toLowerCase().includes(term);
      return matchesName || matchesFormat;
    });
  }, [versions, searchTerm]);

  const formatDate = (isoString?: string) => {
    if (!isoString) return "—";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-xs overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-900">Your Insert Versions</h3>
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {versions.length}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search versions..."
              className="pl-8 h-8 text-xs bg-white border-gray-300"
            />
          </div>

          <Button
            onClick={onOpenCreate}
            size="sm"
            className="h-8 bg-blue-gradient text-white hover:bg-blue-gradient/90 shadow-sm text-xs font-semibold whitespace-nowrap"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Create Version
          </Button>
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto w-full">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 whitespace-nowrap">Version Name</th>
              <th className="px-4 py-3 whitespace-nowrap">Format</th>
              <th className="px-4 py-3 whitespace-nowrap">Inkjet Enabled</th>
              <th className="px-4 py-3 whitespace-nowrap">Artwork Uploaded</th>
              <th className="px-4 py-3 whitespace-nowrap">Created At</th>
              <th className="px-4 py-3 whitespace-nowrap text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm text-gray-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <LoadingSpinner size="lg" />
                    <span>Loading insert versions...</span>
                  </div>
                </td>
              </tr>
            )}

            {!loading && filteredVersions.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm text-gray-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Layers className="h-8 w-8 text-gray-400" />
                    <p className="font-medium text-gray-700">
                      {searchTerm ? "No matching versions found" : "No insert versions created yet"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {searchTerm
                        ? "Try searching for a different keyword."
                        : "Click 'Create Version' to set up your first insert version."}
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {!loading &&
              filteredVersions.map((item) => {
                const isInkjet = Boolean(item.inkjet_enabled);
                const isArtwork = Boolean(item.artwork_uploaded);

                return (
                  <tr
                    key={item.id}
                    className="border-t hover:bg-gray-50/60 transition-colors"
                  >
                    {/* Version Name */}
                    <td className="px-4 py-3 align-middle font-medium text-gray-900 whitespace-nowrap">
                      {item.version_name}
                    </td>

                    {/* Format */}
                    <td className="px-4 py-3 align-middle text-gray-700 whitespace-nowrap">
                      {item.format?.name || "Standard Insert"}
                    </td>

                    {/* Inkjet Enabled Badge */}
                    <td className="px-4 py-3 align-middle whitespace-nowrap">
                      {isInkjet ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                          No
                        </span>
                      )}
                    </td>

                    {/* Artwork Uploaded Badge */}
                    <td className="px-4 py-3 align-middle whitespace-nowrap">
                      {isArtwork ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-800 border border-red-200">
                          <XCircle className="h-3.5 w-3.5 text-red-600" />
                          No
                        </span>
                      )}
                    </td>

                    {/* Created At */}
                    <td className="px-4 py-3 align-middle text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(item.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 align-middle text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2 justify-end flex-nowrap">
                        {/* Edit Version */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEditVersion(item)}
                          className="h-8 px-2.5 text-xs font-medium text-gray-700 hover:text-primary hover:bg-gray-50 border-gray-300 whitespace-nowrap transition-colors"
                          title="Edit version name & inkjet setting"
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1 text-gray-500" />
                          Edit
                        </Button>

                        {/* Artwork Action Button */}
                        {!isArtwork ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onUploadArtwork(item)}
                            className="h-8 px-2.5 text-xs font-medium text-gray-700 hover:text-primary hover:bg-gray-50 border-gray-300 whitespace-nowrap transition-colors"
                            title="Upload artwork PDF file"
                          >
                            <Upload className="h-3.5 w-3.5 mr-1 text-gray-500" />
                            Upload Artwork
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => (onViewArtwork ? onViewArtwork(item) : onUploadArtwork(item))}
                            className="h-8 px-2.5 text-xs font-medium text-gray-700 hover:text-primary hover:bg-gray-50 border-gray-300 whitespace-nowrap transition-colors"
                            title="View artwork details"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1 text-gray-500" />
                            View Artwork
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
