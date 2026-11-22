import { useState, useEffect, useMemo, useRef, Fragment } from 'react'
import {
  getProductsApi,
  createProductApi,
  updateProductApi,
  deleteProductApi,
  seedProductsApi,
  getCategoriesApi,
  getProductTypesApi,
  getSizesApi,
  getColorsApi,
  getFitsApi,
  getFabricsApi,
  getMoqsApi,
} from '../api'

// Client-side image compressor: scales high-res camera photos down to web-optimized dimensions
const compressImageFile = (file, maxDim = 1200, quality = 0.82) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL(file.type || 'image/jpeg', quality))
      }
      img.onerror = () => resolve(e.target.result)
      img.src = e.target.result
    }
    reader.onerror = () => resolve('')
    reader.readAsDataURL(file)
  })
}

// 5-Angle Editorial Photo Slots for Myntra/Flipkart Style-Color-SKU Architecture
const ANGLE_SLOTS = [
  { key: 'front', label: 'Front View', badge: 'FRONT', badgeColor: 'bg-[#121214] text-[#FAD79F]' },
  { key: 'back', label: 'Back Silhouette', badge: 'BACK', badgeColor: 'bg-[#2E2820] text-[#E8DCC9]' },
  { key: 'side', label: 'Side Profile', badge: 'SIDE', badgeColor: 'bg-[#3A3226] text-[#E8DCC9]' },
  { key: 'closeup', label: 'Close-Up Detail', badge: 'CLOSE-UP', badgeColor: 'bg-[#4A3F30] text-[#F3E7D3]' },
  { key: 'onModel', label: 'On Model View', badge: 'ON MODEL', badgeColor: 'bg-[#121214] text-[#E3BA70]' },
]

export const formatSkuCode = (baseSku, colorName, size) => {
  const cleanBase = (baseSku || 'BVB-STYLE').trim().toUpperCase()
  const colCode = (colorName || 'COL').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3) || 'COL'
  const szCode = (size || '').trim().toUpperCase()
  return `${cleanBase}-${colCode}-${szCode}`
}

export const buildDefaultSkusForColor = (baseSku, colorName, sizeListInput) => {
  let sizeArr = []
  if (Array.isArray(sizeListInput)) {
    sizeArr = sizeListInput.filter(Boolean)
  } else if (typeof sizeListInput === 'string' && sizeListInput.trim()) {
    sizeArr = sizeListInput.split(',').map((s) => s.trim()).filter(Boolean)
  }
  if (sizeArr.length === 0) {
    sizeArr = ['S', 'M', 'L', 'XL', 'XXL']
  }
  return sizeArr.map((sz) => ({
    sku: formatSkuCode(baseSku, colorName, sz),
    size: sz,
    stock: 25,
    status: 'In Stock',
  }))
}

// Fallback lists if master database collections are freshly seeded
const FALLBACK_CATEGORIES = [
  { slug: 'tees', name: 'Tees' },
  { slug: 'shirts', name: 'Shirts' },
  { slug: 'hoodies', name: 'Hoodies' },
  { slug: 'bottomwear', name: 'Bottomwear' },
  { slug: 'packs', name: 'Packs & Sets' },
]

const FALLBACK_PRODUCT_TYPES = [
  { name: 'Topwear' },
  { name: 'Bottomwear' },
  { name: 'Packs & Co-ords' },
  { name: 'Outerwear' },
]

const FALLBACK_FITS = [
  { name: 'Oversized' },
  { name: 'Relaxed' },
  { name: 'Regular' },
  { name: 'Slim' },
  { name: 'Boxy Atelier' },
]

const FALLBACK_FABRICS = [
  { name: 'Combed Jersey', gsm: '280 GSM', material: '100% Cotton' },
  { name: 'Heavyweight French Terry', gsm: '420 GSM', material: '100% Cotton' },
  { name: 'Structured Twill', gsm: '320 GSM', material: 'Cotton Spandex' },
  { name: 'Compact Pima Jersey', gsm: '220 GSM', material: 'Pima Cotton' },
  { name: 'Brushed Fleece', gsm: '360 GSM', material: 'Cotton Poly' },
]

const FALLBACK_MOQS = [
  { name: 'Editable MOQ', hint: 'Editable MOQ' },
  { name: 'Low MOQ (25 pcs)', hint: '25 pcs' },
  { name: 'Carton Pack (50 pcs)', hint: '50 pcs' },
  { name: 'Bulk Production (100+ pcs)', hint: '100+ pcs' },
]

const FALLBACK_COLORS = [
  { name: 'Obsidian Black', hexCode: '#1F2422', code: 'OBS' },
  { name: 'Sage Moss', hexCode: '#889281', code: 'SGE' },
  { name: 'Warm Ivory', hexCode: '#ECEAE3', code: 'IVR' },
  { name: 'Clay Taupe', hexCode: '#B39E8A', code: 'TPE' },
  { name: 'Slate Charcoal', hexCode: '#3A3F45', code: 'CHR' },
  { name: 'Deep Navy', hexCode: '#1E293B', code: 'NVY' },
  { name: 'Burnt Ochre', hexCode: '#B45309', code: 'OCH' },
]

const FALLBACK_ALPHA_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
const FALLBACK_NUMERIC_SIZES = ['28', '30', '32', '34', '36', '38']

