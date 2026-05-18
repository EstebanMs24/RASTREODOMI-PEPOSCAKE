import { useEffect, useState } from 'react'
import { supabase } from '@/config/supabase'
import { Order } from '@/types'
import { X } from 'lucide-react'

interface Deliverer {
  id: string
  full_name: string
}

interface AssignOrderModalProps {
  order: Order
  isOpen: boolean
  onClose: () => void
  onAssign: (orderId: string, delivererId: string) => Promise<void>
}

export default function AssignOrderModal({
  order,
  isOpen,
  onClose,
  onAssign,
}: AssignOrderModalProps) {
  const [deliverers, setDeliverers] = useState<Deliverer[]>([])
  const [selectedDeliverer, setSelectedDeliverer] = useState('')
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchDeliverers()
    }
  }, [isOpen])

  const fetchDeliverers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('role', 'deliverer')
        .eq('is_active', true)
        .order('full_name')

      if (error) throw error
      setDeliverers(data || [])
      if (data && data.length > 0) {
        setSelectedDeliverer(data[0].id)
      }
    } catch (err) {
      console.error('Error fetching deliverers:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedDeliverer) return

    setAssigning(true)
    try {
      await onAssign(order.id, selectedDeliverer)
      onClose()
    } finally {
      setAssigning(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Asignar Pedido</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="text-sm text-gray-600 mb-1">Número de Pedido</div>
          <div className="text-xl font-bold text-gray-900">{order.order_number}</div>
          <div className="text-sm text-gray-600 mt-2">{order.customer_name}</div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Selecciona un Domiciliario
          </label>
          <select
            value={selectedDeliverer}
            onChange={(e) => setSelectedDeliverer(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition"
          >
            {deliverers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.full_name}
              </option>
            ))}
          </select>
          {deliverers.length === 0 && !loading && (
            <p className="text-sm text-red-600 mt-2">
              No hay domiciliarios activos disponibles
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition disabled:opacity-50"
            disabled={assigning}
          >
            Cancelar
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedDeliverer || assigning || loading}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {assigning ? 'Asignando...' : 'Asignar'}
          </button>
        </div>
      </div>
    </div>
  )
}
