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
 * Serviceable Pincodes & Delivery Network APIs
 */
export const getPincodesApi = async (params = {}) => {
  const response = await axiosInstance.get('/api/pincodes', { params })
  return response.data
}

export const createPincodeApi = async (pincodeData) => {
  const response = await axiosInstance.post('/api/pincodes', pincodeData)
  return response.data
}

export const bulkCreatePincodesApi = async (bulkData) => {
  const response = await axiosInstance.post('/api/pincodes/bulk', bulkData)
  return response.data
}

export const updatePincodeApi = async (id, pincodeData) => {
  const response = await axiosInstance.put(`/api/pincodes/${encodeURIComponent(id)}`, pincodeData)
  return response.data
}

export const togglePincodeStatusApi = async (id) => {
  const response = await axiosInstance.patch(`/api/pincodes/${encodeURIComponent(id)}/toggle`)
  return response.data
}

export const deletePincodeApi = async (id) => {
  const response = await axiosInstance.delete(`/api/pincodes/${encodeURIComponent(id)}`)
  return response.data
}

export const checkPincodeApi = async (pincode) => {
  const response = await axiosInstance.get(`/api/pincodes/check/${encodeURIComponent(pincode)}`)
  return response.data
}

export const seedPincodesApi = async () => {
  const response = await axiosInstance.post('/api/pincodes/seed')
  return response.data
}

/**
 * Wholesale Orders Management APIs
 */
export const getAdminOrdersApi = async (params = {}) => {
  const response = await axiosInstance.get('/api/orders/admin', { params })
  return response.data
}

export const getAdminOrderByIdApi = async (orderId) => {
  const response = await axiosInstance.get(`/api/orders/admin/${encodeURIComponent(orderId)}`)
  return response.data
}

export const updateAdminOrderStatusApi = async (orderId, updateData) => {
  const response = await axiosInstance.patch(`/api/orders/admin/${encodeURIComponent(orderId)}/status`, updateData)
  return response.data
}

export const partialCancelOrderItemApi = async (orderId, payload) => {
  const response = await axiosInstance.post(
    `/api/orders/admin/${encodeURIComponent(orderId)}/partial-cancel`,
    payload
  )
  return response.data
}

export const processOrderReturnApi = async (orderId, payload) => {
  const response = await axiosInstance.post(
    `/api/orders/admin/${encodeURIComponent(orderId)}/return`,
    payload
  )
  return response.data
}

/**
 * SKU Inventory Management, Stock Locks, Audit Movements & Multi-Warehouse APIs
 */
export const getInventoryListApi = async (params = {}) => {
  const response = await axiosInstance.get('/api/inventory', { params })
  return response.data
}

export const getSkuInventoryDetailApi = async (skuId) => {
  const response = await axiosInstance.get(`/api/inventory/sku/${encodeURIComponent(skuId)}`)
  return response.data
}

export const getLowStockAlertsApi = async (params = {}) => {
  const response = await axiosInstance.get('/api/inventory/alerts/low-stock', { params })
  return response.data
}

export const getStockMovementsApi = async (params = {}) => {
  const response = await axiosInstance.get('/api/inventory/movements', { params })
  return response.data
}

export const getStockLocksApi = async (params = {}) => {
  const response = await axiosInstance.get('/api/inventory/locks', { params })
  return response.data
}

export const releaseExpiredLocksApi = async () => {
  const response = await axiosInstance.post('/api/inventory/locks/release-expired')
  return response.data
}

export const singleStockInwardApi = async (payload) => {
  const response = await axiosInstance.post('/api/inventory/inward', payload)
  return response.data
}

export const bulkStockInwardApi = async (formDataOrPayload) => {
  const isFormData = typeof FormData !== 'undefined' && formDataOrPayload instanceof FormData
  const response = await axiosInstance.post('/api/inventory/inward/bulk', formDataOrPayload, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  })
  return response.data
}