export default function ProductManagementView({ currentUser }) {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL')
  const [placementFilter, setPlacementFilter] = useState('ALL')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Dynamic Master Collections State (from MongoDB Models)
  const [masterCategories, setMasterCategories] = useState([])
  const [masterProductTypes, setMasterProductTypes] = useState([])
  const [masterSizes, setMasterSizes] = useState([])
  const [masterColors, setMasterColors] = useState([])
  const [masterFits, setMasterFits] = useState([])
  const [masterFabrics, setMasterFabrics] = useState([])
  const [masterMoqs, setMasterMoqs] = useState([])
  const [isLoadingMasters, setIsLoadingMasters] = useState(false)
  const [customSizeInput, setCustomSizeInput] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalActiveTab, setModalActiveTab] = useState('style') // 'style' | 'variants' | 'skus' | 'copy'
  const [modalColorIdx, setModalColorIdx] = useState(0)
  const [expandedRowId, setExpandedRowId] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [previewColorIdx, setPreviewColorIdx] = useState({}) // { [productId]: colorIdx }

  // Primary Image Upload State
  const [primaryImageMode, setPrimaryImageMode] = useState('file') // 'file' or 'url'
  const [primaryImageFile, setPrimaryImageFile] = useState(null)
  const [primaryImagePreview, setPrimaryImagePreview] = useState('')
  const primaryFileInputRef = useRef(null)

  // Initial Form Data
  const defaultFormData = {
    sku: '',
    name: '',
    category: 'tees',
    group: 'Topwear',
    subcategory: '',
    fabric: '',
    gsm: '',
    fit: 'Oversized',
    availability: 'Ready Stock',
    moqType: 'Editable MOQ',
    moq: 'Editable',
    wholesalePrice: '',
    retailPrice: '',
    sizes: 'S – XXL',
    sizeList: 'S, M, L, XL, XXL',
    image: '',
    isLatestDrop: false,
    isBestseller: false,
    isHeroArrival: false,
    heroTag: '',
    colors: [
      {
        name: 'Obsidian',
        color: 'Obsidian',
        hex: '#1F2422',
        colorCode: '#1F2422',
        tone: 'Obsidian Black',
        price: '',
        mrp: '',
        image: '',
        images: [],
        gallery: { front: '', back: '', side: '', closeup: '', onModel: '' },
        skus: [
          { sku: 'BVB-TEE-01-OBS-S', size: 'S', stock: 25, status: 'In Stock' },
          { sku: 'BVB-TEE-01-OBS-M', size: 'M', stock: 40, status: 'In Stock' },
          { sku: 'BVB-TEE-01-OBS-L', size: 'L', stock: 35, status: 'In Stock' },
          { sku: 'BVB-TEE-01-OBS-XL', size: 'XL', stock: 20, status: 'In Stock' },
          { sku: 'BVB-TEE-01-OBS-XXL', size: 'XXL', stock: 15, status: 'In Stock' },
        ],
      },
    ],
    summary: '',
    highlights: '',
  }

  const [formData, setFormData] = useState(defaultFormData)

  // Fetch products from API
  const fetchProducts = async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const res = await getProductsApi()
      if (res && res.success && Array.isArray(res.products)) {
        setProducts(res.products)
      } else {
        setProducts([])
      }
    } catch (err) {
      console.warn('API error fetching products:', err)
      setErrorMessage(err.response?.data?.message || 'Failed to load wholesale products from database.')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch all 7 Dynamic Master Models in Parallel from Database
  const fetchMasterData = async () => {
    setIsLoadingMasters(true)
    try {
      const [catRes, typeRes, sizeRes, colRes, fitRes, fabRes, moqRes] = await Promise.allSettled([
        getCategoriesApi(),
        getProductTypesApi(),
        getSizesApi(),
        getColorsApi(),
        getFitsApi(),
        getFabricsApi(),
        getMoqsApi(),
      ])

      if (catRes.status === 'fulfilled' && catRes.value?.success && Array.isArray(catRes.value.categories)) {
        setMasterCategories(catRes.value.categories.filter((c) => c.status !== 'Inactive'))
      }
      if (typeRes.status === 'fulfilled' && typeRes.value?.success && Array.isArray(typeRes.value.productTypes)) {
        setMasterProductTypes(typeRes.value.productTypes.filter((pt) => pt.status !== 'Inactive'))
      }
      if (sizeRes.status === 'fulfilled' && sizeRes.value?.success && Array.isArray(sizeRes.value.sizes)) {
        setMasterSizes(sizeRes.value.sizes.filter((s) => s.status !== 'Inactive'))
      }
      if (colRes.status === 'fulfilled' && colRes.value?.success && Array.isArray(colRes.value.colors)) {
        setMasterColors(colRes.value.colors.filter((c) => c.status !== 'Inactive'))
      }
      if (fitRes.status === 'fulfilled' && fitRes.value?.success && Array.isArray(fitRes.value.fits)) {
        setMasterFits(fitRes.value.fits.filter((f) => f.status !== 'Inactive'))
      }
      if (fabRes.status === 'fulfilled' && fabRes.value?.success && Array.isArray(fabRes.value.fabrics)) {
        setMasterFabrics(fabRes.value.fabrics.filter((f) => f.status !== 'Inactive'))
      }
      if (moqRes.status === 'fulfilled' && moqRes.value?.success && Array.isArray(moqRes.value.moqs)) {
        setMasterMoqs(moqRes.value.moqs.filter((m) => m.status !== 'Inactive'))
      }
    } catch (err) {
      console.warn('API error fetching master collections:', err)
    } finally {
      setIsLoadingMasters(false)
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchMasterData()
  }, [])

  // Auto-clear notification messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3500)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  // Open Modal for Create or Edit
  const handleOpenModal = (prod = null) => {
    setErrorMessage('')
    setSuccessMessage('')
    setModalActiveTab('style')
    setModalColorIdx(0)
    if (prod) {
      setEditingProduct(prod)
      setFormData({
        sku: prod.sku || '',
        name: prod.name || '',
        category: prod.category || 'tees',
        group: prod.group || 'Topwear',
        subcategory: prod.subcategory || '',
        fabric: prod.fabric || '',
        gsm: prod.gsm || '',
        fit: prod.fit || 'Oversized',
        availability: prod.availability || 'Ready Stock',
        moqType: prod.moqType || 'Editable MOQ',
        moq: prod.moq || 'Editable',
        wholesalePrice: prod.wholesalePrice ?? '',
        retailPrice: prod.retailPrice ?? '',
        sizes: prod.sizes || 'S – XXL',
        sizeList: Array.isArray(prod.sizeList) ? prod.sizeList.join(', ') : prod.sizeList || '',
        image: prod.image || '',
        isLatestDrop: Boolean(prod.isLatestDrop),
        isBestseller: Boolean(prod.isBestseller),
        isHeroArrival: Boolean(prod.isHeroArrival),
        heroTag: prod.heroTag || '',
        colors:
          (prod.variants && prod.variants.length > 0 ? prod.variants : prod.colors)?.map((c) => {
            const colName = c.name || c.color || 'Default'
            const g = c.gallery || {}
            const imgs = Array.isArray(c.images) ? c.images : []
            const front = g.front || imgs[0] || c.image || ''
            const back = g.back || imgs[1] || ''
            const side = g.side || imgs[2] || ''
            const closeup = g.closeup || imgs[3] || ''
            const onModel = g.onModel || imgs[4] || ''
            const sizeListArr = Array.isArray(prod.sizeList) ? prod.sizeList : ['S', 'M', 'L', 'XL', 'XXL']
            const skus =
              Array.isArray(c.skus) && c.skus.length > 0
                ? c.skus
                : buildDefaultSkusForColor(prod.sku, colName, sizeListArr.join(', '))

            return {
              name: colName,
              color: colName,
              hex: c.hex || c.colorCode || '#1F2422',
              colorCode: c.hex || c.colorCode || '#1F2422',
              tone: c.tone || '',
              price: c.price ?? c.wholesalePrice ?? '',
              mrp: c.mrp ?? c.retailPrice ?? '',
              image: front,
              images: [front, back, side, closeup, onModel].filter(Boolean),
              gallery: { front, back, side, closeup, onModel },
              skus,
            }
          }) || [
            {
              name: 'Obsidian',
              color: 'Obsidian',
              hex: '#1F2422',
              colorCode: '#1F2422',
              tone: 'Obsidian Black',
              price: '',
              mrp: '',
              image: '',
              images: [],
              gallery: { front: '', back: '', side: '', closeup: '', onModel: '' },
              skus: buildDefaultSkusForColor(prod.sku, 'Obsidian', 'S, M, L, XL, XXL'),
            },
          ],
        summary: prod.copy?.summary || '',
        highlights: Array.isArray(prod.copy?.highlights) ? prod.copy.highlights.join('\n') : '',
      })
      setPrimaryImageFile(null)
      setPrimaryImagePreview(prod.image || '')
      setPrimaryImageMode(prod.image ? 'url' : 'file')
    } else {
      setEditingProduct(null)
      setFormData(defaultFormData)
      setPrimaryImageFile(null)
      setPrimaryImagePreview('')
      setPrimaryImageMode('file')
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
    setFormData(defaultFormData)
    setPrimaryImageFile(null)
    setPrimaryImagePreview('')
  }

  // Handle Primary Image File Picker
  const handlePrimaryFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please choose a valid image file (JPG, PNG, WEBP, AVIF).')
      return
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('Image size must be less than 25MB.')
      return
    }

    setPrimaryImageFile(file)
    try {
      const optimizedPreview = await compressImageFile(file, 800, 0.8)
      setPrimaryImagePreview(optimizedPreview || URL.createObjectURL(file))
    } catch {
      const reader = new FileReader()
      reader.onload = () => setPrimaryImagePreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleRemovePrimaryImage = () => {
    setPrimaryImageFile(null)
    setPrimaryImagePreview('')
    setFormData((prev) => ({ ...prev, image: '' }))
    if (primaryFileInputRef.current) {
      primaryFileInputRef.current.value = ''
    }
  }

  // Handle Variant Add / Remove
  const handleAddColor = () => {
    setFormData((prev) => {
      const defaultSkus = buildDefaultSkusForColor(prev.sku, '', prev.sizeList)
      return {
        ...prev,
        colors: [
          ...prev.colors,
          {
            name: '',
            color: '',
            hex: '#222222',
            colorCode: '#222222',
            tone: '',
            price: '',
            mrp: '',
            image: '',
            images: [],
            gallery: { front: '', back: '', side: '', closeup: '', onModel: '' },
            skus: defaultSkus,
          },
        ],
      }
    })
  }

  const handleRemoveColor = (idx) => {
    setFormData((prev) => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== idx),
    }))
  }

  const handleColorChange = (idx, field, value) => {
    setFormData((prev) => {
      const nextColors = [...prev.colors]
      nextColors[idx] = { ...nextColors[idx], [field]: value }
      return { ...prev, colors: nextColors }
    })
  }

  // Handle single angle file upload
  const handleColorAngleFileChange = async (colorIdx, angleKey, e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file.')
      return
    }

    try {
      const compressedDataUri = await compressImageFile(file, 1200, 0.82)
      setFormData((prev) => {
        const nextColors = [...prev.colors]
        const col = { ...nextColors[colorIdx] }
        const nextGallery = { ...(col.gallery || {}), [angleKey]: compressedDataUri }
        col.gallery = nextGallery
        if (angleKey === 'front' || !col.image) {
          col.image = compressedDataUri
        }
        col.images = [
          nextGallery.front,
          nextGallery.back,
          nextGallery.side,
          nextGallery.closeup,
          nextGallery.onModel,
        ].filter(Boolean)
        nextColors[colorIdx] = col
        return { ...prev, colors: nextColors }
      })
    } catch {
      const reader = new FileReader()
      reader.onload = () => {
        setFormData((prev) => {
          const nextColors = [...prev.colors]
          const col = { ...nextColors[colorIdx] }
          const nextGallery = { ...(col.gallery || {}), [angleKey]: reader.result }
          col.gallery = nextGallery
          if (angleKey === 'front' || !col.image) {
            col.image = reader.result
          }
          col.images = [
            nextGallery.front,
            nextGallery.back,
            nextGallery.side,
            nextGallery.closeup,
            nextGallery.onModel,
          ].filter(Boolean)
          nextColors[colorIdx] = col
          return { ...prev, colors: nextColors }
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleColorAngleUrlChange = (colorIdx, angleKey, url) => {
    setFormData((prev) => {
      const nextColors = [...prev.colors]
      const col = { ...nextColors[colorIdx] }
      const nextGallery = { ...(col.gallery || {}), [angleKey]: url }
      col.gallery = nextGallery
      if (angleKey === 'front' || !col.image) {
        col.image = url
      }
      col.images = [
        nextGallery.front,
        nextGallery.back,
        nextGallery.side,
        nextGallery.closeup,
        nextGallery.onModel,
      ].filter(Boolean)
      nextColors[colorIdx] = col
      return { ...prev, colors: nextColors }
    })
  }

  const handleColorAngleRemove = (colorIdx, angleKey) => {
    setFormData((prev) => {
      const nextColors = [...prev.colors]
      const col = { ...nextColors[colorIdx] }
      const nextGallery = { ...(col.gallery || {}), [angleKey]: '' }
      col.gallery = nextGallery
      if (angleKey === 'front') {
        col.image = nextGallery.back || nextGallery.side || ''
      }
      col.images = [
        nextGallery.front,
        nextGallery.back,
        nextGallery.side,
        nextGallery.closeup,
        nextGallery.onModel,
      ].filter(Boolean)
      nextColors[colorIdx] = col
      return { ...prev, colors: nextColors }
    })
  }

  // Bulk upload up to 5 photos at once!
  const handleColorBulkUpload = async (colorIdx, e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const angleKeys = ['front', 'back', 'side', 'closeup', 'onModel']
    const nextGallery = { ...(formData.colors[colorIdx]?.gallery || {}) }

    for (let i = 0; i < Math.min(files.length, 5); i++) {
      const file = files[i]
      if (file && file.type.startsWith('image/')) {
        try {
          const compressed = await compressImageFile(file, 1200, 0.82)
          nextGallery[angleKeys[i]] = compressed
        } catch {
          // fallback
        }
      }
    }

    setFormData((prev) => {
      const nextColors = [...prev.colors]
      const col = { ...nextColors[colorIdx] }
      col.gallery = nextGallery
      col.image = nextGallery.front || col.image || ''
      col.images = [
        nextGallery.front,
        nextGallery.back,
        nextGallery.side,
        nextGallery.closeup,
        nextGallery.onModel,
      ].filter(Boolean)
      nextColors[colorIdx] = col
      return { ...prev, colors: nextColors }
    })
  }

  // Level 3 SKU Stock handler
  const handleSkuStockChange = (colorIdx, skuIdx, nextStock) => {
    setFormData((prev) => {
      const nextColors = [...prev.colors]
      const col = { ...nextColors[colorIdx] }
      const nextSkus = [...(col.skus || [])]
      const stockNum = Math.max(0, parseInt(nextStock, 10) || 0)
      nextSkus[skuIdx] = {
        ...nextSkus[skuIdx],
        stock: stockNum,
        status: stockNum === 0 ? 'Out of Stock' : stockNum <= 10 ? 'Low Stock' : 'In Stock',
      }
      col.skus = nextSkus
      nextColors[colorIdx] = col
      return { ...prev, colors: nextColors }
    })
  }

  // Quick SKU Stock Stepper (+ / -)
  const handleSkuStockStep = (colorIdx, skuIdx, delta) => {
    setFormData((prev) => {
      const nextColors = [...prev.colors]
      const col = { ...nextColors[colorIdx] }
      const nextSkus = [...(col.skus || [])]
      const curStock = Number(nextSkus[skuIdx]?.stock) || 0
      const stockNum = Math.max(0, curStock + delta)
      nextSkus[skuIdx] = {
        ...nextSkus[skuIdx],
        stock: stockNum,
        status: stockNum === 0 ? 'Out of Stock' : stockNum <= 10 ? 'Low Stock' : 'In Stock',
      }
      col.skus = nextSkus
      nextColors[colorIdx] = col
      return { ...prev, colors: nextColors }
    })
  }

  // Batch Fill Stock for a Color Variant (e.g. Set all sizes to 25 pcs)
  const handleBatchFillStock = (colorIdx, stockVal) => {
    setFormData((prev) => {
      const nextColors = [...prev.colors]
      const col = { ...nextColors[colorIdx] }
      const stockNum = Math.max(0, Number(stockVal) || 0)
      col.skus = (col.skus || []).map((s) => ({
        ...s,
        stock: stockNum,
        status: stockNum === 0 ? 'Out of Stock' : stockNum <= 10 ? 'Low Stock' : 'In Stock',
      }))
      nextColors[colorIdx] = col
      return { ...prev, colors: nextColors }
    })
  }

  // Dynamic Size Selection & Level 3 SKU Generator (driven by SizeModel.js)
  const handleToggleSize = (sizeName) => {
    if (!sizeName) return
    const targetSize = sizeName.trim().toUpperCase()

    setFormData((prev) => {
      const currentSizes = (prev.sizeList || '')
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean)

      const exists = currentSizes.includes(targetSize)
      let nextSizes = []
      if (exists) {
        nextSizes = currentSizes.filter((s) => s !== targetSize)
      } else {
        nextSizes = [...currentSizes, targetSize]
      }

      const cleanBaseSku = (prev.sku || 'BVB-STYLE').trim().toUpperCase()

      // Update SKUs for every color variant
      const updatedColors = prev.colors.map((c) => {
        const colCode = (c.name || c.color || 'DEF').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3) || 'COL'
        const existingSkus = Array.isArray(c.skus) ? c.skus : []

        const newSkus = nextSizes.map((sz) => {
          const found = existingSkus.find((s) => s.size?.toUpperCase() === sz)
          if (found) {
            return {
              ...found,
              size: sz,
              sku: formatSkuCode(cleanBaseSku, c.name, sz),
            }
          }
          return {
            sku: formatSkuCode(cleanBaseSku, c.name, sz),
            size: sz,
            stock: 25,
            status: 'In Stock',
          }
        })

        return { ...c, skus: newSkus }
      })

      const compactRatio =
        nextSizes.length > 1
          ? `${nextSizes[0]} – ${nextSizes[nextSizes.length - 1]}`
          : nextSizes[0] || 'Custom'

      return {
        ...prev,
        sizeList: nextSizes.join(', '),
        sizes: compactRatio,
        colors: updatedColors,
      }
    })
  }

  // Apply Size Preset (e.g. ['S', 'M', 'L', 'XL', 'XXL'] or ['28', '30', '32', '34', '36'])
  const handleApplySizePreset = (presetSizes) => {
    setFormData((prev) => {
      const cleanBaseSku = (prev.sku || 'BVB-STYLE').trim().toUpperCase()
      const updatedColors = prev.colors.map((c) => {
        const existingSkus = Array.isArray(c.skus) ? c.skus : []
        const newSkus = presetSizes.map((sz) => {
          const found = existingSkus.find((s) => s.size?.toUpperCase() === sz.toUpperCase())
          if (found) {
            return {
              ...found,
              size: sz,
              sku: formatSkuCode(cleanBaseSku, c.name, sz),
            }
          }
          return {
            sku: formatSkuCode(cleanBaseSku, c.name, sz),
            size: sz,
            stock: 25,
            status: 'In Stock',
          }
        })
        return { ...c, skus: newSkus }
      })

      const compactRatio =
        presetSizes.length > 1
          ? `${presetSizes[0]} – ${presetSizes[presetSizes.length - 1]}`
          : presetSizes[0] || ''

      return {
        ...prev,
        sizeList: presetSizes.join(', '),
        sizes: compactRatio,
        colors: updatedColors,
      }
    })
  }

  const handleAddCustomSize = () => {
    if (!customSizeInput.trim()) return
    handleToggleSize(customSizeInput.trim())
    setCustomSizeInput('')
  }

  // Re-sync all SKU codes using style SKU and color names
  const handleSyncAllSkus = () => {
    setFormData((prev) => {
      const cleanBaseSku = (prev.sku || 'BVB-STYLE').trim().toUpperCase()
      const updatedColors = prev.colors.map((c) => {
        const newSkus = (c.skus || []).map((s) => ({
          ...s,
          sku: formatSkuCode(cleanBaseSku, c.name || c.color, s.size),
        }))
        return { ...c, skus: newSkus }
      })
      return { ...prev, colors: updatedColors }
    })
  }

  // Quick Pick Color from ColorModel
  const handleSelectMasterColor = (masterColor, targetColorIdx) => {
    if (!masterColor) return
    const colName = masterColor.name || ''
    const colHex = masterColor.hexCode || masterColor.hex || '#1F2422'
    const colCode = (masterColor.code || colName).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3) || 'COL'
    const cleanBaseSku = (formData.sku || 'BVB-STYLE').trim().toUpperCase()

    setFormData((prev) => {
      const nextColors = [...prev.colors]
      const cur = nextColors[targetColorIdx] || {}
      const updatedSkus = (cur.skus || []).map((s) => ({
        ...s,
        sku: formatSkuCode(cleanBaseSku, colName, s.size),
      }))

      nextColors[targetColorIdx] = {
        ...cur,
        name: colName,
        color: colName,
        hex: colHex,
        colorCode: colHex,
        tone: masterColor.description || colName,
        skus: updatedSkus.length > 0 ? updatedSkus : buildDefaultSkusForColor(cleanBaseSku, colName, prev.sizeList),
      }

      return { ...prev, colors: nextColors }
    })
  }

  // Add a new color variant directly from ColorModel
  const handleAddColorFromMaster = (masterColor) => {
    if (!masterColor) return
    const colName = masterColor.name || 'New Color'
    const colHex = masterColor.hexCode || masterColor.hex || '#1F2422'
    const cleanBaseSku = (formData.sku || 'BVB-STYLE').trim().toUpperCase()
    const defaultSkus = buildDefaultSkusForColor(cleanBaseSku, colName, formData.sizeList)

    setFormData((prev) => ({
      ...prev,
      colors: [
        ...prev.colors,
        {
          name: colName,
          color: colName,
          hex: colHex,
          colorCode: colHex,
          tone: masterColor.description || colName,
          price: '',
          mrp: '',
          image: '',
          images: [],
          gallery: { front: '', back: '', side: '', closeup: '', onModel: '' },
          skus: defaultSkus,
        },
      ],
    }))
    setModalColorIdx(formData.colors.length)
  }

  // Quick Pick Fabric from FabricModel
  const handleSelectMasterFabric = (fabricObj) => {
    if (!fabricObj) return
    setFormData((prev) => ({
      ...prev,
      fabric: fabricObj.name,
      gsm: fabricObj.gsm || prev.gsm,
    }))
  }

  // Quick Pick MOQ from MoqModel
  const handleSelectMasterMoq = (moqObj) => {
    if (!moqObj) return
    setFormData((prev) => ({
      ...prev,
      moqType: moqObj.name,
      moq: moqObj.hint || `${moqObj.minQuantity} pcs` || prev.moq || 'Editable',
    }))
  }

  // Submit Create or Update
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const formattedColors = formData.colors
        .filter((c) => (c.name || c.color || '').trim())
        .map((c) => {
          const colName = (c.name || c.color || '').trim()
          const colCode = c.hex || c.colorCode || '#1F2422'
          const g = c.gallery || {}
          const front = g.front || c.image || primaryImagePreview || formData.image || ''
          const gallery = {
            front,
            back: g.back || '',
            side: g.side || '',
            closeup: g.closeup || '',
            onModel: g.onModel || '',
          }
          const images = [
            gallery.front,
            gallery.back,
            gallery.side,
            gallery.closeup,
            gallery.onModel,
          ].filter(Boolean)

          const skus =
            Array.isArray(c.skus) && c.skus.length > 0
              ? c.skus
              : buildDefaultSkusForColor(formData.sku, colName, formData.sizeList)

          return {
            color: colName,
            name: colName,
            colorCode: colCode,
            hex: colCode,
            tone: c.tone || '',
            price: c.price ? Number(c.price) : undefined,
            wholesalePrice: c.price ? Number(c.price) : undefined,
            mrp: c.mrp ? Number(c.mrp) : undefined,
            retailPrice: c.mrp ? Number(c.mrp) : undefined,
            image: front,
            images,
            gallery,
            skus,
          }
        })

      const sizeListArr = formData.sizeList
        ? formData.sizeList.split(',').map((s) => s.trim()).filter(Boolean)
        : ['S', 'M', 'L', 'XL', 'XXL']

      const copyObj = {
        summary: formData.summary,
        highlights: formData.highlights
          ? formData.highlights.split('\n').map((h) => h.trim()).filter(Boolean)
          : [],
      }

      // If a file was selected, send multipart/form-data
      if (primaryImageFile) {
        const submitData = new FormData()
        submitData.append('sku', formData.sku.trim().toUpperCase())
        submitData.append('styleId', formData.sku.trim().toUpperCase())
        submitData.append('name', formData.name.trim())
        submitData.append('category', formData.category.trim().toLowerCase())
        submitData.append('group', formData.group)
        submitData.append('subcategory', formData.subcategory.trim())
        submitData.append('fabric', formData.fabric.trim())
        submitData.append('gsm', formData.gsm.trim())
        submitData.append('fit', formData.fit)
        submitData.append('availability', formData.availability)
        submitData.append('moqType', formData.moqType)
        submitData.append('moq', formData.moq)
        submitData.append('wholesalePrice', String(Number(formData.wholesalePrice) || 0))
        submitData.append('retailPrice', String(Number(formData.retailPrice) || 0))
        submitData.append('sizes', formData.sizes)
        submitData.append('sizeList', JSON.stringify(sizeListArr))
        submitData.append('colors', JSON.stringify(formattedColors))
        submitData.append('variants', JSON.stringify(formattedColors))
        submitData.append('isLatestDrop', String(formData.isLatestDrop))
        submitData.append('isBestseller', String(formData.isBestseller))
        submitData.append('isHeroArrival', String(formData.isHeroArrival))
        submitData.append('heroTag', formData.heroTag || '')
        submitData.append('copy', JSON.stringify(copyObj))
        submitData.append('image', primaryImageFile)

        if (editingProduct) {
          await updateProductApi(editingProduct._id || editingProduct.id, submitData)
          setSuccessMessage(`Product "${formData.sku}" updated with new image successfully.`)
        } else {
          await createProductApi(submitData)
          setSuccessMessage(`Product "${formData.sku}" created with uploaded image successfully.`)
        }
      } else {
        // Send JSON payload
        const payload = {
          sku: formData.sku.trim().toUpperCase(),
          styleId: formData.sku.trim().toUpperCase(),
          name: formData.name.trim(),
          category: formData.category.trim().toLowerCase(),
          group: formData.group,
          subcategory: formData.subcategory.trim(),
          fabric: formData.fabric.trim(),
          gsm: formData.gsm.trim(),
          fit: formData.fit,
          availability: formData.availability,
          moqType: formData.moqType,
          moq: formData.moq,
          wholesalePrice: Number(formData.wholesalePrice) || 0,
          retailPrice: Number(formData.retailPrice) || 0,
          sizes: formData.sizes,
          sizeList: sizeListArr,
          image: primaryImagePreview || formData.image || formattedColors[0]?.image || '',
          isLatestDrop: Boolean(formData.isLatestDrop),
          isBestseller: Boolean(formData.isBestseller),
          isHeroArrival: Boolean(formData.isHeroArrival),
          heroTag: formData.heroTag || '',
          colors: formattedColors,
          variants: formattedColors,
          copy: copyObj,
        }

        if (editingProduct) {
          await updateProductApi(editingProduct._id || editingProduct.id, payload)
          setSuccessMessage(`Product "${payload.sku}" updated successfully.`)
        } else {
          await createProductApi(payload)
          setSuccessMessage(`Product "${payload.sku}" created successfully.`)
        }
      }

      handleCloseModal()
      fetchProducts()
    } catch (err) {
      console.error('Error saving product:', err)
      setErrorMessage(err.response?.data?.message || 'Failed to save product details.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete Product
  const handleDelete = async (prod) => {
    if (!window.confirm(`Are you sure you want to delete product "${prod.sku} - ${prod.name}"?`)) {
      return
    }

    try {
      await deleteProductApi(prod._id || prod.id || prod.sku)
      setSuccessMessage(`Product "${prod.sku}" removed successfully.`)
      fetchProducts()
    } catch (err) {
      console.error('Error deleting product:', err)
      setErrorMessage(err.response?.data?.message || 'Failed to delete product.')
    }
  }

  // Seed default B2B sample products
  const handleSeed = async () => {
    if (!window.confirm('Populate database catalog with default wholesale products?')) return
    setIsLoading(true)
    try {
      const res = await seedProductsApi()
      setSuccessMessage(res.message || 'Wholesale catalog seeded successfully!')
      fetchProducts()
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to seed product catalog.')
    } finally {
      setIsLoading(false)
    }
  }

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        searchQuery === '' ||
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.fabric?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.colors?.some((c) => c.name?.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesCategory =
        categoryFilter === 'ALL' || p.category?.toLowerCase() === categoryFilter.toLowerCase()

      const matchesAvailability =
        availabilityFilter === 'ALL' || p.availability === availabilityFilter

      const matchesPlacement =
        placementFilter === 'ALL' ||
        (placementFilter === 'HERO' && Boolean(p.isHeroArrival)) ||
        (placementFilter === 'BESTSELLER' && Boolean(p.isBestseller)) ||
        (placementFilter === 'LATEST_DROP' && Boolean(p.isLatestDrop)) ||
        (placementFilter === 'STANDARD' && !p.isHeroArrival && !p.isBestseller && !p.isLatestDrop)

      return matchesSearch && matchesCategory && matchesAvailability && matchesPlacement
    })
  }, [products, searchQuery, categoryFilter, availabilityFilter, placementFilter])

  // Catalog Executive Metrics (Styles, Variants, SKUs, Stock)
  const catalogMetrics = useMemo(() => {
    let totalVariants = 0
    let totalSkus = 0
    let totalStock = 0
    let outOfStockCount = 0

    products.forEach((p) => {
      const vars = p.variants && p.variants.length > 0 ? p.variants : p.colors || []
      totalVariants += vars.length
      vars.forEach((v) => {
        const skus = Array.isArray(v.skus) ? v.skus : []
        totalSkus += skus.length
        skus.forEach((s) => {
          const qty = Number(s.stock) || 0
          totalStock += qty
          if (qty <= 0) outOfStockCount++
        })
      })
    })

    return {
      totalStyles: products.length,
      totalVariants,
      totalSkus,
      totalStock,
      outOfStockCount,
    }
  }, [products])

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#ECE4D5] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9A6D22]">
              Atelier Catalog Core
            </span>
            <span className="inline-flex items-center rounded-full bg-[#FAF3E4] px-2 py-0.5 text-[10px] font-semibold text-[#805915] border border-[#E5D3AF]">
              {products.length} Styles Active
            </span>
          </div>
          <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-[#121214] sm:text-3xl">
            Wholesale Products &amp; Variants
          </h1>
          <p className="mt-1 text-xs text-[#7A746B]">
            Style–Color–SKU hierarchy with 5 studio angles per color and live inventory management.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSeed}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#DFD5C2] bg-white px-3.5 py-2 text-xs font-semibold text-[#6B6357] uppercase tracking-wider hover:border-[#C59A46] hover:text-[#9A6D22] transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Seed Samples</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ECC880] to-[#C59A46] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#121214] shadow-xs hover:brightness-105 transition-all"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Add Wholesale Product</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="rounded-xl border border-[#C5DFB8] bg-[#F2F9EE] px-4 py-3 text-xs font-medium text-[#2E6B1D] shadow-2xs">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="rounded-xl border border-[#F3C4BE] bg-[#FDF2F0] px-4 py-3 text-xs font-medium text-[#A6261A] shadow-2xs">
          {errorMessage}
        </div>
      )}

      {/* 4 Atelier Catalog KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="rounded-xl border border-[#ECE4D5] bg-[#FFFFFF] p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#7A746B]">
              Garment Styles
            </span>
            <span className="h-2 w-2 rounded-full bg-[#1E824C]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-2xl font-bold text-[#121214]">
              {catalogMetrics.totalStyles}
            </span>
            <span className="text-[10.5px] font-mono text-[#9A6D22]">Active Styles</span>
          </div>
        </div>

        <div className="rounded-xl border border-[#ECE4D5] bg-[#FFFFFF] p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#7A746B]">
              Color Variants
            </span>
            <span className="font-mono text-[9px] rounded bg-[#FAF3E4] px-1.5 py-0.5 text-[#805915] font-semibold">
              Level 2
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-2xl font-bold text-[#121214]">
              {catalogMetrics.totalVariants}
            </span>
            <span className="text-[10.5px] font-mono text-[#7A746B]">5-Angle Visuals</span>
          </div>
        </div>

        <div className="rounded-xl border border-[#ECE4D5] bg-[#FFFFFF] p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#7A746B]">
              Active Size SKUs
            </span>
            <span className="font-mono text-[9px] rounded bg-[#EBF7EA] px-1.5 py-0.5 text-[#1E7412] font-semibold">
              Level 3
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-2xl font-bold text-[#121214]">
              {catalogMetrics.totalSkus}
            </span>
            <span className="text-[10.5px] font-mono text-[#7A746B]">Unique SKUs</span>
          </div>
        </div>

        <div className="rounded-xl border border-[#ECE4D5] bg-[#FFFFFF] p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#7A746B]">
              Warehouse Stock
            </span>
            {catalogMetrics.outOfStockCount > 0 ? (
              <span className="font-mono text-[9px] rounded bg-rose-50 px-1.5 py-0.5 text-rose-700 font-semibold border border-rose-200">
                {catalogMetrics.outOfStockCount} OOS
              </span>
            ) : (
              <span className="font-mono text-[9px] rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700 font-semibold">
                Healthy
              </span>
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-2xl font-bold text-[#121214]">
              {catalogMetrics.totalStock.toLocaleString('en-IN')}
            </span>
            <span className="text-[10.5px] font-mono text-[#7A746B]">Total Pieces</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#FFFFFF] border border-[#ECE4D5] rounded-xl p-3.5 shadow-2xs">
        <div className="relative flex-1 min-w-[200px]">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#9A9386]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by SKU, style name, fabric, or color shade..."
            className="w-full rounded-lg border border-[#E8DEC9] bg-[#FAF8F5] py-2 pl-9 pr-3 text-xs text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-[#E8DEC9] bg-[#FAF8F5] px-3 py-2 text-xs font-medium text-[#121214] focus:border-[#C59A46] focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {(masterCategories.length > 0 ? masterCategories : FALLBACK_CATEGORIES).map((c) => (
              <option key={c._id || c.slug} value={c.slug || c.name.toLowerCase()}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="rounded-lg border border-[#E8DEC9] bg-[#FAF8F5] px-3 py-2 text-xs font-medium text-[#121214] focus:border-[#C59A46] focus:outline-none"
          >
            <option value="ALL">All Stock Status</option>
            <option value="Ready Stock">Ready Stock</option>
            <option value="Made to Order">Made to Order</option>
          </select>

          <select
            value={placementFilter}
            onChange={(e) => setPlacementFilter(e.target.value)}
            className="rounded-lg border border-[#DFD5C2] bg-[#FAF3E4]/70 px-3 py-2 text-xs font-semibold text-[#805915] focus:border-[#C59A46] focus:outline-none"
          >
            <option value="ALL">All Home Placements</option>
            <option value="HERO">🟢 Live Arrived This Morning</option>
            <option value="BESTSELLER">⭐ Retailer Bestsellers</option>
            <option value="LATEST_DROP">🚀 The Latest Drop</option>
            <option value="STANDARD">Standard Catalog Only</option>
          </select>

          <button
            type="button"
            onClick={fetchProducts}
            title="Refresh list"
            className="p-2 text-[#7A746B] hover:text-[#121214] rounded-lg border border-[#E8DEC9] bg-[#FAF8F5] hover:bg-[#F2EDE2]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-xl border border-[#ECE4D5] bg-[#FFFFFF] shadow-2xs">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#C59A46] border-t-transparent" />
            <span className="font-mono text-xs uppercase tracking-widest text-[#7A746B]">
              Loading BVB Wholesale Collection...
            </span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-[#FAF3E4] flex items-center justify-center text-[#9A6D22] mb-3">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="font-sans text-sm font-bold text-[#121214]">No products found</h3>
            <p className="mt-1 text-xs text-[#7A746B] max-w-sm">
              Click &quot;Seed Samples&quot; above to populate the database with default styles or &quot;+ Add Wholesale Product&quot; to upload an image and create one.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#ECE4D5] bg-[#FAF8F5] text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B6357]">
                  <th className="py-3.5 pl-4 pr-2">Garment Style</th>
                  <th className="px-3 py-3.5">Category</th>
                  <th className="px-3 py-3.5">Fabric &amp; Weight</th>
                  <th className="px-3 py-3.5">Colours &amp; Angles</th>
                  <th className="px-3 py-3.5">Wholesale Rate</th>
                  <th className="px-3 py-3.5">MOQ &amp; Sizes</th>
                  <th className="px-3 py-3.5">Availability</th>
                  <th className="px-3 py-3.5">Home Placement</th>
                  <th className="py-3.5 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECE4D5]">
                {filteredProducts.map((p) => {
                  const pId = p._id || p.id || p.sku
                  const activeColorIdx = previewColorIdx[pId] ?? 0
                  const colors = p.variants && p.variants.length > 0 ? p.variants : p.colors || []
                  const activeColor = colors[activeColorIdx] || colors[0]
                  const currentImage =
                    activeColor?.images?.[0] ||
                    activeColor?.gallery?.front ||
                    activeColor?.image ||
                    p.image
                  const isExpanded = expandedRowId === pId

                  // Calculate total stock and photos count across variants
                  const totalStock = colors.reduce((acc, c) => {
                    const skus = Array.isArray(c.skus) ? c.skus : []
                    return acc + skus.reduce((sAcc, s) => sAcc + (Number(s.stock) || 0), 0)
                  }, 0)

                  const photoAnglesCount = [
                    activeColor?.gallery?.front || activeColor?.images?.[0],
                    activeColor?.gallery?.back || activeColor?.images?.[1],
                    activeColor?.gallery?.side || activeColor?.images?.[2],
                    activeColor?.gallery?.closeup || activeColor?.images?.[3],
                    activeColor?.gallery?.onModel || activeColor?.images?.[4],
                  ].filter(Boolean).length

                  return (
                    <Fragment key={pId}>
                      <tr className="hover:bg-[#FCFBF8] transition-colors">
                        {/* Product Thumbnail + Title */}
                        <td className="py-3 pl-4 pr-2">
                          <div className="flex items-center gap-3">
                            <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-[2px] border border-[#E8DEC9] bg-[#EFECE5]">
                              <img
                                src={currentImage}
                                alt={p.name}
                                className="h-full w-full object-cover object-top transition-transform duration-300 hover:scale-105"
                              />
                              <span className="absolute bottom-0 inset-x-0 bg-black/75 text-center font-mono text-[7.5px] font-semibold text-[#FAD79F] py-0.5">
                                {photoAnglesCount}/5 Angles
                              </span>
                            </div>
                            <div>
                              <span className="font-mono text-[9.5px] font-bold uppercase tracking-wider text-[#9A6D22]">
                                {p.sku}
                              </span>
                              <div className="font-sans text-xs font-bold text-[#121214]">
                                {p.name}
                              </div>
                              <span className="font-mono text-[9px] text-[#8A847C]">
                                Fit: {p.fit || 'Regular'} · Style: {p.styleId || p.sku}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center rounded-md bg-[#FAF3E4] px-2 py-0.5 font-mono text-[9.5px] font-semibold text-[#805915] uppercase tracking-wider">
                            {p.category}
                          </span>
                          {p.subcategory && (
                            <div className="text-[10px] text-[#7A746B] mt-0.5 truncate max-w-[120px]">
                              {p.subcategory}
                            </div>
                          )}
                        </td>

                        {/* Fabric & Weight */}
                        <td className="px-3 py-3">
                          <div className="font-medium text-[#121214]">{p.fabric || '—'}</div>
                          {p.gsm && <div className="text-[10px] font-mono text-[#8A847C]">{p.gsm}</div>}
                        </td>

                        {/* Available Colors with Interactive Swatch */}
                        <td className="px-3 py-3">
                          {colors.length > 0 ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                {colors.map((c, cIdx) => {
                                  const isSel = cIdx === activeColorIdx
                                  const colHex = c.hex || c.colorCode || '#121214'
                                  const colName = c.name || c.color || `Color ${cIdx + 1}`
                                  return (
                                    <button
                                      key={`${pId}-${colName}-${cIdx}`}
                                      type="button"
                                      title={`${colName} (${c.tone || ''})`}
                                      onClick={() =>
                                        setPreviewColorIdx((prev) => ({ ...prev, [pId]: cIdx }))
                                      }
                                      style={{ backgroundColor: colHex }}
                                      className={`h-3.5 w-3.5 rounded-full border border-black/20 cursor-pointer transition-transform ${
                                        isSel
                                          ? 'scale-125 ring-2 ring-[#C59A46] ring-offset-1 ring-offset-white'
                                          : 'hover:scale-115'
                                      }`}
                                    />
                                  )
                                })}
                              </div>
                              <div className="font-mono text-[9px] text-[#7A746B] truncate max-w-[120px]">
                                {activeColor?.name || activeColor?.color || `${colors.length} shades`}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#A8A196]">Standard</span>
                          )}
                        </td>

                        {/* Wholesale Price */}
                        <td className="px-3 py-3 font-mono">
                          <div className="font-bold text-[#121214]">
                            ₹{p.wholesalePrice ? p.wholesalePrice.toLocaleString('en-IN') : '—'}
                            <span className="text-[9px] font-normal text-[#7A746B]"> /pc</span>
                          </div>
                          {p.retailPrice > 0 && (
                            <div className="text-[9px] text-[#A8A196]">
                              MRP ₹{p.retailPrice}
                            </div>
                          )}
                        </td>

                        {/* MOQ & Live Inventory */}
                        <td className="px-3 py-3">
                          <div className="font-semibold text-[#121214]">
                            MOQ: {p.moq || 'Editable'}
                          </div>
                          <div className="text-[10px] font-mono text-[#1E824C] font-semibold">
                            {totalStock} pcs total
                          </div>
                        </td>

                        {/* Availability */}
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${
                              p.availability === 'Ready Stock'
                                ? 'bg-[#EBF7EA] text-[#1E7412]'
                                : 'bg-[#FFF6E5] text-[#9A6D22]'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                p.availability === 'Ready Stock' ? 'bg-[#1E7412]' : 'bg-[#9A6D22]'
                              }`}
                            />
                            {p.availability || 'Ready Stock'}
                          </span>
                        </td>

                        {/* Homepage Placement Badges */}
                        <td className="px-3 py-3">
                          <div className="flex flex-col gap-1 items-start">
                            {p.isHeroArrival && (
                              <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#1E7412] border border-emerald-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#1E7412]" />
                                Live Arrival
                              </span>
                            )}
                            {p.isBestseller && (
                              <span className="inline-flex items-center gap-1 rounded bg-[#FAF3E4] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#9A6D22] border border-[#E8DEC9]">
                                ★ Bestseller
                              </span>
                            )}
                            {p.isLatestDrop && (
                              <span className="inline-flex items-center gap-1 rounded bg-sky-50 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#2E72D2] border border-sky-200">
                                Latest Drop
                              </span>
                            )}
                            {!p.isHeroArrival && !p.isBestseller && !p.isLatestDrop && (
                              <span className="font-mono text-[9px] text-[#A8A196]">Standard</span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 pr-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Expand SKU Details */}
                            <button
                              type="button"
                              onClick={() => setExpandedRowId((prev) => (prev === pId ? null : pId))}
                              className={`px-2 py-1 rounded text-[10px] font-mono font-semibold transition-colors cursor-pointer ${
                                isExpanded
                                  ? 'bg-[#121214] text-[#FAD79F]'
                                  : 'bg-[#FAF3E4] text-[#805915] hover:bg-[#F2E5C9]'
                              }`}
                              title="Toggle SKU Inventory Drawer"
                            >
                              {isExpanded ? 'Hide SKUs ▲' : 'View SKUs ▼'}
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => handleOpenModal(p)}
                              className="p-1.5 text-[#6B6357] hover:text-[#9A6D22] hover:bg-[#FAF3E4] rounded-md transition-colors cursor-pointer"
                              title="Edit product"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDelete(p)}
                              className="p-1.5 text-[#8A847B] hover:text-[#B92D25] hover:bg-[#FDF2F0] rounded-md transition-colors cursor-pointer"
                              title="Delete product"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Drawer for SKUs & 5-angle photos */}
                      {isExpanded && (
                        <tr className="bg-[#FAF8F5] border-b border-[#ECE4D5]">
                          <td colSpan="9" className="p-4">
                            <div className="rounded-xl border border-[#E2D8C7] bg-white p-4 space-y-4">
                              <div className="flex items-center justify-between border-b border-[#F0EAE0] pb-2">
                                <span className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-[#9A6D22]">
                                  Style–Color–SKU Inventory Breakdown for {p.sku} ({p.name})
                                </span>
                                <span className="font-mono text-[10px] text-[#7A746B]">
                                  {colors.length} Color Variants ·{' '}
                                  {colors.reduce((a, c) => a + (c.skus?.length || 0), 0)} Size SKUs
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {colors.map((c, cIdx) => {
                                  const colName = c.name || c.color || `Variant ${cIdx + 1}`
                                  const g = c.gallery || {}
                                  const imgs = Array.isArray(c.images) ? c.images : []
                                  const anglePhotos = [
                                    { label: 'FRONT', url: g.front || imgs[0] || c.image },
                                    { label: 'BACK', url: g.back || imgs[1] },
                                    { label: 'SIDE', url: g.side || imgs[2] },
                                    { label: 'DETAIL', url: g.closeup || imgs[3] },
                                    { label: 'MODEL', url: g.onModel || imgs[4] },
                                  ]

                                  return (
                                    <div
                                      key={cIdx}
                                      className="rounded-lg border border-[#E8DEC9] bg-[#FAF8F5] p-3 space-y-2.5"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <span
                                            className="h-3.5 w-3.5 rounded-full border border-black/20"
                                            style={{
                                              backgroundColor:
                                                c.hex || c.colorCode || '#121214',
                                            }}
                                          />
                                          <span className="font-bold text-xs text-[#121214]">
                                            {colName}
                                          </span>
                                          {c.tone && (
                                            <span className="text-[10px] text-[#8A847C]">
                                              ({c.tone})
                                            </span>
                                          )}
                                        </div>
                                        <span className="font-mono text-[10px] text-[#805915] font-semibold">
                                          Stock:{' '}
                                          {((c.skus && c.skus.length > 0) ? c.skus : buildDefaultSkusForColor(p.sku, colName, p.sizeList)).reduce(
                                            (acc, s) => acc + (Number(s.stock) || 0),
                                            0,
                                          )}{' '}
                                          pcs
                                        </span>
                                      </div>

                                      {/* 5-Photo Strip */}
                                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                                        {anglePhotos.map((ap, apIdx) => (
                                          <div key={apIdx} className="flex flex-col items-center">
                                            <div className="h-14 w-11 shrink-0 overflow-hidden rounded border border-[#DFD5C2] bg-white">
                                              {ap.url ? (
                                                <img
                                                  src={ap.url}
                                                  alt={ap.label}
                                                  className="h-full w-full object-cover object-top"
                                                />
                                              ) : (
                                                <div className="flex h-full w-full items-center justify-center text-[8px] text-[#B5ADA0] font-mono">
                                                  Empty
                                                </div>
                                              )}
                                            </div>
                                            <span className="font-mono text-[7px] text-[#8A847C] uppercase mt-0.5">
                                              {ap.label}
                                            </span>
                                          </div>
                                        ))}
                                      </div>

                                      {/* SKU Stock Pill Row */}
                                      <div className="flex flex-wrap gap-1.5 pt-1">
                                        {((c.skus && c.skus.length > 0) ? c.skus : buildDefaultSkusForColor(p.sku, colName, p.sizeList)).map((s, sIdx) => (
                                          <div
                                            key={sIdx}
                                            className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 border border-[#E5DEC9] font-mono text-[9.5px]"
                                          >
                                            <span className="font-bold text-[#121214]">
                                              {s.size}:
                                            </span>
                                            <span
                                              className={
                                                s.stock === 0
                                                  ? 'text-rose-600 font-bold'
                                                  : s.stock <= 10
                                                  ? 'text-amber-600 font-semibold'
                                                  : 'text-[#1E824C] font-semibold'
                                              }
                                            >
                                              {s.stock} pcs
                                            </span>
                                            <span className="text-[8px] text-[#A69F94]">
                                              ({s.sku})
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal - Style-Color-SKU Studio */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-2xl bg-[#FFFFFF] shadow-2xl border border-[#ECE4D5] my-6 max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#ECE4D5] px-6 py-4 bg-[#FAF8F5]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#ECC880] to-[#C59A46] font-mono font-bold text-xs text-[#121214] shadow-xs">
                  {editingProduct ? 'MOD' : 'NEW'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9.5px] font-semibold uppercase tracking-widest text-[#9A6D22]">
                      Style–Color–SKU Studio
                    </span>
                    <span className="rounded bg-[#FAF3E4] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#805915]">
                      Myntra 3-Level Standard
                    </span>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#121214]">
                    {editingProduct
                      ? `Edit Style: ${editingProduct.sku} (${editingProduct.name})`
                      : 'Create New Wholesale Style'}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="text-[#8A847B] hover:text-[#121214] p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Studio 4-Tab Navigation */}
            <div className="flex items-center border-b border-[#ECE4D5] bg-white px-6 overflow-x-auto shrink-0">
              {[
                { id: 'style', label: '1. Style Master', badge: 'Level 1' },
                {
                  id: 'variants',
                  label: '2. Colors & 5 Photos',
                  badge: `${formData.colors?.length || 0} Shades`,
                },
                {
                  id: 'skus',
                  label: '3. Size SKUs & Stock',
                  badge: `${formData.colors?.reduce(
                    (a, c) => a + (c.skus?.length || 0),
                    0,
                  ) || 0} SKUs`,
                },
                { id: 'copy', label: '4. Specs & Copy', badge: 'Specs' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setModalActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    modalActiveTab === tab.id
                      ? 'border-[#C59A46] text-[#9A6D22] bg-[#FAF8F5]'
                      : 'border-transparent text-[#7A746B] hover:text-[#121214] hover:bg-[#FCFBF8]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                      modalActiveTab === tab.id
                        ? 'bg-[#FAF3E4] text-[#805915] font-bold'
                        : 'bg-[#F0ECE4] text-[#7A746B]'
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              ))}
            </div>

            {/* Modal Form Scrollable Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* TAB 1: STYLE MASTER (Level 1 Parent) */}
              {modalActiveTab === 'style' && (
                <div className="space-y-4">
                  {/* Row 1: SKU Code & Name */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block font-semibold text-[#121214] mb-1">
                        Style SKU Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        placeholder="e.g. BVB-TEE-01"
                        className="w-full rounded-lg border border-[#E8DEC9] bg-[#FAF8F5] p-2.5 font-mono uppercase focus:border-[#C59A46] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#121214] mb-1">
                        Garment Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Oversized Cotton Tee"
                        className="w-full rounded-lg border border-[#E8DEC9] bg-[#FAF8F5] p-2.5 focus:border-[#C59A46] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Row 2: Category, Subcategory, Group (Dynamic from Models) */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block font-semibold text-[#121214] mb-1">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full rounded-lg border border-[#E8DEC9] bg-[#FAF8F5] p-2.5 focus:border-[#C59A46] focus:outline-none"
                      >
                        {(masterCategories.length > 0 ? masterCategories : FALLBACK_CATEGORIES).map((c) => (
                          <option key={c._id || c.slug} value={c.slug || c.name.toLowerCase()}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#121214] mb-1">Group / Product Type</label>
                      <select
                        value={formData.group}
                        onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                        className="w-full rounded-lg border border-[#E8DEC9] bg-[#FAF8F5] p-2.5 focus:border-[#C59A46] focus:outline-none"
                      >
                        {(masterProductTypes.length > 0 ? masterProductTypes : FALLBACK_PRODUCT_TYPES).map((pt) => (
                          <option key={pt._id || pt.name} value={pt.name}>
                            {pt.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#121214] mb-1">Subcategory</label>
                      <input
                        type="text"
                        value={formData.subcategory}
                        onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                        placeholder="e.g. Drop-Shoulder Tees"
                        className="w-full rounded-lg border border-[#E8DEC9] bg-[#FAF8F5] p-2.5 focus:border-[#C59A46] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Row 3: Fabric Quality, GSM & Silhouette Fit (Dynamic from FabricModel & FitModel) */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-semibold text-[#121214]">Fabric Quality</label>
                        {(masterFabrics.length > 0 || FALLBACK_FABRICS.length > 0) && (
                          <span className="text-[9.5px] text-[#9A6D22] font-semibold">⚡ Fabric Master</span>
                        )}
                      </div>
                      <select
                        onChange={(e) => {
                          const allFabs = masterFabrics.length > 0 ? masterFabrics : FALLBACK_FABRICS
                          const fab = allFabs.find((f) => (f._id || f.name) === e.target.value)
                          if (fab) handleSelectMasterFabric(fab)
                        }}
                        defaultValue=""
                        className="mb-1.5 w-full rounded-md border border-[#DFD5C2] bg-[#FAF3E4]/60 p-1.5 text-[11px] font-medium text-[#805915] focus:outline-none cursor-pointer"
                      >
                        <option value="" disabled>Choose preset from Fabric Master...</option>
                        {(masterFabrics.length > 0 ? masterFabrics : FALLBACK_FABRICS).map((f) => (
                          <option key={f._id || f.name} value={f._id || f.name}>
                            {f.name} ({f.gsm}) {f.material ? `· ${f.material}` : ''}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={formData.fabric}
                        onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                        placeholder="e.g. 280 GSM Combed Jersey"
                        className="w-full rounded-lg border border-[#E8DEC9] bg-[#FAF8F5] p-2.5 focus:border-[#C59A46] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#121214] mb-1">Weight / GSM</label>
                      <input
                        type="text"
                        value={formData.gsm}
                        onChange={(e) => setFormData({ ...formData, gsm: e.target.value })}
                        placeholder="e.g. 280 GSM"
                        className="w-full rounded-lg border border-[#E8DEC9] bg-[#FAF8F5] p-2.5 focus:border-[#C59A46] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#121214] mb-1">Silhouette Fit</label>
                      <select
                        value={formData.fit}
                        onChange={(e) => setFormData({ ...formData, fit: e.target.value })}
                        className="w-full rounded-lg border border-[#E8DEC9] bg-[#FAF8F5] p-2.5 focus:border-[#C59A46] focus:outline-none"
                      >
                        {(masterFits.length > 0 ? masterFits : FALLBACK_FITS).map((f) => (
                          <option key={f._id || f.name} value={f.name}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 4: Base Pricing & MOQ (Dynamic from MoqModel) */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                    <div>
                      <label className="block font-semibold text-[#121214] mb-1">
                        Base Wholesale (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.wholesalePrice}
                        onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
                        placeholder="360"
                        className="w-full rounded-lg border border-[#E8DEC9] bg-[#FAF8F5] p-2.5 font-mono focus:border-[#C59A46] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#121214] mb-1">MRP / Retail (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.retailPrice}
                        onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
                        placeholder="999"
                        className="w-full rounded-lg border border-[#E8DEC9] bg-[#FAF8F5] p-2.5 font-mono focus:border-[#C59A46] focus:outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-semibold text-[#121214]">Minimum Order Qty</label>
                        <span className="text-[9.5px] text-[#9A6D22] font-semibold">⚡ MOQ Master</span>
                      </div>
                      <select
                        value={formData.moqType}
                        onChange={(e) => {
                          const allMoqs = masterMoqs.length > 0 ? masterMoqs : FALLBACK_MOQS
                          const sel = allMoqs.find((m) => m.name === e.target.value)
                          if (sel) handleSelectMasterMoq(sel)
                          else setFormData({ ...formData, moqType: e.target.value })
                        }}
                        className="mb-1.5 w-full rounded-md border border-[#DFD5C2] bg-[#FAF3E4]/60 p-1.5 text-[11px] font-medium text-[#805915] focus:outline-none cursor-pointer"
                      >
                        {(masterMoqs.length > 0 ? masterMoqs : FALLBACK_MOQS).map((m) => (
                          <option key={m._id || m.name} value={m.name}>
                            {m.name} ({m.hint || `${m.minQuantity || 1} pcs`})
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={formData.moq}
                        onChange={(e) => setFormData({ ...formData, moq: e.target.value })}
                        placeholder="Editable"
                        className="w-full rounded-lg border border-[#E8DEC9] bg-[#FAF8F5] p-2.5 focus:border-[#C59A46] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#121214] mb-1">Availability</label>
                      <select
                        value={formData.availability}
                        onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                        className="w-full rounded-lg border border-[#E8DEC9] bg-[#FAF8F5] p-2.5 focus:border-[#C59A46] focus:outline-none"
                      >
                        <option value="Ready Stock">Ready Stock</option>
                        <option value="Made to Order">Made to Order</option>
                      </select>
                    </div>
                  </div>

                  {/* Homepage Merchandising & Section Placement */}
                  <div className="rounded-xl border border-[#DFD5C2] bg-[#FFFFFF] p-4 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-[#ECE4D5] pb-2.5">
                      <div>
                        <label className="block font-serif text-sm font-bold text-[#121214]">
                          Homepage Merchandising &amp; Showcase Placement
                        </label>
                        <p className="text-[11px] text-[#6E685E]">
                          Select exactly which section(s) on the homepage this product should appear in:
                        </p>
                      </div>
                      <span className="font-mono text-[9.5px] uppercase font-bold text-[#9A6D22] bg-[#FAF3E4] px-2 py-0.5 rounded border border-[#E8DEC9]">
                        Home Sections
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-1">
                      {/* Section 1: LIVE · ARRIVED THIS MORNING */}
                      <div
                        onClick={() => setFormData((prev) => ({ ...prev, isHeroArrival: !prev.isHeroArrival }))}
                        className={`flex flex-col justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                          formData.isHeroArrival
                            ? 'border-[#1E824C] bg-emerald-50/80 shadow-2xs ring-1 ring-[#1E824C]/30'
                            : 'border-[#E2D8C7] bg-[#FCFBF8] hover:border-[#C59A46]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono text-[10px] font-bold text-[#1E7412] uppercase tracking-wider block">
                              Section 1 (Hero Rail)
                            </span>
                            <span className="font-bold text-xs text-[#121214] block mt-0.5">
                              LIVE · ARRIVED THIS MORNING
                            </span>
                            <span className="text-[10px] text-[#6E685E] block mt-0.5 leading-snug">
                              Tiruppur Mill Lot top carousel
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={Boolean(formData.isHeroArrival)}
                            onChange={(e) => {
                              e.stopPropagation()
                              setFormData((prev) => ({ ...prev, isHeroArrival: e.target.checked }))
                            }}
                            className="h-4 w-4 rounded accent-[#1E824C] cursor-pointer mt-0.5 shrink-0"
                          />
                        </div>
                        {formData.isHeroArrival && (
                          <div className="mt-2.5 pt-2 border-t border-emerald-200" onClick={(e) => e.stopPropagation()}>
                            <label className="block text-[9px] font-mono text-[#1E7412] font-semibold uppercase">
                              Badge Tag (e.g. JERSEYS, HEAVY FLEECE)
                            </label>
                            <input
                              type="text"
                              value={formData.heroTag || ''}
                              onChange={(e) => setFormData({ ...formData, heroTag: e.target.value })}
                              placeholder="e.g. 500 GSM FLEECE"
                              className="mt-1 w-full rounded border border-emerald-300 bg-white px-2 py-1 text-[10px] text-[#121214] font-mono uppercase focus:outline-none"
                            />
                          </div>
                        )}
                      </div>

                      {/* Section 2: RETAILER BESTSELLERS */}
                      <div
                        onClick={() => setFormData((prev) => ({ ...prev, isBestseller: !prev.isBestseller }))}
                        className={`flex flex-col justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                          formData.isBestseller
                            ? 'border-[#C59A46] bg-[#FAF3E4] shadow-2xs ring-1 ring-[#C59A46]/40'
                            : 'border-[#E2D8C7] bg-[#FCFBF8] hover:border-[#C59A46]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono text-[10px] font-bold text-[#9A6D22] uppercase tracking-wider block">
                              Section 3 (Fast Movers)
                            </span>
                            <span className="font-bold text-xs text-[#121214] block mt-0.5">
                              RETAILER BESTSELLERS
                            </span>
                            <span className="text-[10px] text-[#6E685E] block mt-0.5 leading-snug">
                              Repeat Stock · High Margin
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={Boolean(formData.isBestseller)}
                            onChange={(e) => {
                              e.stopPropagation()
                              setFormData((prev) => ({ ...prev, isBestseller: e.target.checked }))
                            }}
                            className="h-4 w-4 rounded accent-[#C59A46] cursor-pointer mt-0.5 shrink-0"
                          />
                        </div>
                        <span className="mt-2.5 text-[10px] font-mono font-semibold text-[#9A6D22]">
                          {formData.isBestseller ? '✓ Active in Bestsellers' : '— Inactive'}
                        </span>
                      </div>

                      {/* Section 3: THE LATEST DROP */}
                      <div
                        onClick={() => setFormData((prev) => ({ ...prev, isLatestDrop: !prev.isLatestDrop }))}
                        className={`flex flex-col justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                          formData.isLatestDrop
                            ? 'border-[#2E72D2] bg-sky-50/80 shadow-2xs ring-1 ring-[#2E72D2]/30'
                            : 'border-[#E2D8C7] bg-[#FCFBF8] hover:border-[#C59A46]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono text-[10px] font-bold text-[#2E72D2] uppercase tracking-wider block">
                              Section 2 (Just Landed)
                            </span>
                            <span className="font-bold text-xs text-[#121214] block mt-0.5">
                              THE LATEST DROP
                            </span>
                            <span className="text-[10px] text-[#6E685E] block mt-0.5 leading-snug">
                              Tabbed category grid
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={Boolean(formData.isLatestDrop)}
                            onChange={(e) => {
                              e.stopPropagation()
                              setFormData((prev) => ({ ...prev, isLatestDrop: e.target.checked }))
                            }}
                            className="h-4 w-4 rounded accent-[#2E72D2] cursor-pointer mt-0.5 shrink-0"
                          />
                        </div>
                        <span className="mt-2.5 text-[10px] font-mono font-semibold text-[#2E72D2]">
                          {formData.isLatestDrop ? '✓ Active in Latest Drop' : '— Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Primary Image Upload Box */}
                  <div className="rounded-xl border border-[#E8DEC9] bg-[#FAF8F5] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block font-bold text-[#121214]">Primary Showcase Image</label>
                        <span className="text-[10px] font-mono text-[#9A6D22]">
                          Upload file or paste image URL
                        </span>
                      </div>

                      <div className="inline-flex rounded-lg border border-[#E2D8C7] bg-[#FFFFFF] p-0.5 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setPrimaryImageMode('file')}
                          className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                            primaryImageMode === 'file'
                              ? 'bg-[#FAF3E4] text-[#805915] shadow-2xs'
                              : 'text-[#7A746B] hover:text-[#121214]'
                          }`}
                        >
                          Upload File
                        </button>
                        <button
                          type="button"
                          onClick={() => setPrimaryImageMode('url')}
                          className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                            primaryImageMode === 'url'
                              ? 'bg-[#FAF3E4] text-[#805915] shadow-2xs'
                              : 'text-[#7A746B] hover:text-[#121214]'
                          }`}
                        >
                          Paste URL
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      {primaryImagePreview ? (
                        <div className="relative group h-24 w-20 shrink-0 overflow-hidden rounded-xl border-2 border-[#C59A46] bg-[#FFFFFF] shadow-sm">
                          <img
                            src={primaryImagePreview}
                            alt="Product preview"
                            className="h-full w-full object-cover object-top"
                          />
                          <button
                            type="button"
                            onClick={handleRemovePrimaryImage}
                            className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold cursor-pointer"
                            title="Remove image"
                          >
                            Remove ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex h-24 w-20 shrink-0 flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#DFD5C2] bg-white text-[#9A9386]">
                          <svg className="h-6 w-6 stroke-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="mt-1 font-mono text-[9px]">No Photo</span>
                        </div>
                      )}

                      <div className="flex-1 w-full">
                        {primaryImageMode === 'file' ? (
                          <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#C59A46]/60 bg-white p-4 cursor-pointer hover:border-[#C59A46] hover:bg-[#FAF8F5] transition-all">
                            <svg className="h-6 w-6 text-[#9A6D22] mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span className="font-semibold text-xs text-[#121214]">
                              {primaryImageFile ? primaryImageFile.name : 'Click to select photo or drag here'}
                            </span>
                            <span className="text-[10px] text-[#8A847C] mt-0.5">
                              Supports JPG, PNG, WEBP (Max 25MB)
                            </span>
                            <input
                              ref={primaryFileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handlePrimaryFileChange}
                              className="hidden"
                            />
                          </label>
                        ) : (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={formData.image || primaryImagePreview}
                              onChange={(e) => {
                                setFormData({ ...formData, image: e.target.value })
                                setPrimaryImagePreview(e.target.value)
                              }}
                              placeholder="https://images.unsplash.com/... or CDN link"
                              className="w-full rounded-lg border border-[#E8DEC9] bg-white p-2.5 font-mono text-xs focus:border-[#C59A46] focus:outline-none"
                            />
                            <span className="text-[10px] text-[#8A847C]">
                              Paste any direct image URL. It will automatically load and preview.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: COLOR VARIANTS & 5 STUDIO PHOTOS (Level 2 Child) */}
              {modalActiveTab === 'variants' && (
                <div className="space-y-5">
                  {/* Master Color Palette Bar (ColorModel.js) */}
                  <div className="rounded-xl border border-[#E8DEC9] bg-[#FAF8F5] p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#121214] flex items-center gap-1.5">
                          <span>🎨 Master Color Palette</span>
                          <span className="rounded bg-[#FAF3E4] px-1.5 py-0.5 text-[9px] font-mono font-bold text-[#805915]">
                            ColorModel
                          </span>
                        </span>
                        <span className="text-[10px] text-[#7A746B] hidden sm:inline">
                          Click to apply to active variant, or &quot;+&quot; to add new color variant
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(masterColors.length > 0 ? masterColors : FALLBACK_COLORS).map((mc) => {
                        const hex = mc.hexCode || mc.hex || '#1F2422'
                        return (
                          <div
                            key={mc._id || mc.name}
                            className="inline-flex items-center rounded-lg border border-[#E0D7C6] bg-white text-xs overflow-hidden shadow-2xs hover:border-[#C59A46] transition-colors"
                          >
                            <button
                              type="button"
                              onClick={() => handleSelectMasterColor(mc, modalColorIdx)}
                              title={`Apply "${mc.name}" to active variant`}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-[#FAF3E4] cursor-pointer"
                            >
                              <span
                                className="h-3.5 w-3.5 rounded-full border border-black/20 shrink-0 shadow-2xs"
                                style={{ backgroundColor: hex }}
                              />
                              <span className="font-semibold text-[11px] text-[#121214]">{mc.name}</span>
                              <span className="font-mono text-[9px] text-[#8A847C]">{hex}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddColorFromMaster(mc)}
                              title={`Add new variant with "${mc.name}"`}
                              className="px-2 py-1.5 border-l border-[#E0D7C6] bg-[#FAF8F5] text-[11px] font-bold text-[#805915] hover:bg-[#FAF3E4] hover:text-[#121214] cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Color Selector Pills */}
                  <div className="flex flex-wrap items-center gap-2 border-b border-[#ECE4D5] pb-3">
                    {formData.colors.map((col, idx) => {
                      const isSel = idx === modalColorIdx
                      const colName = col.name || col.color || `Color ${idx + 1}`
                      const colHex = col.hex || col.colorCode || '#121214'
                      const anglesCount = [
                        col.gallery?.front || col.image,
                        col.gallery?.back,
                        col.gallery?.side,
                        col.gallery?.closeup,
                        col.gallery?.onModel,
                      ].filter(Boolean).length

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setModalColorIdx(idx)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                            isSel
                              ? 'border-[#C59A46] bg-[#FAF3E4] text-[#805915] shadow-2xs ring-1 ring-[#C59A46]'
                              : 'border-[#E8DEC9] bg-white text-[#635E56] hover:bg-[#FAF8F5]'
                          }`}
                        >
                          <span
                            className="h-3 w-3 rounded-full border border-black/20"
                            style={{ backgroundColor: colHex }}
                          />
                          <span>{colName}</span>
                          <span className="text-[9px] font-mono rounded bg-white px-1 py-0.5 border border-[#DFD5C2]">
                            {anglesCount}/5
                          </span>
                        </button>
                      )
                    })}

                    <button
                      type="button"
                      onClick={() => {
                        handleAddColor()
                        setModalColorIdx(formData.colors.length)
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-dashed border-[#C59A46] bg-white px-3 py-1.5 text-xs font-bold text-[#9A6D22] hover:bg-[#FAF3E4] cursor-pointer"
                    >
                      + Add New Color
                    </button>
                  </div>

                  {/* Active Color Details & 5-Angle Studio */}
                  {formData.colors[modalColorIdx] && (
                    <div className="rounded-xl border border-[#E0D7C6] bg-white p-4 space-y-4 shadow-2xs">
                      {/* Top Bar for Selected Color */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0EAE0] pb-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <input
                            type="color"
                            value={
                              formData.colors[modalColorIdx].hex ||
                              formData.colors[modalColorIdx].colorCode ||
                              '#1F2422'
                            }
                            onChange={(e) => {
                              handleColorChange(modalColorIdx, 'hex', e.target.value)
                              handleColorChange(modalColorIdx, 'colorCode', e.target.value)
                            }}
                            className="h-8 w-8 cursor-pointer rounded border border-gray-300 p-0.5 shrink-0"
                            title="Pick HEX color"
                          />
                          <div>
                            <label className="block text-[9.5px] font-mono uppercase text-[#8A847C]">
                              Shade Name
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Obsidian"
                              value={
                                formData.colors[modalColorIdx].name ||
                                formData.colors[modalColorIdx].color ||
                                ''
                              }
                              onChange={(e) => {
                                handleColorChange(modalColorIdx, 'name', e.target.value)
                                handleColorChange(modalColorIdx, 'color', e.target.value)
                              }}
                              className="w-32 rounded-md border border-[#E8DEC9] px-2.5 py-1 text-xs font-bold text-[#121214] focus:outline-none focus:border-[#C59A46]"
                            />
                          </div>

                          <div>
                            <label className="block text-[9.5px] font-mono uppercase text-[#8A847C]">
                              Tone Description
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Obsidian Black"
                              value={formData.colors[modalColorIdx].tone || ''}
                              onChange={(e) =>
                                handleColorChange(modalColorIdx, 'tone', e.target.value)
                              }
                              className="w-36 rounded-md border border-[#E8DEC9] px-2.5 py-1 text-xs focus:outline-none focus:border-[#C59A46]"
                            />
                          </div>

                          <div>
                            <label className="block text-[9.5px] font-mono uppercase text-[#8A847C]">
                              Price Override (₹)
                            </label>
                            <input
                              type="number"
                              placeholder={
                                formData.wholesalePrice
                                  ? `₹${formData.wholesalePrice}`
                                  : 'Base Rate'
                              }
                              value={formData.colors[modalColorIdx].price || ''}
                              onChange={(e) =>
                                handleColorChange(modalColorIdx, 'price', e.target.value)
                              }
                              className="w-24 rounded-md border border-[#E8DEC9] px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-[#C59A46]"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Bulk 5-Photo Upload Button */}
                          <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-[#C59A46] bg-[#FAF3E4] px-3 py-1.5 text-xs font-bold text-[#805915] hover:bg-[#F2E5C9] transition-all shadow-2xs">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            <span>📁 Bulk Upload 5 Photos</span>
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={(e) => handleColorBulkUpload(modalColorIdx, e)}
                              className="hidden"
                            />
                          </label>

                          {formData.colors.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                handleRemoveColor(modalColorIdx)
                                setModalColorIdx(Math.max(0, modalColorIdx - 1))
                              }}
                              className="p-1.5 text-[#8A847C] hover:text-red-600 rounded-md hover:bg-red-50 cursor-pointer"
                              title="Delete color variant"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 5-Angle Editorial Photos Grid */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#9A6D22]">
                            5 Distinct Photo Angles ({formData.colors[modalColorIdx].name || 'Active Color'})
                          </span>
                          <span className="text-[10px] text-[#8A847C]">
                            FRONT · BACK · SIDE · CLOSE-UP · ON MODEL
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          {ANGLE_SLOTS.map(({ key, label, badge, badgeColor }) => {
                            const col = formData.colors[modalColorIdx]
                            const photoUrl =
                              col.gallery?.[key] || (key === 'front' ? col.image : '')

                            return (
                              <div
                                key={key}
                                className="flex flex-col items-center rounded-xl border border-[#E8DEC9] bg-[#FAF8F5] p-2.5 space-y-2 shadow-2xs"
                              >
                                <span
                                  className={`rounded-[3px] px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${badgeColor}`}
                                >
                                  {badge}
                                </span>

                                <div className="relative group h-28 w-20 shrink-0 overflow-hidden rounded-lg border border-[#D9D0C1] bg-white shadow-xs">
                                  {photoUrl ? (
                                    <>
                                      <img
                                        src={photoUrl}
                                        alt={`${col.name} ${label}`}
                                        className="h-full w-full object-cover object-top"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleColorAngleRemove(modalColorIdx, key)}
                                        className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-bold cursor-pointer"
                                        title={`Clear ${badge}`}
                                      >
                                        Remove ✕
                                      </button>
                                    </>
                                  ) : (
                                    <div className="flex h-full w-full flex-col items-center justify-center text-[#B0A89A] p-1 text-center">
                                      <svg
                                        className="h-5 w-5 stroke-1"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                      </svg>
                                      <span className="font-mono text-[8px] mt-0.5">No photo</span>
                                    </div>
                                  )}
                                </div>

                                <div className="w-full flex flex-col gap-1">
                                  <label className="cursor-pointer flex items-center justify-center gap-1 rounded border border-[#DFD5C2] bg-white py-1 px-1.5 text-[9.5px] font-semibold text-[#5C5852] hover:border-[#C59A46] hover:text-[#9A6D22] transition-colors">
                                    <span>Upload</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) =>
                                        handleColorAngleFileChange(modalColorIdx, key, e)
                                      }
                                      className="hidden"
                                    />
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="or URL"
                                    value={
                                      photoUrl?.startsWith('data:')
                                        ? '[Uploaded File]'
                                        : photoUrl || ''
                                    }
                                    onChange={(e) =>
                                      handleColorAngleUrlChange(modalColorIdx, key, e.target.value)
                                    }
                                    className="w-full rounded border border-[#E8DEC9] bg-white px-1.5 py-0.5 text-[9px] font-mono text-center focus:outline-none focus:border-[#C59A46]"
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SIZE SKUs & LIVE STOCK MATRIX (Level 3 SKU Level - SizeModel.js) */}
              {modalActiveTab === 'skus' && (
                <div className="space-y-4">
                  {/* Dynamic Sizing Matrix Manager (Driven by SizeModel.js) */}
                  <div className="rounded-xl border border-[#E8DEC9] bg-[#FAF8F5] p-3.5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ECE4D5] pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-[#121214] flex items-center gap-1.5">
                            <span>📏 Garment Sizing Breakdown</span>
                            <span className="rounded bg-[#FAF3E4] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#805915]">
                              SizeModel.js
                            </span>
                          </h4>
                        </div>
                        <p className="text-[10px] text-[#7A746B] mt-0.5">
                          Select garment sizes to dynamically generate Level 3 SKUs and manage inventory stock across all variants
                        </p>
                      </div>

                      {/* Presets & SKU Synchronizer */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[9.5px] font-mono text-[#8A847C]">Presets:</span>
                        <button
                          type="button"
                          onClick={() => handleApplySizePreset(['S', 'M', 'L', 'XL', 'XXL'])}
                          className="rounded bg-white border border-[#DFD5C2] px-2 py-1 text-[10px] font-semibold text-[#121214] hover:bg-[#FAF3E4] hover:border-[#C59A46] cursor-pointer"
                        >
                          Topwear (S–XXL)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplySizePreset(['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'])}
                          className="rounded bg-white border border-[#DFD5C2] px-2 py-1 text-[10px] font-semibold text-[#121214] hover:bg-[#FAF3E4] hover:border-[#C59A46] cursor-pointer"
                        >
                          Extended (XS–3XL)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplySizePreset(['28', '30', '32', '34', '36'])}
                          className="rounded bg-white border border-[#DFD5C2] px-2 py-1 text-[10px] font-semibold text-[#121214] hover:bg-[#FAF3E4] hover:border-[#C59A46] cursor-pointer"
                        >
                          Bottomwear (28–36)
                        </button>
                        <button
                          type="button"
                          onClick={handleSyncAllSkus}
                          title="Re-synchronize all SKU codes to match style SKU code and color abbreviation"
                          className="rounded bg-[#FAF3E4] border border-[#C59A46] px-2 py-1 text-[10px] font-bold text-[#805915] hover:bg-[#F3E7D3] cursor-pointer ml-1"
                        >
                          ↻ Sync SKU Codes
                        </button>
                      </div>
                    </div>

                    {/* Active Sizes Chips from DB (SizeModel.js) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-semibold uppercase text-[#8A847C]">
                          Click chips to toggle sizes for this style:
                        </span>
                        <span className="text-[10px] font-mono text-[#9A6D22] font-bold">
                          Active Sizes: {formData.sizes || 'None'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {(() => {
                          const availableSizes =
                            masterSizes.length > 0
                              ? masterSizes.map((s) => s.name)
                              : [...FALLBACK_ALPHA_SIZES, ...FALLBACK_NUMERIC_SIZES]

                          const currentActiveList = (formData.sizeList || '')
                            .split(',')
                            .map((s) => s.trim().toUpperCase())
                            .filter(Boolean)

                          const allDisplaySizes = Array.from(new Set([...availableSizes, ...currentActiveList]))

                          return allDisplaySizes.map((szName) => {
                            const isSelected = currentActiveList.includes(szName.toUpperCase())

                            return (
                              <button
                                key={szName}
                                type="button"
                                onClick={() => handleToggleSize(szName)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-[#C59A46] bg-[#FAF3E4] text-[#805915] shadow-2xs ring-1 ring-[#C59A46]'
                                    : 'border-[#DFD5C2] bg-white text-[#635E56] hover:bg-[#FAF8F5] hover:border-[#8A847C]'
                                }`}
                              >
                                <span>{szName}</span>
                                {isSelected ? (
                                  <span className="text-[9px] text-[#805915] font-bold">✓</span>
                                ) : (
                                  <span className="text-[9px] text-[#A69F94]">+</span>
                                )}
                              </button>
                            )
                          })
                        })()}

                        {/* Custom Size Adder */}
                        <div className="inline-flex items-center gap-1 ml-2">
                          <input
                            type="text"
                            placeholder="Custom e.g. 40"
                            value={customSizeInput}
                            onChange={(e) => setCustomSizeInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleAddCustomSize()
                              }
                            }}
                            className="w-24 rounded-lg border border-[#DFD5C2] bg-white px-2 py-1 text-xs font-mono focus:border-[#C59A46] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleAddCustomSize}
                            className="rounded-lg bg-[#FAF3E4] border border-[#C59A46] px-2 py-1 text-xs font-bold text-[#805915] hover:bg-[#F3E7D3] cursor-pointer"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Color Selector Pills */}
                  <div className="flex flex-wrap items-center gap-2 border-b border-[#ECE4D5] pb-3">
                    {formData.colors.map((col, idx) => {
                      const isSel = idx === modalColorIdx
                      const colName = col.name || col.color || `Color ${idx + 1}`
                      const colHex = col.hex || col.colorCode || '#121214'
                      const totalPieces = (col.skus || []).reduce(
                        (a, s) => a + (Number(s.stock) || 0),
                        0,
                      )

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setModalColorIdx(idx)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                            isSel
                              ? 'border-[#C59A46] bg-[#FAF3E4] text-[#805915] shadow-2xs ring-1 ring-[#C59A46]'
                              : 'border-[#E8DEC9] bg-white text-[#635E56] hover:bg-[#FAF8F5]'
                          }`}
                        >
                          <span
                            className="h-3 w-3 rounded-full border border-black/20"
                            style={{ backgroundColor: colHex }}
                          />
                          <span>{colName}</span>
                          <span className="text-[9px] font-mono rounded bg-white px-1 py-0.5 border border-[#DFD5C2]">
                            {totalPieces} pcs
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Active Color SKU Table */}
                  {formData.colors[modalColorIdx] && (
                    <div className="rounded-xl border border-[#E0D7C6] bg-white p-4 space-y-4 shadow-2xs">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0EAE0] pb-3">
                        <div>
                          <h4 className="font-sans font-bold text-[#121214] text-sm">
                            Inventory Matrix:{' '}
                            {formData.colors[modalColorIdx].name || 'Active Color'}
                          </h4>
                          <span className="font-mono text-[10px] text-[#7A746B]">
                            Stock is tracked at the unique SKU level (Color + Size combo)
                          </span>
                        </div>

                        {/* Batch Fill Stock Buttons */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] text-[#8A847C] font-mono">Fill All:</span>
                          <button
                            type="button"
                            onClick={() => handleBatchFillStock(modalColorIdx, 25)}
                            className="rounded bg-[#FAF8F5] border border-[#DFD5C2] px-2 py-1 font-mono text-[10px] font-bold text-[#805915] hover:bg-[#FAF3E4] cursor-pointer"
                          >
                            25 pcs
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBatchFillStock(modalColorIdx, 50)}
                            className="rounded bg-[#FAF8F5] border border-[#DFD5C2] px-2 py-1 font-mono text-[10px] font-bold text-[#805915] hover:bg-[#FAF3E4] cursor-pointer"
                          >
                            50 pcs
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBatchFillStock(modalColorIdx, 100)}
                            className="rounded bg-[#FAF8F5] border border-[#DFD5C2] px-2 py-1 font-mono text-[10px] font-bold text-[#805915] hover:bg-[#FAF3E4] cursor-pointer"
                          >
                            100 pcs
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBatchFillStock(modalColorIdx, 0)}
                            className="rounded bg-rose-50 border border-rose-200 px-2 py-1 font-mono text-[10px] font-bold text-rose-700 hover:bg-rose-100 cursor-pointer"
                          >
                            Zero (OOS)
                          </button>
                        </div>
                      </div>

                      {/* SKU Cards Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(formData.colors[modalColorIdx].skus || []).map((skuObj, sIdx) => {
                          const isOos = Number(skuObj.stock) <= 0
                          const isLow = Number(skuObj.stock) > 0 && Number(skuObj.stock) <= 10

                          return (
                            <div
                              key={skuObj.size || sIdx}
                              className={`rounded-xl border p-3.5 space-y-2 transition-all ${
                                isOos
                                  ? 'border-rose-200 bg-rose-50/30'
                                  : isLow
                                  ? 'border-amber-200 bg-amber-50/20'
                                  : 'border-[#E8DEC9] bg-[#FAF8F5]'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-sm text-[#121214]">
                                    Size {skuObj.size}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleSize(skuObj.size)}
                                    title={`Remove size ${skuObj.size} from style`}
                                    className="text-[10px] text-gray-400 hover:text-rose-600 px-1 hover:bg-rose-50 rounded cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[9px] font-bold font-mono ${
                                    isOos
                                      ? 'bg-rose-100 text-rose-700'
                                      : isLow
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {isOos ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                                </span>
                              </div>

                              <div className="font-mono text-[9px] text-[#7A746B] truncate bg-white px-2 py-1 rounded border border-[#E8DEC9]" title={skuObj.sku}>
                                {skuObj.sku}
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <span className="text-[10px] font-semibold text-[#5C5852]">
                                  Stock Units:
                                </span>

                                <div className="inline-flex items-center rounded border border-[#DFD5C2] bg-white">
                                  <button
                                    type="button"
                                    onClick={() => handleSkuStockStep(modalColorIdx, sIdx, -1)}
                                    className="px-2 py-0.5 text-xs font-bold text-[#5C5852] hover:bg-[#FAF8F5] cursor-pointer"
                                  >
                                    −
                                  </button>
                                  <input
                                    type="number"
                                    min="0"
                                    value={skuObj.stock ?? 25}
                                    onChange={(e) =>
                                      handleSkuStockChange(modalColorIdx, sIdx, e.target.value)
                                    }
                                    className="w-12 text-center font-mono font-bold text-xs focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSkuStockStep(modalColorIdx, sIdx, +1)}
                                    className="px-2 py-0.5 text-xs font-bold text-[#5C5852] hover:bg-[#FAF8F5] cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: SPECS & COPY */}
              {modalActiveTab === 'copy' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-semibold text-[#121214] mb-1">
                      Sizes Available (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.sizeList}
                      onChange={(e) => setFormData({ ...formData, sizeList: e.target.value })}
                      placeholder="S, M, L, XL, XXL (or 28, 30, 32, 34, 36)"
                      className="w-full rounded-lg border border-[#E8DEC9] bg-[#FAF8F5] p-2.5 font-mono text-xs focus:border-[#C59A46] focus:outline-none"
                    />
                    <span className="text-[10px] text-[#8A847C] mt-0.5 block">
                      Controls the sizes generated for all Level 3 SKUs.
                    </span>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#121214] mb-1">
                      Garment Technical Summary
                    </label>
                    <textarea
                      rows={3}
                      value={formData.summary}
                      onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                      placeholder="e.g. A contemporary menswear staple cut in combed jersey for clean retail merchandising..."
                      className="w-full rounded-lg border border-[#E8DEC9] bg-[#FAF8F5] p-2.5 text-xs leading-relaxed focus:border-[#C59A46] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#121214] mb-1">
                      Key Highlights (One per line)
                    </label>
                    <textarea
                      rows={4}
                      value={formData.highlights}
                      onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
                      placeholder="280 GSM mill-tested jersey&#10;Oversized relaxed block&#10;MOQ flexible size breakdown"
                      className="w-full rounded-lg border border-[#E8DEC9] bg-[#FAF8F5] p-2.5 text-xs font-mono leading-relaxed focus:border-[#C59A46] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Modal Actions Footer */}
              <div className="flex items-center justify-between border-t border-[#ECE4D5] pt-4 mt-6">
                <div>
                  {modalActiveTab !== 'style' && (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs = ['style', 'variants', 'skus', 'copy']
                        const curIdx = tabs.indexOf(modalActiveTab)
                        if (curIdx > 0) setModalActiveTab(tabs[curIdx - 1])
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#7A746B] hover:text-[#121214] cursor-pointer"
                    >
                      ← Previous Step
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="rounded-xl border border-[#DFD5C2] bg-white px-4 py-2 text-xs font-semibold text-[#6B6357] hover:bg-[#FAF8F5] cursor-pointer"
                  >
                    Cancel
                  </button>

                  {modalActiveTab !== 'copy' ? (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs = ['style', 'variants', 'skus', 'copy']
                        const curIdx = tabs.indexOf(modalActiveTab)
                        if (curIdx < tabs.length - 1) setModalActiveTab(tabs[curIdx + 1])
                      }}
                      className="rounded-xl bg-[#121214] px-4 py-2 text-xs font-bold text-[#FAD79F] hover:bg-[#1E1E22] transition-colors cursor-pointer"
                    >
                      Continue to Next Step →
                    </button>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-gradient-to-r from-[#ECC880] to-[#C59A46] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#121214] hover:brightness-105 disabled:opacity-50 shadow-xs cursor-pointer"
                  >
                    {isSubmitting
                      ? 'Saving Style & SKUs...'
                      : editingProduct
                      ? 'Update Style & SKUs'
                      : 'Publish Wholesale Style'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
