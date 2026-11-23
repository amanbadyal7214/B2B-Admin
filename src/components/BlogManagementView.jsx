import { useState, useEffect } from 'react'
import {
  getAdminBlogsApi,
  createBlogApi,
  updateBlogApi,
  deleteBlogApi,
  toggleBlogPublishApi,
} from '../api'

const STANDARD_CATEGORIES = [
  'Fabric & GSM',
  'Wholesale Economics',
  'Sizing & Pack Ratios',
  'Market Trends',
  'Retail Strategy',
  'Mill Direct',
]

function BlogManagementView({ currentUser }) {
  const [blogs, setBlogs] = useState([])
  const [stats, setStats] = useState({
    totalArticles: 0,
    publishedCount: 0,
    draftCount: 0,
    totalViews: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingBlog, setEditingBlog] = useState(null)
  const [previewMode, setPreviewMode] = useState(false)

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: 'Fabric & GSM',
    tags: '',
    excerpt: '',
    coverImageUrl: '',
    authorName: 'Buddy Vs Buff Textile Lab',
    authorRole: 'Senior Fabric Technologist',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    status: 'published',
    featured: false,
    contentHtml: '',
  })

  // Auto-slug generator
  const slugify = (text) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const fetchBlogs = async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const res = await getAdminBlogsApi({
        search: searchQuery,
        status: statusFilter,
        category: categoryFilter,
      })

      if (res?.success) {
        setBlogs(res.data || [])
        if (res.stats) {
          setStats(res.stats)
        }
      } else {
        setErrorMessage(res?.message || 'Failed to load editorial articles')
      }
    } catch (err) {
      console.error('fetchBlogs error:', err)
      setErrorMessage(err.response?.data?.message || err.message || 'Network error fetching articles')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBlogs()
  }, [statusFilter, categoryFilter])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchBlogs()
  }

  const openCreateModal = () => {
    setEditingBlog(null)
    setFormData({
      title: '',
      slug: '',
      category: 'Fabric & GSM',
      tags: '240 GSM, Streetwear, Tiruppur',
      excerpt: '',
      coverImageUrl:
        'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80',
      authorName: currentUser?.name || 'Buddy Vs Buff Textile Lab',
      authorRole: 'Senior Fabric Technologist',
      authorAvatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      status: 'published',
      featured: false,
      contentHtml: `<h2>Article Heading</h2>\n<p>Write detailed textile insights, GSM comparisons, or boutique inventory strategies here...</p>`,
    })
    setPreviewMode(false)
    setIsModalOpen(true)
  }

  const openEditModal = (blog) => {
    setEditingBlog(blog)
    setFormData({
      title: blog.title || '',
      slug: blog.slug || '',
      category: blog.category || 'Fabric & GSM',
      tags: Array.isArray(blog.tags) ? blog.tags.join(', ') : '',
      excerpt: blog.excerpt || '',
      coverImageUrl: blog.coverImageUrl || '',
      authorName: blog.author?.name || 'Buddy Vs Buff Textile Lab',
      authorRole: blog.author?.role || 'Senior Fabric Technologist',
      authorAvatar: blog.author?.avatar || '',
      status: blog.status || 'published',
      featured: Boolean(blog.featured),
      contentHtml: blog.contentHtml || '',
    })
    setPreviewMode(false)
    setIsModalOpen(true)
  }

  const handleTitleChange = (val) => {
    setFormData((prev) => {
      const updated = { ...prev, title: val }
      // Auto update slug if not currently editing or if slug was generated from title
      if (!editingBlog) {
        updated.slug = slugify(val)
      }
      return updated
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.excerpt.trim() || !formData.contentHtml.trim()) {
      setErrorMessage('Please fill in title, excerpt, and article content body.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const payload = {
        title: formData.title.trim(),
        slug: formData.slug ? slugify(formData.slug) : slugify(formData.title),
        category: formData.category,
        tags: formData.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        excerpt: formData.excerpt.trim(),
        coverImageUrl: formData.coverImageUrl.trim(),
        author: {
          name: formData.authorName.trim(),
          role: formData.authorRole.trim(),
          avatar: formData.authorAvatar.trim(),
        },
        status: formData.status,
        featured: formData.featured,
        contentHtml: formData.contentHtml,
      }

      let res
      if (editingBlog) {
        res = await updateBlogApi(editingBlog._id, payload)
      } else {
        res = await createBlogApi(payload)
      }

      if (res?.success) {
        setSuccessMessage(
          editingBlog
            ? 'Article updated successfully!'
            : 'New editorial article published successfully!'
        )
        setIsModalOpen(false)
        fetchBlogs()
      } else {
        setErrorMessage(res?.message || 'Failed to save article')
      }
    } catch (err) {
      console.error('Save blog error:', err)
      setErrorMessage(err.response?.data?.message || err.message || 'Error saving article')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTogglePublish = async (blog) => {
    try {
      const res = await toggleBlogPublishApi(blog._id)
      if (res?.success) {
        setSuccessMessage(`Article "${blog.title.slice(0, 24)}..." is now ${res.data?.status}`)
        fetchBlogs()
      }
    } catch (err) {
      console.error('togglePublish error:', err)
      setErrorMessage('Failed to toggle article status')
    }
  }

  const handleDelete = async (blog) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${blog.title}"?`)) {
      return
    }

    try {
      const res = await deleteBlogApi(blog._id)
      if (res?.success) {
        setSuccessMessage('Article deleted successfully')
        fetchBlogs()
      }
    } catch (err) {
      console.error('delete error:', err)
      setErrorMessage('Failed to delete article')
    }
  }

  // Quick insertion helpers for editor
  const insertTag = (openTag, closeTag = '') => {
    setFormData((prev) => ({
      ...prev,
      contentHtml: prev.contentHtml + `\n${openTag}Content here${closeTag}\n`,
    }))
  }

  return (
    <div className="space-y-6">
      {/* Top Header Strip */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F95700]/10 text-[#F95700] border border-[#F95700]/20">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#121214] sm:text-2xl">
                Editorial &amp; Blog CMS
              </h1>
              <p className="text-xs text-[#7A746B]">
                Publish B2B textile guides, GSM economics, sizing ratios &amp; boutique trend articles.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F95700] px-4 py-2.5 text-xs font-semibold text-white shadow-[0_4px_14px_rgba(249,87,0,0.3)] transition-all hover:bg-[#e04e00] hover:shadow-[0_6px_20px_rgba(249,87,0,0.4)]"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Write New Article</span>
        </button>
      </div>

      {/* Alert Notices */}
      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 flex items-center justify-between">
          <span>{errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage('')} className="font-bold text-red-600 hover:text-red-900">✕</button>
        </div>
      )}
      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 flex items-center justify-between">
          <span>{successMessage}</span>
          <button type="button" onClick={() => setSuccessMessage('')} className="font-bold text-emerald-600 hover:text-emerald-900">✕</button>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <div className="rounded-xl border border-[#ECE4D5] bg-white p-4 shadow-xs">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#9A9386]">Total Articles</div>
          <div className="mt-1 text-2xl font-bold text-[#121214]">{stats.totalArticles}</div>
          <div className="mt-0.5 text-[11px] text-[#7A746B]">In BVB Content Engine</div>
        </div>

        <div className="rounded-xl border border-[#ECE4D5] bg-white p-4 shadow-xs">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#1E824C]">Published &amp; Live</div>
          <div className="mt-1 text-2xl font-bold text-[#1E824C]">{stats.publishedCount}</div>
          <div className="mt-0.5 text-[11px] text-[#7A746B]">Accessible to retail buyers</div>
        </div>

        <div className="rounded-xl border border-[#ECE4D5] bg-white p-4 shadow-xs">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#D97706]">Draft Articles</div>
          <div className="mt-1 text-2xl font-bold text-[#D97706]">{stats.draftCount}</div>
          <div className="mt-0.5 text-[11px] text-[#7A746B]">Under editorial review</div>
        </div>

        <div className="rounded-xl border border-[#ECE4D5] bg-white p-4 shadow-xs">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#F95700]">Total Reads</div>
          <div className="mt-1 text-2xl font-bold text-[#F95700]">{stats.totalViews}</div>
          <div className="mt-0.5 text-[11px] text-[#7A746B]">Cumulative buyer impressions</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#ECE4D5] bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {['ALL', 'published', 'draft'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                statusFilter === status
                  ? 'bg-[#0B1E38] text-white shadow-xs'
                  : 'bg-[#FAF8F5] text-[#6B6357] hover:bg-[#F0EAE1]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Category & Search Form */}
        <div className="flex flex-1 flex-col sm:flex-row items-center justify-end gap-2.5 max-w-xl">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-44 rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3 py-2 text-xs font-medium text-[#121214] focus:border-[#C59A46] focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {STANDARD_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, tag, keywords..."
              className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] py-2 pl-3 pr-8 text-xs text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none"
            />
            <button
              type="submit"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9A9386] hover:text-[#121214]"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Articles Listing Table */}
      <div className="overflow-hidden rounded-2xl border border-[#ECE4D5] bg-white shadow-xs">
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#F95700] border-t-transparent" />
            <span className="font-mono text-xs uppercase tracking-wider text-[#7A746B]">
              Loading BVB Editorial Stream...
            </span>
          </div>
        ) : blogs.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FAF8F5] text-[#9A9386]">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <div className="text-sm font-semibold text-[#121214]">No Editorial Articles Found</div>
            <p className="text-xs text-[#7A746B] max-w-sm">
              Publish your first wholesale textile article or adjust your search filter criteria.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-2 rounded-xl bg-[#0B1E38] px-4 py-2 text-xs font-semibold text-white hover:bg-[#122744]"
            >
              Create New Article
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#ECE4D5] bg-[#FAF8F5] font-mono text-[11px] uppercase tracking-wider text-[#7A746B]">
                <tr>
                  <th className="py-3 pl-4 pr-3">Article</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3">Author</th>
                  <th className="px-3 py-3 text-center">Metrics</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="py-3 pl-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE1]">
                {blogs.map((blog) => (
                  <tr key={blog._id} className="transition-colors hover:bg-[#FCFBF9]">
                    {/* Article Thumbnail & Title */}
                    <td className="py-3.5 pl-4 pr-3">
                      <div className="flex items-start gap-3">
                        <img
                          src={blog.coverImageUrl || 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80'}
                          alt={blog.title}
                          className="h-12 w-16 shrink-0 rounded-lg object-cover border border-[#E8DEC9]"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#121214] line-clamp-1 hover:text-[#F95700]">
                              {blog.title}
                            </span>
                            {blog.featured && (
                              <span className="shrink-0 rounded bg-[#FAF3E4] px-1.5 py-0.5 font-mono text-[9.5px] font-bold uppercase text-[#805915]">
                                Featured
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[10px] text-[#9A9386] truncate">
                            /blog/{blog.slug}
                          </div>
                          <p className="mt-1 line-clamp-1 text-[11.5px] text-[#6B6357]">
                            {blog.excerpt}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category & Tags */}
                    <td className="px-3 py-3.5 align-middle">
                      <span className="inline-block rounded-md bg-[#FAF8F5] px-2 py-1 font-mono text-[10.5px] font-semibold text-[#55514B] border border-[#EBE3D3]">
                        {blog.category}
                      </span>
                      {blog.tags && blog.tags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {blog.tags.slice(0, 2).map((t) => (
                            <span key={t} className="text-[10px] text-[#8E9CAE]">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Author */}
                    <td className="px-3 py-3.5 align-middle">
                      <div className="flex items-center gap-2">
                        {blog.author?.avatar ? (
                          <img
                            src={blog.author.avatar}
                            alt={blog.author.name}
                            className="h-6 w-6 rounded-full object-cover border border-[#DFD8CA]"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-[#E5D7B7] flex items-center justify-center font-bold text-[10px]">
                            {blog.author?.name?.[0] || 'B'}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-[#121214] text-[11.5px]">
                            {blog.author?.name || 'BVB Team'}
                          </div>
                          <div className="text-[10px] text-[#9A9386]">
                            {blog.author?.role || 'Technologist'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Metrics */}
                    <td className="px-3 py-3.5 align-middle text-center">
                      <div className="font-mono font-bold text-[#121214] text-[12px]">
                        {blog.views || 0}
                      </div>
                      <div className="text-[10px] text-[#8A847B]">
                        {blog.readingTime || 3} min read
                      </div>
                    </td>

                    {/* Status with Quick Toggle */}
                    <td className="px-3 py-3.5 align-middle text-center">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(blog)}
                        title="Click to toggle Draft / Published"
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold transition-all ${
                          blog.status === 'published'
                            ? 'bg-[#EBF7F0] text-[#1E824C] hover:bg-[#d8efe2]'
                            : 'bg-[#FEF6E7] text-[#D97706] hover:bg-[#faeccb]'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          blog.status === 'published' ? 'bg-[#1E824C]' : 'bg-[#D97706]'
                        }`} />
                        <span className="capitalize">{blog.status}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 pl-3 pr-4 align-middle text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(blog)}
                          className="rounded-lg p-1.5 text-[#6B6357] hover:bg-[#F2ECE1] hover:text-[#121214] transition-colors"
                          title="Edit Article"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(blog)}
                          className="rounded-lg p-1.5 text-[#B92D25] hover:bg-red-50 transition-colors"
                          title="Delete Article"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Write / Edit Article Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs">
          <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-[#DFD5C2] bg-white shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#ECE4D5] px-6 py-4 bg-[#FAF8F5]">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#121214]">
                  {editingBlog ? 'Edit Editorial Article' : 'Compose New B2B Editorial Article'}
                </h3>
                <p className="font-mono text-[10px] uppercase tracking-wider text-[#9A6D22]">
                  {editingBlog ? `ID: ${editingBlog._id}` : 'Buddy Vs Buff Content Engine'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-[#8A847B] hover:bg-[#F2ECE1] hover:text-[#121214]"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Scrollable Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Row 1: Title & Auto Slug */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#55514B] mb-1">
                    Article Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. The Economics of 240 GSM Luxury Tees"
                    className="w-full rounded-xl border border-[#DFD8CA] bg-[#FAF8F5] px-3.5 py-2 text-xs font-semibold text-[#121214] focus:border-[#F95700] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#55514B]">
                      URL Slug *
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, slug: slugify(p.title) }))}
                      className="text-[10px] text-[#9A6D22] hover:underline"
                    >
                      Regenerate from Title
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData((p) => ({ ...p, slug: slugify(e.target.value) }))}
                    placeholder="e.g. economics-of-240-gsm-luxury-tees"
                    className="w-full rounded-xl border border-[#DFD8CA] bg-[#FAF8F5] px-3.5 py-2 text-xs font-mono text-[#121214] focus:border-[#F95700] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 2: Category, Tags, Status, Featured */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#55514B] mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                    className="w-full rounded-xl border border-[#DFD8CA] bg-[#FAF8F5] px-3 py-2 text-xs font-medium text-[#121214] focus:border-[#F95700] focus:bg-white focus:outline-none"
                  >
                    {STANDARD_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#55514B] mb-1">
                    Tags (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData((p) => ({ ...p, tags: e.target.value }))}
                    placeholder="240 GSM, Streetwear, Margins"
                    className="w-full rounded-xl border border-[#DFD8CA] bg-[#FAF8F5] px-3.5 py-2 text-xs text-[#121214] focus:border-[#F95700] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#55514B] mb-1">
                    Publication Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                    className="w-full rounded-xl border border-[#DFD8CA] bg-[#FAF8F5] px-3 py-2 text-xs font-medium text-[#121214] focus:border-[#F95700] focus:bg-white focus:outline-none"
                  >
                    <option value="published">Published &amp; Live</option>
                    <option value="draft">Draft (Saved only)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="featuredCheckbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData((p) => ({ ...p, featured: e.target.checked }))}
                    className="h-4 w-4 rounded text-[#F95700] focus:ring-[#F95700]"
                  />
                  <label htmlFor="featuredCheckbox" className="text-xs font-semibold text-[#121214] cursor-pointer">
                    Pin as Featured Hero
                  </label>
                </div>
              </div>

              {/* Row 3: Cover Image URL & Preview */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#55514B] mb-1">
                  Banner / Cover Image URL
                </label>
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={formData.coverImageUrl}
                    onChange={(e) => setFormData((p) => ({ ...p, coverImageUrl: e.target.value }))}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="flex-1 rounded-xl border border-[#DFD8CA] bg-[#FAF8F5] px-3.5 py-2 text-xs text-[#121214] focus:border-[#F95700] focus:bg-white focus:outline-none"
                  />
                  {formData.coverImageUrl && (
                    <img
                      src={formData.coverImageUrl}
                      alt="Cover Preview"
                      className="h-9 w-14 rounded-lg object-cover border border-[#DFD8CA]"
                    />
                  )}
                </div>
              </div>

              {/* Row 4: Short Excerpt / Summary */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#55514B] mb-1">
                  Article Summary / Excerpt * (Displayed on listing cards)
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.excerpt}
                  onChange={(e) => setFormData((p) => ({ ...p, excerpt: e.target.value }))}
                  placeholder="Brief summary explaining what retail buyers will learn from this article..."
                  className="w-full rounded-xl border border-[#DFD8CA] bg-[#FAF8F5] px-3.5 py-2 text-xs text-[#121214] focus:border-[#F95700] focus:bg-white focus:outline-none leading-relaxed"
                />
              </div>

              {/* Row 5: Author Info Strip */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 bg-[#FAF8F5] p-3.5 rounded-xl border border-[#ECE4D5]">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#7A746B] mb-0.5">Author Name</label>
                  <input
                    type="text"
                    value={formData.authorName}
                    onChange={(e) => setFormData((p) => ({ ...p, authorName: e.target.value }))}
                    className="w-full rounded-lg border border-[#DFD8CA] bg-white px-2.5 py-1.5 text-xs text-[#121214]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#7A746B] mb-0.5">Author Role</label>
                  <input
                    type="text"
                    value={formData.authorRole}
                    onChange={(e) => setFormData((p) => ({ ...p, authorRole: e.target.value }))}
                    className="w-full rounded-lg border border-[#DFD8CA] bg-white px-2.5 py-1.5 text-xs text-[#121214]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#7A746B] mb-0.5">Author Avatar URL</label>
                  <input
                    type="url"
                    value={formData.authorAvatar}
                    onChange={(e) => setFormData((p) => ({ ...p, authorAvatar: e.target.value }))}
                    className="w-full rounded-lg border border-[#DFD8CA] bg-white px-2.5 py-1.5 text-xs text-[#121214]"
                  />
                </div>
              </div>

              {/* Row 6: Rich Content HTML Editor & Quick Tools */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#55514B]">
                      Article Content Body (HTML) *
                    </span>
                    <button
                      type="button"
                      onClick={() => setPreviewMode(!previewMode)}
                      className="rounded bg-[#FAF3E4] px-2 py-0.5 font-mono text-[10px] font-bold text-[#805915] hover:bg-[#faebd0]"
                    >
                      {previewMode ? 'Switch to Code Editor' : 'Toggle Live HTML Preview'}
                    </button>
                  </div>

                  {!previewMode && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => insertTag('<h2>', '</h2>')}
                        className="rounded bg-white px-1.5 py-0.5 border border-[#DFD8CA] text-[10px] font-bold hover:bg-[#F2ECE1]"
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTag('<h3>', '</h3>')}
                        className="rounded bg-white px-1.5 py-0.5 border border-[#DFD8CA] text-[10px] font-bold hover:bg-[#F2ECE1]"
                      >
                        H3
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTag('<p>', '</p>')}
                        className="rounded bg-white px-1.5 py-0.5 border border-[#DFD8CA] text-[10px] hover:bg-[#F2ECE1]"
                      >
                        Paragraph
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTag('<blockquote>', '</blockquote>')}
                        className="rounded bg-white px-1.5 py-0.5 border border-[#DFD8CA] text-[10px] hover:bg-[#F2ECE1]"
                      >
                        Quote
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTag('<ul>\n  <li>', '</li>\n</ul>')}
                        className="rounded bg-white px-1.5 py-0.5 border border-[#DFD8CA] text-[10px] hover:bg-[#F2ECE1]"
                      >
                        List
                      </button>
                    </div>
                  )}
                </div>

                {previewMode ? (
                  <div
                    className="prose prose-sm max-w-none rounded-xl border border-[#DFD8CA] bg-[#FAF8F5] p-5 max-h-72 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: formData.contentHtml }}
                  />
                ) : (
                  <textarea
                    rows={8}
                    required
                    value={formData.contentHtml}
                    onChange={(e) => setFormData((p) => ({ ...p, contentHtml: e.target.value }))}
                    placeholder="<p>Write your detailed article body in semantic HTML...</p>"
                    className="w-full rounded-xl border border-[#DFD8CA] bg-[#FCFBF8] p-3.5 font-mono text-xs text-[#121214] focus:border-[#F95700] focus:bg-white focus:outline-none leading-relaxed"
                  />
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ECE4D5]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-[#DFD8CA] bg-white px-4 py-2 text-xs font-semibold text-[#6B6357] hover:bg-[#FAF8F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#F95700] px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-[#e04e00] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Saving Article...</span>
                    </>
                  ) : (
                    <span>{editingBlog ? 'Update Article' : 'Publish Article'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default BlogManagementView
