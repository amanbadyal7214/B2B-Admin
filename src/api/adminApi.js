import axiosInstance from './axiosInstance'

/**
 * Admin Access API (Login)
 * POST /api/admin-access
 * @param {Object} credentials - { email, password, rememberMe }
 */
export const adminAccessApi = async ({ email, password, rememberMe = true }) => {
  const response = await axiosInstance.post('/api/admin-access', {
    email,
    password,
    rememberMe,
  })
  return response.data
}

/**
 * Fetch Current Administrator Profile
 * GET /api/admin/profile
 */
export const getAdminProfileApi = async () => {
  const response = await axiosInstance.get('/api/admin/profile')
  return response.data
}

/**
 * Provision New Administrator Account (Super Admin only)
 * POST /api/admin/create
 * @param {Object} adminData - { name, email, password, role, clearance, badge }
 */
export const createAdminApi = async (adminData) => {
  const response = await axiosInstance.post('/api/admin/create', adminData)
  return response.data
}

/**
 * Trigger Auto-seed for Default Executive Accounts
 * POST /api/admin/seed
 */
export const seedAdminsApi = async () => {
  const response = await axiosInstance.post('/api/admin/seed')
  return response.data
}

/**
 * Administrative Session Logout helper
 */
export const clearAdminSession = () => {
  try {
    localStorage.removeItem('bvb_admin_session')
    localStorage.removeItem('bvb_admin_token')
    sessionStorage.removeItem('bvb_admin_session')
    sessionStorage.removeItem('bvb_admin_token')
  } catch (err) {
    console.error('Error clearing session:', err)
  }
}

