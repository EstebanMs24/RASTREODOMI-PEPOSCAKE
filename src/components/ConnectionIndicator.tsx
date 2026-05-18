import { useSupabaseConnection } from '@/hooks/useSupabaseConnection'
import { Circle } from 'lucide-react'

export default function ConnectionIndicator() {
  const { status } = useSupabaseConnection()

  const config = {
    connected: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      dot: 'bg-green-500',
      label: 'Conectado',
      animate: 'animate-pulse',
    },
    connecting: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-700',
      dot: 'bg-yellow-500',
      label: 'Conectando...',
      animate: 'animate-pulse',
    },
    disconnected: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      dot: 'bg-red-500',
      label: 'Desconectado',
      animate: '',
    },
  }

  const current = config[status]

  return (
    <div className={`${current.bg} ${current.text} px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-semibold`}>
      <Circle className={`w-2 h-2 ${current.dot} ${current.animate}`} fill="currentColor" />
      {current.label}
    </div>
  )
}
