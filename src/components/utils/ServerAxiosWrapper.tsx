import { cookies } from 'next/headers'
import { Axios } from 'use-hook-api'

const ServerAxiosWrapper = async () => {
    Axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_URL
    const cookieStore = cookies()
    const accessToken = (await cookieStore).get('access_token')?.value
    console.log("🔑 Access token11:", accessToken);
    if (accessToken) {
        Axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
    }
    return null
}

export default ServerAxiosWrapper
