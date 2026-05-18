import { useEffect, useState } from 'react'
import { supabase } from '@/config/supabase'

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected'

export const useSupabaseConnection = () => {
  const [status, setStatus] = useState<ConnectionStatus>('connecting')

  useEffect(() => {
    let testChannel: any = null
    let isCleanedUp = false

    const setupConnection = async () => {
      try {
        setStatus('connecting')
        testChannel = supabase.channel('connection-test', {
          config: { broadcast: { self: true } },
        })

        testChannel
          .on('broadcast', { event: 'heartbeat' }, () => {
            if (!isCleanedUp) setStatus('connected')
          })
          .subscribe(async (status: string) => {
            if (isCleanedUp) return

            if (status === 'SUBSCRIBED') {
              setStatus('connected')
              testChannel.send({
                type: 'broadcast',
                event: 'heartbeat',
                payload: {},
              })
            } else if (status === 'CHANNEL_ERROR') {
              setStatus('disconnected')
            } else if (status === 'TIMED_OUT') {
              setStatus('disconnected')
            }
          })
      } catch {
        if (!isCleanedUp) setStatus('disconnected')
      }
    }

    setupConnection()

    const heartbeatInterval = setInterval(() => {
      if (testChannel && !isCleanedUp) {
        testChannel.send({
          type: 'broadcast',
          event: 'heartbeat',
          payload: {},
        })
      }
    }, 5000)

    return () => {
      isCleanedUp = true
      if (testChannel) {
        testChannel.unsubscribe()
      }
      clearInterval(heartbeatInterval)
    }
  }, [])

  return { status }
}
