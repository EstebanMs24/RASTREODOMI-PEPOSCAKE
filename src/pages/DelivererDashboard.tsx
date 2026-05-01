import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { useOrdersStore } from '@/stores/orders'
import { useMapStore } from '@/stores/map'
import DeliveryOrders from '@/components/DeliveryOrders'
import DeliveryMap from '@/components/DeliveryMap'
import { LogOut, Navigation } from 'lucide-react'

export default function DelivererDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { fetchOrdersForDeliverer, subscribeToOrders } = useOrdersStore()
  const { startTracking, stopTracking, trackingActive } = useMapStore()
  const [activeTab, setActiveTab] = useState<'orders' | 'map'>('orders')

  useEffect(() => {
    if (user?.id) {
      fetchOrdersForDeliverer(user.id)

      const unsubscribe = subscribeToOrders(() => {
        fetchOrdersForDeliverer(user.id)
      })

      return () => unsubscribe()
    }
  }, [user?.id])

  const handleToggleTracking = () => {
    if (user?.id) {
      if (trackingActive) {
        stopTracking()
      } else {
        startTracking(user.id)
      }
    }
  }

  const handleLogout = async () => {
    try {
      stopTracking()
      await logout()
      navigate('/login')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">PEPOS CAKE - Domiciliario</h1>
              <p className="text-sm text-gray-600">{user?.full_name}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleTracking}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                  trackingActive
                    ? 'bg-success-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Navigation className="w-4 h-4" />
                {trackingActive ? 'Rastreando' : 'Inactivo'}
              </button>

              <button
                onClick={handleLogout}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-t border-gray-200 pt-4">
            {(['orders', 'map'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium text-sm transition ${
                  activeTab === tab
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab === 'orders' && 'Mis Pedidos'}
                {tab === 'map' && 'Mi Ubicación'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto max-w-7xl mx-auto w-full">
        {activeTab === 'orders' && <DeliveryOrders />}
        {activeTab === 'map' && <DeliveryMap />}
      </main>
    </div>
  )
}