export const downloadInwardTemplateApi = async () => {
  const response = await axiosInstance.get('/api/inventory/inward/template', {
    responseType: 'blob',
  })
  return response.data
}

export const adjustStockApi = async (payload) => {
  const response = await axiosInstance.post('/api/inventory/adjust', payload)
  return response.data
}

export const updateReorderLevelApi = async (inventoryId, payload) => {
  const response = await axiosInstance.patch(`/api/inventory/${encodeURIComponent(inventoryId)}/reorder-level`, payload)
  return response.data
}

export const processInventoryReturnApi = async (payload) => {
  const response = await axiosInstance.post('/api/inventory/return', payload)
  return response.data
}

export const transferWarehouseStockApi = async (payload) => {
  const response = await axiosInstance.post('/api/inventory/transfer', payload)
  return response.data
}

export const syncCatalogInventoryApi = async () => {
  const response = await axiosInstance.post('/api/inventory/sync-products')
  return response.data
}

export const getWarehousesApi = async () => {
  const response = await axiosInstance.get('/api/inventory/warehouses')
  return response.data
}

export const createWarehouseApi = async (payload) => {
  const response = await axiosInstance.post('/api/inventory/warehouses', payload)
  return response.data
}

export const updateWarehouseApi = async (id, payload) => {
  const response = await axiosInstance.put(`/api/inventory/warehouses/${encodeURIComponent(id)}`, payload)
  return response.data
}

export const deleteWarehouseApi = async (id) => {
  const response = await axiosInstance.delete(`/api/inventory/warehouses/${encodeURIComponent(id)}`)
  return response.data
}

/**
 * Retailer Management APIs
 */
export const getAdminRetailersApi = async (params = {}) => {
  const response = await axiosInstance.get('/api/retailers', { params })
  return response.data
}

export const getAdminRetailerByIdApi = async (id) => {
  const response = await axiosInstance.get(`/api/retailers/${encodeURIComponent(id)}`)
  return response.data
}

export const updateRetailerStatusApi = async (id, payload) => {
  const response = await axiosInstance.patch(`/api/retailers/${encodeURIComponent(id)}/status`, payload)
  return response.data
}

export const verifyRetailerApi = async (id, payload) => {
  const response = await axiosInstance.patch(`/api/retailers/${encodeURIComponent(id)}/verify`, payload)
  return response.data
}

export const updateRetailerSampleKitApi = async (id, payload) => {
  const response = await axiosInstance.patch(`/api/retailers/${encodeURIComponent(id)}/sample-kit`, payload)
  return response.data
}

export const deleteRetailerApi = async (id) => {
  const response = await axiosInstance.delete(`/api/retailers/${encodeURIComponent(id)}`)
  return response.data
}

/**
 * GST Tax Invoices & Credit Notes Management
 */
export const getAdminInvoicesApi = async (params = {}) => {
  const response = await axiosInstance.get('/api/invoices/admin/all', { params })
  return response.data
}

export const generateInvoiceApi = async (payload) => {
  const response = await axiosInstance.post('/api/invoices/admin/generate', payload)
  return response.data
}

export const getInvoiceByOrderIdApi = async (orderId) => {
  const response = await axiosInstance.get(`/api/invoices/order/${orderId}`)
  return response.data
}

export const getInvoiceByIdApi = async (id) => {
  const response = await axiosInstance.get(`/api/invoices/${id}`)
  return response.data
}

export const issueCreditNoteApi = async (invoiceId, payload = {}) => {
  const response = await axiosInstance.post(`/api/invoices/admin/${invoiceId}/credit-note`, payload)
  return response.data
}

export const updateInvoiceStatusApi = async (invoiceId, payload) => {
  const response = await axiosInstance.patch(`/api/invoices/admin/${invoiceId}/status`, payload)
  return response.data
}

export const getGstReportApi = async (params = {}) => {
  const response = await axiosInstance.get('/api/invoices/admin/gst-report', { params })
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

