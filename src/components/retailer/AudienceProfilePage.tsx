"use client";

import { useEffect, useState } from "react";
import { useApi } from "use-hook-api";
import { getAccountAudiencesApi } from "@/api/retailer";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Users, RefreshCw, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { AudienceProfileDrawer } from "@/components/retailer/AudienceProfileDrawer";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AudienceSummary {
    audience_id: string;
    name: string;
    status: string;
    updated_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateString: string) {
    try {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    } catch {
        return dateString;
    }
}

function capitalizeStatus(status: string) {
    if (!status) return "";
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

// ─── Audience Card ────────────────────────────────────────────────────────────

interface AudienceCardProps {
    audience: AudienceSummary;
    isSelected: boolean;
    onViewProfile: (audience: AudienceSummary) => void;
}

function AudienceCard({ audience, isSelected, onViewProfile }: AudienceCardProps) {
    const isActive = audience.status === "active";

    return (
        <button
            type="button"
            onClick={() => onViewProfile(audience)}
            className={cn(
                "w-full text-left bg-white rounded-xl border shadow-sm p-5 flex flex-col gap-4",
                "hover:shadow-md hover:border-primary/40 transition-all duration-150 group",
                isSelected && "border-primary ring-1 ring-primary/30 shadow-md"
            )}
        >
            {/* Avatar + status */}
            <div className="flex items-center justify-between gap-2">
                <div
                    className={cn(
                        "h-11 w-11 rounded-full flex items-center justify-center text-base font-bold shrink-0",
                        isActive ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500"
                    )}
                >
                    {audience.name.charAt(0).toUpperCase()}
                </div>
                <Badge
                    className={cn(
                        "text-[11px] px-2 py-0 h-5 border",
                        isActive
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-gray-100 text-gray-500 border-gray-200"
                    )}
                >
                    {capitalizeStatus(audience.status)}
                </Badge>
            </div>

            {/* Name + date */}
            <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-gray-900 truncate">
                    {audience.name}
                </span>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar className="h-3 w-3 shrink-0" />
                    <span>Updated {formatDate(audience.updated_at)}</span>
                </div>
            </div>

            {/* CTA */}
            <div
                className={cn(
                    "mt-auto pt-3 text-xs font-medium flex items-center gap-1 transition-colors",
                    isSelected ? "text-primary" : "text-gray-400 group-hover:text-primary"
                )}
            >
                View Profile
                <ChevronRight className="h-3.5 w-3.5" />
            </div>
        </button>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AudienceProfilePage() {
    const [audiences, setAudiences] = useState<AudienceSummary[]>([]);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedAudience, setSelectedAudience] = useState<AudienceSummary | null>(null);

    const [callFetch, { loading, error }] = useApi({ errMsg: true });

    const fetchAudiences = () => {
        callFetch(getAccountAudiencesApi(), (res: any) => {
            const list = res?.audiences ?? res?.data?.audiences ?? [];
            setAudiences(list);
        });
    };

    useEffect(() => {
        fetchAudiences();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleViewProfile = (audience: AudienceSummary) => {
        setSelectedAudience(audience);
        setDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        setDrawerOpen(false);
    };

    return (
        <main className="container mx-auto px-4 py-8">
            {/* Page header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Audience Profile</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Select an audience to view and update its demographic profile.
                </p>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-500 text-sm">
                    <LoadingSpinner size="lg" />
                    Loading audiences…
                </div>
            )}

            {/* Error */}
            {!loading && !!error && (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <p className="text-sm text-red-600">Failed to load audiences.</p>
                    <Button variant="outline" size="sm" onClick={fetchAudiences}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                    </Button>
                </div>
            )}

            {/* Empty state */}
            {!loading && !error && audiences.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
                    <div className="rounded-full bg-gray-100 p-4">
                        <Users className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">
                            No audiences found
                        </h2>
                        <p className="text-sm text-gray-500 max-w-sm">
                            No audiences are linked to this account yet.
                        </p>
                    </div>
                </div>
            )}

            {/* Audience grid */}
            {!loading && !error && audiences.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {audiences.map((audience) => (
                        <AudienceCard
                            key={audience.audience_id}
                            audience={audience}
                            isSelected={
                                drawerOpen &&
                                selectedAudience?.audience_id === audience.audience_id
                            }
                            onViewProfile={handleViewProfile}
                        />
                    ))}
                </div>
            )}

            {/* Profile drawer */}
            <AudienceProfileDrawer
                open={drawerOpen}
                audienceId={selectedAudience?.audience_id ?? null}
                audienceName={selectedAudience?.name ?? null}
                onClose={handleCloseDrawer}
            />
        </main>
    );
}
