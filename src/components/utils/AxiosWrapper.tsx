'use client'
import { getAccessToken } from '@/lib/auth'
import { getRetailerViewAccountId } from '@/lib/retailer-view'
import { useEffect } from 'react'
import { Axios } from 'use-hook-api'

const AxiosWrapper = () => {
    useEffect(() => {
        Axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_URL
        Axios.defaults.timeout = 300000

        const token = getAccessToken();
        if (token) {
            Axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        }

        const interceptorId = Axios.interceptors.request.use((config) => {
            const currentToken = getAccessToken();
            if (currentToken) {
                config.headers = config.headers || {};
                config.headers['Authorization'] = `Bearer ${currentToken}`;
            }

            const retailerAccountId = getRetailerViewAccountId();
            if (retailerAccountId) {
                const url = config.url || '';
                const isRetailerReq =
                    url.includes('/retailer') ||
                    (typeof window !== 'undefined' && window.location.pathname.startsWith('/retailer'));

                if (isRetailerReq) {
                    config.headers = config.headers || {};
                    config.headers['X-Retailer-Account-Id'] = retailerAccountId;
                }
            }

            return config;
        });

        return () => {
            Axios.interceptors.request.eject(interceptorId);
        };
    }, [])

    return null
}

export default AxiosWrapper
