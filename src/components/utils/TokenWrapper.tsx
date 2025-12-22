'use client'
import { clearAuthTokens } from '@/lib/auth';
import { jwtDecode } from 'jwt-decode';
import { usePathname } from 'next/navigation';
import React, { useEffect } from 'react';
import { responseApi } from 'use-hook-api';

const API_URL = process.env.NEXT_PUBLIC_API_URL;


const TokenWrapper: React.FC = () => {
    const pathname = usePathname()


    useEffect(() => {
        const checkAndRefresh = async () => {
            if (['/login', '/signup', '/verify-otp'].includes(pathname)) {
                return;
            }
            const access = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];
            const refresh = document.cookie.split('; ').find(row => row.startsWith('refresh_token='))?.split('=')[1];
            // Check if refresh token is missing or expired

            const now = Math.floor(Date.now() / 1000);
            /*        const refreshDecoded: any = refresh ? jwtDecode(refresh) : null;
                   const refreshExp = refreshDecoded?.exp;
                   if (!refreshExp || refreshExp < now) {
                       document.cookie = `access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                       document.cookie = `refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                       window.location.href = '/login';
                       return;
                   }
                   console.log('refresh', refreshDecoded.exp < now, refreshDecoded.exp, now) */
            if (access) {
                const decoded: any = jwtDecode(access);
                const exp = decoded.exp;
                if (exp - now < 30) {
                    const res = await responseApi(
                        `${API_URL}/auth/token`,
                        'post',
                        {
                            "grant_type": "refresh_token",
                            refresh_token: refresh,
                        },
                    )();

                    if (!res.error) {
                        if (res.data?.access_token)
                            document.cookie = `access_token=${res.data.access_token}`;
                        if (res.data.refresh_token) {
                            document.cookie = `refresh_token=${res.data.refresh_token}`;
                        }
                    }
                    else {
                        //clear all cookies
                        clearAuthTokens();
                        window.location.href = '/login';
                    }
                }
            }
        };
        // Check immediately on mount
        checkAndRefresh();
        // Check every 10 seconds
        const interval = setInterval(checkAndRefresh, 1000);
        return () => { clearInterval(interval) };
    }, [pathname]);

    return <></>;
};

export default TokenWrapper;
