import { useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="text-center text-white">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-80" />
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-xl mb-8">Página no encontrada</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-white text-primary-600 rounded-lg font-medium hover:bg-gray-100"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  )
}
