'use client'
import { isAuthenticated, setIsActive } from '@/lib/auth';
import { useMe } from '@/hooks/useMe';
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/routes';

const MeWrapper = ({ children }: { children: React.ReactNode }) => {
    const meData = useMe();
    const pathname = usePathname();
    const router = useRouter();
    const [gateTimedOut, setGateTimedOut] = useState(false);

    useEffect(() => {
        setIsActive(meData?.is_active);
    }, [meData]);

    useEffect(() => {
        if (pathname !== '/') return;
        if (!meData?.role) return;
        if (['admin', 'super_admin'].includes(meData.role)) {
            router.replace('/admin');
        }
    }, [meData, pathname, router]);

    useEffect(() => {
        //if medData.current_period_end is less than now, then setIsActive(false)
        //current_period_end = Wed, 05 Nov 2025 17:50:20 GMT

        if (!meData?.current_period_end) return;

        try {
            const currentDate = new Date();
            const currentPeriodEnd = new Date(meData?.current_period_end);

            // Check if date is valid
            if (isNaN(currentPeriodEnd.getTime())) {
                return;
            }

            if (currentPeriodEnd < currentDate) {
                setIsActive(false)
            }
        } catch (error) {
            // Silently handle invalid date
            return;
        }
    }, [meData, pathname]);

    const shouldGate =
        isAuthenticated() &&
        !ROUTES.AUTH.includes(pathname as any) &&
        !ROUTES.PUBLIC.includes(pathname as any);

    const shouldRedirectAdminFromRoot =
        pathname === '/' &&
        !!meData?.role &&
        ['admin', 'super_admin'].includes(meData.role);

    useEffect(() => {
        if (!shouldGate || meData) {
            setGateTimedOut(false);
            return;
        }
        setGateTimedOut(false);
        const timeoutId = window.setTimeout(() => {
            setGateTimedOut(true);
        }, 8000);
        return () => window.clearTimeout(timeoutId);
    }, [meData, shouldGate]);

    if (shouldRedirectAdminFromRoot) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (shouldGate && !meData && !gateTimedOut) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>
}

export default MeWrapper
