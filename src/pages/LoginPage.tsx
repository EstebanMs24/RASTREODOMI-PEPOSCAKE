import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { Mail, Lock, Loader } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, loading, error, clearError } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userType, setUserType] = useState<'admin' | 'deliverer'>('admin')
  const [loginSuccess, setLoginSuccess] = useState(false)

  useEffect(() => {
    setIsSubmitting(false)
  }, [])

  useEffect(() => {
    if (error) {
      toast.error(error)
      setPassword('')
      setIsSubmitting(false)
      clearError()
    }
  }, [error, clearError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting || loading) return

    setIsSubmitting(true)
    try {
      await login(email, password)
      const user = useAuthStore.getState().user

      setLoginSuccess(true)
      toast.success('✓ Sesión iniciada correctamente')

      setTimeout(() => {
        if (user?.role === 'admin') {
          navigate('/admin')
        } else {
          navigate('/deliverer')
        }
      }, 500)
    } catch (err) {
      console.error('Login error:', err)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-pepos-coral rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>

      {/* Decorative logo background */}
      <div className="absolute top-10 left-10 opacity-10 w-40 h-40">
        <img src="/assets/logo-circular.jpeg" alt="" className="w-full h-full rounded-full object-cover" />
      </div>
      <div className="absolute bottom-10 right-10 opacity-10 w-32 h-32">
        <img src="/assets/logo-circular.jpeg" alt="" className="w-full h-full rounded-full object-cover" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-sm">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img
              src="/assets/logo-circular.jpeg"
              alt="Pepos Cake"
              className="w-28 h-28 rounded-full shadow-2xl border-4 border-white object-cover"
            />
          </div>

          <h1 className="text-3xl font-bold text-center text-gray-900 mb-1">
            PEPOS CAKE
          </h1>
          <p className="text-center text-primary-600 font-semibold mb-8 text-sm">
            Gestión de Domiciliarios en Tiempo Real
          </p>

          {/* User Type Tabs */}
          <div className="flex gap-3 mb-8 bg-gray-100 p-1.5 rounded-xl">
            <button
              type="button"
              onClick={() => setUserType('admin')}
              className={`flex-1 py-2.5 rounded-lg font-semibold transition duration-300 ${
                userType === 'admin'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                  : 'bg-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              👨‍💼 Admin
            </button>
            <button
              type="button"
              onClick={() => setUserType('deliverer')}
              className={`flex-1 py-2.5 rounded-lg font-semibold transition duration-300 ${
                userType === 'deliverer'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                  : 'bg-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              🚴 Domiciliario
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                📧 Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-primary-500 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                🔐 Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-primary-500 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition"
                  required
                />
              </div>
              {userType === 'deliverer' && (
                <p className="text-xs text-gray-500 mt-2">
                  ℹ️ El admin te compartió esta contraseña cuando te registró
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || isSubmitting || loginSuccess}
              className={`w-full py-3 rounded-lg font-bold shadow-lg transition duration-200 flex items-center justify-center gap-2 ${
                loginSuccess
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-xl hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {loading || isSubmitting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Iniciando sesión...
                </>
              ) : loginSuccess ? (
                <>
                  <span className="text-xl">✓</span>
                  Sesión iniciada
                </>
              ) : (
                '✓ Iniciar Sesión'
              )}
            </button>
          </form>

          <div className="mt-8 p-4 bg-gradient-to-r from-pepos-cream/20 to-pepos-coral/20 rounded-xl border border-pepos-cream/30">
            <p className="text-xs font-bold text-gray-700 text-center mb-3">📝 Credenciales de Prueba</p>
            <div className="space-y-2 text-xs text-gray-700 text-center font-mono">
              <p><strong>Admin:</strong> admin@peposcake.com / admin2026</p>
              <p><strong>Domiciliario:</strong> usa el email y contraseña del admin</p>
            </div>
          </div>
        </div>

        <p className="text-center text-white text-xs mt-6 opacity-80">
          🚀 Gesión inteligente de entregas en tiempo real
        </p>
      </div>
    </div>
  )
}
