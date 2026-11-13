import axios from 'axios'

// Determine base API URL with fallback
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

/**
 * Enterprise Axios Instance for BVB Admin Portal
 */
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

/**
 * Request Interceptor: Automatically attach Bearer JWT token from storage
 */
axiosInstance.interceptors.request.use(
  (config) => {
    try {
      // Check for standalone token first, or extract from serialized session
      let token =
        localStorage.getItem('bvb_admin_token') ||
        sessionStorage.getItem('bvb_admin_token')

      if (!token) {
        const rawSession =
          localStorage.getItem('bvb_admin_session') ||
          sessionStorage.getItem('bvb_admin_session')
        if (rawSession) {
          const parsed = JSON.parse(rawSession)
          token = parsed?.token
        }
      }

      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (err) {
      console.error('[Axios Request Interceptor] Error attaching token:', err)
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * Response Interceptor: Centralized error handling and session validation
 */
axiosInstance.interceptors.response.use(
  (response) => {
    // Return the response directly
    return response
  },
  (error) => {
    // Handle 401 Unauthorized (session expired or invalid token)
    if (error.response && error.response.status === 401) {
      const isLoginRequest = error.config?.url?.includes('admin-access') || error.config?.url?.includes('login')
      
      // Only purge session if this was a protected route call, not a failed login attempt
      if (!isLoginRequest) {
        console.warn('[Axios] Session invalid or expired. Purging stored credentials.')
        localStorage.removeItem('bvb_admin_session')
        localStorage.removeItem('bvb_admin_token')
        sessionStorage.removeItem('bvb_admin_session')
        sessionStorage.removeItem('bvb_admin_token')
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance

