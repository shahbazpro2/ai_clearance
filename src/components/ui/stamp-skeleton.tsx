import { Skeleton } from "./loading-pulse";

interface StampSkeletonProps {
    count?: number;
    className?: string;
}

export function StampSkeleton({ count = 8, className }: StampSkeletonProps) {
    return (
        <div className={className}>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                {Array.from({ length: count }).map((_, index) => (
                    <div
                        key={index}
                        className="overflow-hidden rounded-lg border bg-white shadow-sm"
                    >
                        <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse">
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
