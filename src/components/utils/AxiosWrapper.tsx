'use client'
import { getAccessToken } from '@/lib/auth'
import { useEffect } from 'react'
import { Axios } from 'use-hook-api'

const AxiosWrapper = () => {
    useEffect(() => {
        Axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_URL
        Axios.defaults.timeout = 300000
        if (getAccessToken()) {
            Axios.defaults.headers.common['Authorization'] = `Bearer ${getAccessToken()}`
        }
    }, [])
    /*    Axios.defaults.withCredentials = true */
    return null
}

export default AxiosWrapper
