import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { DollarSign, TrendingUp, Briefcase, Plus, X, Edit2, Trash2, ExternalLink } from 'lucide-react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const CRM = () => {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editingDeal, setEditingDeal] = useState(null)
  const [showBidHistoryModal, setShowBidHistoryModal] = useState(false)
  
  const [formData, setFormData] = useState({
    bid_history_id: null,
    project_title: '',
    project_url: '',
    platform: 'Freelancer',
    client_payment: '',
    outsource_cost: '',
    platform_fee_percentage: '10',
    status: 'active'
  })

  // Fetch CRM stats
  const { data: stats } = useQuery({
    queryKey: ['crm-stats'],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/crm/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch stats')
      return response.json()
    }
  })

  // Fetch closed deals
  const { data: dealsData, isLoading } = useQuery({
    queryKey: ['crm-deals'],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/crm/deals?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch deals')
      return response.json()
    }
  })

  // Fetch bid history for selection
  const { data: bidHistoryData } = useQuery({
    queryKey: ['bid-history'],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/autobid/history?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch bid history')
      return response.json()
    },
    enabled: showBidHistoryModal
  })

  // Create deal mutation
  const createDealMutation = useMutation({
    mutationFn: async (dealData) => {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/crm/deals`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dealData)
      })
      if (!response.ok) throw new Error('Failed to create deal')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['crm-deals'])
      queryClient.invalidateQueries(['crm-stats'])
      toast.success('Deal created successfully')
      setShowModal(false)
      resetForm()
    },
    onError: () => {
      toast.error('Failed to create deal')
    }
  })

  // Update deal mutation
  const updateDealMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/crm/deals/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to update deal')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['crm-deals'])
      queryClient.invalidateQueries(['crm-stats'])
      toast.success('Deal updated successfully')
      setShowModal(false)
      setEditingDeal(null)
      resetForm()
    },
    onError: () => {
      toast.error('Failed to update deal')
    }
  })

  // Delete deal mutation
  const deleteDealMutation = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/crm/deals/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to delete deal')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['crm-deals'])
      queryClient.invalidateQueries(['crm-stats'])
      toast.success('Deal deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete deal')
    }
  })

  const resetForm = () => {
    setFormData({
      bid_history_id: null,
      project_title: '',
      project_url: '',
      platform: 'Freelancer',
      client_payment: '',
      outsource_cost: '',
      platform_fee_percentage: '10',
      status: 'active'
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Calculate platform fee from percentage
    const clientPayment = parseFloat(formData.client_payment) || 0
    const platformFeePercentage = parseFloat(formData.platform_fee_percentage) || 0
    const platformFee = (clientPayment * platformFeePercentage) / 100
    
    const submitData = {
      ...formData,
      platform_fee: platformFee
    }
    
    if (editingDeal) {
      updateDealMutation.mutate({ id: editingDeal.id, data: submitData })
    } else {
      createDealMutation.mutate(submitData)
    }
  }

  const handleEdit = (deal) => {
    setEditingDeal(deal)
    // Calculate percentage from fee amount
    const feePercentage = deal.client_payment > 0 
      ? ((deal.platform_fee / deal.client_payment) * 100).toFixed(1)
      : '10'
    
    setFormData({
      bid_history_id: deal.bid_history_id,
      project_title: deal.project_title,
      project_url: deal.project_url || '',
      platform: deal.platform,
      client_payment: deal.client_payment.toString(),
      outsource_cost: deal.outsource_cost.toString(),
      platform_fee_percentage: feePercentage,
      status: deal.status
    })
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this deal?')) {
      deleteDealMutation.mutate(id)
    }
  }

  const handleSelectBidHistory = (bid) => {
    setFormData({
      ...formData,
      bid_history_id: bid.id,
      project_title: bid.project_title,
      project_url: bid.url || '',
      platform: 'Freelancer',
      client_payment: bid.amount.toString()
    })
    setShowBidHistoryModal(false)
  }

  const calculateProfit = () => {
    const client = parseFloat(formData.client_payment) || 0
    const outsource = parseFloat(formData.outsource_cost) || 0
    const feePercentage = parseFloat(formData.platform_fee_percentage) || 0
    const fee = (client * feePercentage) / 100
    return (client - outsource - fee).toFixed(2)
  }
  
  const calculatePlatformFee = () => {
    const client = parseFloat(formData.client_payment) || 0
    const feePercentage = parseFloat(formData.platform_fee_percentage) || 0
    return ((client * feePercentage) / 100).toFixed(2)
  }

  const deals = dealsData?.deals || []
  const crmStats = stats || { total_revenue: 0, total_profit: 0, total_deals: 0, active_deals: 0 }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">CRM Dashboard</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage your closed deals and track revenue</p>
        </div>
        <button
          onClick={() => {
            setEditingDeal(null)
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Add Deal
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-[#1f1f1f] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-start justify-between mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
            <DollarSign size={18} className="text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-300">${crmStats.total_revenue.toFixed(0)}</p>
          <p className="text-sm text-gray-600 mt-2">From closed deals</p>
        </div>

        <div className="bg-white dark:bg-[#1f1f1f] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-start justify-between mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Profit</p>
            <TrendingUp size={18} className="text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-300">${crmStats.total_profit.toFixed(0)}</p>
          <p className="text-sm text-gray-600 mt-2">Net profit</p>
        </div>

        <div className="bg-white dark:bg-[#1f1f1f] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-start justify-between mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Deals</p>
            <Briefcase size={18} className="text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-300">{crmStats.total_deals}</p>
          <p className="text-sm text-gray-600 mt-2">All time</p>
        </div>

        <div className="bg-white dark:bg-[#1f1f1f] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-start justify-between mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Active Deals</p>
            <Briefcase size={18} className="text-orange-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-300">{crmStats.active_deals}</p>
          <p className="text-sm text-gray-600 mt-2">In progress</p>
        </div>
      </div>

      {/* Deals Table */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-300">Closed Deals</h2>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading deals...</div>
        ) : deals.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No deals yet. Click "Add Deal" to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-[#1a1a1a]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Platform</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Client Payment</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Outsource Cost</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Platform Fee</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Profit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {deals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-300">{deal.project_title}</span>
                        {deal.project_url && (
                          <a href={deal.project_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{deal.platform}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-300">${deal.client_payment.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">${deal.outsource_cost.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">
                      ${deal.platform_fee.toFixed(2)}
                      <span className="text-xs text-gray-500 dark:text-gray-500 ml-1">
                        ({deal.client_payment > 0 ? ((deal.platform_fee / deal.client_payment) * 100).toFixed(1) : '0'}%)
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">${deal.profit.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        deal.status === 'active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        deal.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {deal.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(deal)}
                          className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(deal.id)}
                          className="p-1 text-red-600 hover:text-red-700 dark:text-red-400"
                        >
                          <Trash2 size={16} />
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

      {/* Add/Edit Deal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {editingDeal ? 'Edit Deal' : 'Add New Deal'}
              </h2>
              <button onClick={() => { setShowModal(false); setEditingDeal(null); resetForm(); }} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select from Bid History (Optional)
                </label>
                <button
                  type="button"
                  onClick={() => setShowBidHistoryModal(true)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
                >
                  Select from Bid History
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.project_title}
                  onChange={(e) => setFormData({ ...formData, project_title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter project title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Project URL</label>
                <input
                  type="url"
                  value={formData.project_url}
                  onChange={(e) => setFormData({ ...formData, project_url: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Platform <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Freelancer">Freelancer</option>
                  <option value="Upwork">Upwork</option>
                  <option value="Direct">Direct</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Client Payment <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.client_payment}
                    onChange={(e) => setFormData({ ...formData, client_payment: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Outsource Cost <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.outsource_cost}
                    onChange={(e) => setFormData({ ...formData, outsource_cost: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Platform Fee (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    value={formData.platform_fee_percentage}
                    onChange={(e) => setFormData({ ...formData, platform_fee_percentage: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Fee: ${calculatePlatformFee()}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Calculated Profit: <span className="font-bold text-green-600 dark:text-green-400">${calculateProfit()}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={createDealMutation.isPending || updateDealMutation.isPending}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
                >
                  {editingDeal ? 'Update Deal' : 'Create Deal'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingDeal(null); resetForm(); }}
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bid History Selection Modal */}
      {showBidHistoryModal && (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Select from Bid History</h2>
              <button onClick={() => setShowBidHistoryModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              {bidHistoryData?.history?.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">No bid history available</p>
              ) : (
                <div className="space-y-2">
                  {bidHistoryData?.history?.map((bid) => (
                    <button
                      key={bid.id}
                      onClick={() => handleSelectBidHistory(bid)}
                      className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-[#2a2a2a] text-left transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{bid.project_title}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Bid Amount: ${bid.amount}</p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          bid.status === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {bid.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CRM
