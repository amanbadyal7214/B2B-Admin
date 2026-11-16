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
 * Product Category APIs
 */
export const getCategoriesApi = async () => {
  const response = await axiosInstance.get('/api/categories')
  return response.data
}

export const createCategoryApi = async (categoryData) => {
  const response = await axiosInstance.post('/api/categories', categoryData)
  return response.data
}

export const updateCategoryApi = async (id, categoryData) => {
  const response = await axiosInstance.put(`/api/categories/${id}`, categoryData)
  return response.data
}

export const deleteCategoryApi = async (id) => {
  const response = await axiosInstance.delete(`/api/categories/${id}`)
  return response.data
}

/**
 * Product Type APIs
 */
export const getProductTypesApi = async (params = {}) => {
  const response = await axiosInstance.get('/api/product-types', { params })
  return response.data
}

export const getProductTypeByIdApi = async (id) => {
  const response = await axiosInstance.get(`/api/product-types/${id}`)
  return response.data
}

export const createProductTypeApi = async (typeData) => {
  const response = await axiosInstance.post('/api/product-types', typeData)
  return response.data
}

export const updateProductTypeApi = async (id, typeData) => {
  const response = await axiosInstance.put(`/api/product-types/${id}`, typeData)
  return response.data
}

export const deleteProductTypeApi = async (id) => {
  const response = await axiosInstance.delete(`/api/product-types/${id}`)
  return response.data
}

/**
 * Product Size APIs
 */
export const getSizesApi = async (params = {}) => {
  const response = await axiosInstance.get('/api/sizes', { params })
  return response.data
}

export const getSizeByIdApi = async (id) => {
  const response = await axiosInstance.get(`/api/sizes/${id}`)
  return response.data
}

export const createSizeApi = async (sizeData) => {
  const response = await axiosInstance.post('/api/sizes', sizeData)
  return response.data
}

export const updateSizeApi = async (id, sizeData) => {
  const response = await axiosInstance.put(`/api/sizes/${id}`, sizeData)
  return response.data
}

export const deleteSizeApi = async (id) => {
  const response = await axiosInstance.delete(`/api/sizes/${id}`)
  return response.data
}

export const seedSizesApi = async () => {
  const response = await axiosInstance.post('/api/sizes/seed')
  return response.data
}

/**
 * Product Color APIs
 */
export const getColorsApi = async (params = {}) => {
  const response = await axiosInstance.get('/api/colors', { params })
  return response.data
}

export const getColorByIdApi = async (id) => {
  const response = await axiosInstance.get(`/api/colors/${id}`)
  return response.data
}

export const createColorApi = async (colorData) => {
  const response = await axiosInstance.post('/api/colors', colorData)
  return response.data
}

export const updateColorApi = async (id, colorData) => {
  const response = await axiosInstance.put(`/api/colors/${id}`, colorData)
  return response.data
}

export const deleteColorApi = async (id) => {
  const response = await axiosInstance.delete(`/api/colors/${id}`)
  return response.data
}

export const toggleColorStatusApi = async (id) => {
  const response = await axiosInstance.patch(`/api/colors/${id}/status`)
  return response.data
}

/**
 * Product Fit APIs
 */
export const getFitsApi = async (params = {}) => {
  const response = await axiosInstance.get('/api/fits', { params })
  return response.data
}

export const getFitByIdApi = async (id) => {
  const response = await axiosInstance.get(`/api/fits/${id}`)
  return response.data
}

export const createFitApi = async (fitData) => {
  const response = await axiosInstance.post('/api/fits', fitData)
  return response.data
}

export const updateFitApi = async (id, fitData) => {
  const response = await axiosInstance.put(`/api/fits/${id}`, fitData)
  return response.data
}

export const deleteFitApi = async (id) => {
  const response = await axiosInstance.delete(`/api/fits/${id}`)
  return response.data
}

export const toggleFitStatusApi = async (id) => {
  const response = await axiosInstance.patch(`/api/fits/${id}/status`)
  return response.data
}

/**
 * Product Fabric & GSM APIs
 */
export const getFabricsApi = async (params = {}) => {
  const response = await axiosInstance.get('/api/fabrics', { params })
  return response.data
}

export const getFabricByIdApi = async (id) => {
  const response = await axiosInstance.get(`/api/fabrics/${id}`)
  return response.data
}

export const createFabricApi = async (fabricData) => {
  const response = await axiosInstance.post('/api/fabrics', fabricData)
  return response.data
}

export const updateFabricApi = async (id, fabricData) => {
  const response = await axiosInstance.put(`/api/fabrics/${id}`, fabricData)
  return response.data
}

export const deleteFabricApi = async (id) => {
  const response = await axiosInstance.delete(`/api/fabrics/${id}`)
  return response.data
}

export const toggleFabricStatusApi = async (id) => {
  const response = await axiosInstance.patch(`/api/fabrics/${id}/status`)
  return response.data
}

/**
 * Product MOQ & Pack Type APIs
 */
export const getMoqsApi = async (params = {}) => {
  const response = await axiosInstance.get('/api/moq-types', { params })
  return response.data
}

export const getMoqByIdApi = async (id) => {
  const response = await axiosInstance.get(`/api/moq-types/${id}`)
  return response.data
}

export const createMoqApi = async (moqData) => {
  const response = await axiosInstance.post('/api/moq-types', moqData)
  return response.data
}

export const updateMoqApi = async (id, moqData) => {
  const response = await axiosInstance.put(`/api/moq-types/${id}`, moqData)
  return response.data
}

export const deleteMoqApi = async (id) => {
  const response = await axiosInstance.delete(`/api/moq-types/${id}`)
  return response.data
}

export const toggleMoqStatusApi = async (id) => {
  const response = await axiosInstance.patch(`/api/moq-types/${id}/status`)
  return response.data
}

/**
 * Wholesale Product Catalog APIs
 */
export const getProductsApi = async (params = {}) => {
  const response = await axiosInstance.get('/api/products', { params })
  return response.data
}

export const getProductByIdApi = async (id) => {
  const response = await axiosInstance.get(`/api/products/${encodeURIComponent(id)}`)
  return response.data
}

export const createProductApi = async (productData) => {
  const isFormData = typeof FormData !== 'undefined' && productData instanceof FormData
  const response = await axiosInstance.post('/api/products', productData, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  })
  return response.data
}

export const updateProductApi = async (id, productData) => {
  const isFormData = typeof FormData !== 'undefined' && productData instanceof FormData
  const response = await axiosInstance.put(`/api/products/${encodeURIComponent(id)}`, productData, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  })
  return response.data
}

export const deleteProductApi = async (id) => {
  const response = await axiosInstance.delete(`/api/products/${encodeURIComponent(id)}`)
  return response.data
}

export const seedProductsApi = async (data = {}) => {
  const response = await axiosInstance.post('/api/products/seed', data)
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

