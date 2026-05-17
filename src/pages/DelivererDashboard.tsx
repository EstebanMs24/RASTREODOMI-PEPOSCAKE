import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { useOrdersStore } from '@/stores/orders'
import { useMapStore } from '@/stores/map'
import DeliveryOrders from '@/components/DeliveryOrders'
import DeliveryMap from '@/components/DeliveryMap'
import DeliveryLocationStatus from '@/components/DeliveryLocationStatus'
import { LogOut, Navigation } from 'lucide-react'

export default function DelivererDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { fetchOrdersForDeliverer, subscribeToOrders } = useOrdersStore()
  const { startTracking, stopTracking, trackingActive } = useMapStore()
  const [activeTab, setActiveTab] = useState<'orders' | 'map' | 'location'>('orders')

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
      <header className="bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <img
                src="/assets/logo-circular.jpeg"
                alt="Pepos Cake"
                className="w-14 h-14 rounded-full shadow-lg border-2 border-white object-cover"
              />
              <div>
                <h1 className="text-2xl font-bold text-white">PEPOS CAKE</h1>
                <p className="text-primary-100 text-sm">{user?.full_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleTracking}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition shadow-md ${
                  trackingActive
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Navigation className="w-4 h-4" />
                {trackingActive ? '🟢 Rastreando' : '⚪ Inactivo'}
              </button>

              <button
                onClick={handleLogout}
                className="p-2.5 hover:bg-primary-700 rounded-lg transition text-white"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-t border-primary-500 pt-0">
            {(['orders', 'map', 'location'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 font-semibold text-sm transition border-b-2 ${
                  activeTab === tab
                    ? 'text-white border-white bg-primary-700/50'
                    : 'text-primary-100 border-transparent hover:text-white hover:bg-primary-700/30'
                }`}
              >
                {tab === 'orders' && '📦 Mis Pedidos'}
                {tab === 'map' && '🗺️ Mi Ubicación'}
                {tab === 'location' && '📍 Historial'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto max-w-7xl mx-auto w-full">
        {activeTab === 'orders' && <DeliveryOrders />}
        {activeTab === 'map' && <DeliveryMap />}
        {activeTab === 'location' && <DeliveryLocationStatus />}
      </main>
    </div>
  )
}
