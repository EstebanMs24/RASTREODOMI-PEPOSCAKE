import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import LoginPage from '@/pages/LoginPage'
import AdminDashboard from '@/pages/AdminDashboard'
import DelivererDashboard from '@/pages/DelivererDashboard'
import NotFoundPage from '@/pages/NotFoundPage'

function App() {
  const { user, fetchUser, loading } = useAuthStore()

  useEffect(() => {
    fetchUser()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
        <div className="text-white text-center">
          <div className="text-4xl font-bold mb-4">PEPOS CAKE</div>
          <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin/*"
          element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/deliverer/*"
          element={user?.role === 'deliverer' ? <DelivererDashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/"
          element={
            user ? (
              user.role === 'admin' ? (
                <Navigate to="/admin" />
              ) : (
                <Navigate to="/deliverer" />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
