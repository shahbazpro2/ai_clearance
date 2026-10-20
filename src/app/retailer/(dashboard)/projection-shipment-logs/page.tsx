import { ProjectionShipmentLogsPage } from "@/components/retailer/ProjectionShipmentLogsPage";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Suspense } from "react";

export default function ProjectionShipmentLogsRoute() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-[50vh] items-center justify-center">
                    <LoadingSpinner size="lg" />
                </div>
            }
        >
            <ProjectionShipmentLogsPage />
        </Suspense>
    );
}
