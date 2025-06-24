import { Api } from "@/__generated__/api"
import { toast } from "sonner"

export const apiClient = new Api({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
    securityWorker: (accessToken: string | null) => {
        if (accessToken) {
            return {
                headers: {
                    Authorization: accessToken ? `Bearer ${accessToken}` : '',
                },
            }
        } else {
            return {}
        }
    },
})

apiClient.instance.interceptors.response.use(
    (res) => res,
    (error) => {
        // Check if the request had the no-error-display header
        const noErrorDisplay = error.config?.headers?.['no-error-display']
        
        if (!noErrorDisplay && error.response?.data && error.response?.data?.message) {
            if (typeof error.response?.data?.message === 'object') {
                for (const key in error.response?.data?.message) {
                    toast.error(error.response?.data?.message[key], {
                        position: 'top-center',
                        dismissible: true,
                    })
                }
            } else {
                toast.error(error.response?.data?.message, {
                    position: 'top-center',
                    dismissible: true,
                })
            }
        }
        // if (error.response?.status === 403) {
        //     localStorage.removeItem('token')
        //     authApi.defaults.headers.common['Authorization'] = ''
        // }
        return Promise.reject(error)
    }
)

// Initialize with stored token if available
if (typeof localStorage !== 'undefined') {
    const token = localStorage.getItem('jwt')
    if (token) {
        apiClient.setSecurityData(token)
    }
}

export const apiSetToken = (token: string) => {
    localStorage.setItem('jwt', token)
    apiClient.setSecurityData(token)
}

export const apiClearToken = () => {
    localStorage.removeItem('jwt')
    apiClient.setSecurityData(null)
}
