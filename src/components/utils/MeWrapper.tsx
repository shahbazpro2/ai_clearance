'use client'
import { setIsActive } from '@/lib/auth';
import { useMe } from '@/hooks/useMe';
import { useEffect } from 'react'
import { usePathname } from 'next/navigation';

const MeWrapper = () => {
    const meData = useMe();
    const pathname = usePathname();

    useEffect(() => {
        setIsActive(meData?.is_active);
    }, [meData]);

    useEffect(() => {
        //if medData.current_period_end is less than now, then setIsActive(false)
        //current_period_end = Wed, 05 Nov 2025 17:50:20 GMT

        if (!meData?.current_period_end) return;

        const currentDate = new Date();
        const currentPeriodEnd = new Date(meData?.current_period_end);

        if (currentPeriodEnd < currentDate) {
            setIsActive(false)
        }
    }, [meData, pathname]);

    return null
}

export default MeWrapper
