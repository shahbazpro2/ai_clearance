import { cookies } from 'next/headers'
import { Axios } from 'use-hook-api'

const ServerAxiosWrapper = async () => {
    Axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_URL
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value
    const retailerAccountId = cookieStore.get('retailer_view_account_id')?.value

    if (accessToken) {
        Axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
    }
    if (retailerAccountId) {
        Axios.defaults.headers.common['X-Retailer-Account-Id'] = retailerAccountId
    }
    return null
}

export default ServerAxiosWrapper
