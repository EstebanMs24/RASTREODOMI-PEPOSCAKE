import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { useOrdersStore } from '@/stores/orders'
import { useMapStore } from '@/stores/map'
import Sidebar from '@/components/Sidebar'
import MapView from '@/components/MapView'
import OrdersPanel from '@/components/OrdersPanel'
import DashboardStats from '@/components/DashboardStats'
import AddDelivererForm from '@/components/AddDelivererForm'
import DeliverersList from '@/components/DeliverersList'
import PerformanceReports from '@/components/PerformanceReports'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'
import { LogOut, Menu } from 'lucide-react'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { fetchOrders, fetchStats, subscribeToOrders, stats } = useOrdersStore()
  const { fetchLocations, subscribeToLocations } = useMapStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'map' | 'orders' | 'stats' | 'deliverers' | 'reports' | 'analytics'>('map')
  const [showFormDeliverer, setShowFormDeliverer] = useState(false)

  useEffect(() => {
    fetchOrders()
    fetchStats()
    fetchLocations()

    const unsubscribeOrders = subscribeToOrders(() => {
      fetchOrders()
      fetchStats()
    })

    const unsubscribeLocations = subscribeToLocations(() => {
      fetchLocations()
    })

    const statsInterval = setInterval(() => {
      fetchStats()
    }, 30000)

    return () => {
      unsubscribeOrders()
      unsubscribeLocations()
      clearInterval(statsInterval)
    }
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-primary-700 rounded-lg transition text-white"
              >
                <Menu className="w-6 h-6" />
              </button>
              <img
                src="/assets/logo-horizontal.jpeg"
                alt="Pepos Cake"
                className="h-10 object-cover"
              />
              <div>
                <p className="text-primary-100 text-xs font-semibold">Centro de Control</p>
                <p className="text-primary-50 text-xs">Gesión en Tiempo Real</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{user?.full_name}</p>
                <p className="text-xs text-primary-100">{user?.email}</p>
              </div>
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
          <div className="flex gap-1 px-6 border-t border-primary-500 overflow-x-auto bg-primary-600/50">
            {(['map', 'orders', 'stats', 'reports', 'analytics', 'deliverers'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 font-medium text-sm transition whitespace-nowrap border-b-2 ${
                  activeTab === tab
                    ? 'border-white text-white bg-primary-700/50'
                    : 'border-transparent text-primary-100 hover:text-white hover:bg-primary-700/30'
                }`}
              >
                {tab === 'map' && '🗺️ Mapa'}
                {tab === 'orders' && '📦 Pedidos'}
                {tab === 'stats' && '📊 Estadísticas'}
                {tab === 'reports' && '📈 Reportes'}
                {tab === 'analytics' && '📉 Analytics'}
                {tab === 'deliverers' && '👥 Domiciliarios'}
              </button>
            ))}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'map' && <MapView />}
          {activeTab === 'orders' && <OrdersPanel />}
          {activeTab === 'stats' && <DashboardStats stats={stats} />}
          {activeTab === 'reports' && <PerformanceReports />}
          {activeTab === 'analytics' && <AnalyticsDashboard />}
          {activeTab === 'deliverers' && (
            <div className="space-y-6 max-w-6xl">
              {/* Register Button */}
              <button
                onClick={() => setShowFormDeliverer(!showFormDeliverer)}
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:from-primary-600 hover:to-primary-700 transition duration-200 flex items-center justify-center gap-2"
              >
                {showFormDeliverer ? '✕ Cancelar' : '➕ Registrar Nuevo Domiciliario'}
              </button>

              {/* Form Animated */}
              {showFormDeliverer && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <AddDelivererForm onDelivererAdded={() => {
                    fetchOrders()
                    setShowFormDeliverer(false)
                  }} />
                </div>
              )}

              {/* List */}
              <DeliverersList />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
