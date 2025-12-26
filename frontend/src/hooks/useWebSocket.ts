import { useState, useEffect, useContext } from 'react'
import { WebSocketContext } from '../context/WebSocketContext'
import { ChangeLog } from '../types/models'

export function useWebSocket(projectId: string | null): { connected: boolean, lastUpdate: ChangeLog | null, error: string | null, subscribe: () => void, unsubscribe: () => void } {
  const [connected, setConnected] = useState<boolean>(false)
  const [lastUpdate, setLastUpdate] = useState<ChangeLog | null>(null)
  const [error, setError] = useState<string | null>(null)
  const socket = useContext(WebSocketContext)

  const subscribe = () => {
    if (projectId === null) {
      setError('No project ID provided')
      return
    }
    if (socket && socket.connected) {
      socket.emit('join-project', { projectId })
    }
  }

  const unsubscribe = () => {
    if (projectId !== null && socket && socket.connected) {
      socket.emit('leave-project', { projectId })
    }
  }

  useEffect(() => {
    if (projectId !== null) {
      subscribe()
    }
    return () => {
      unsubscribe()
    }
  }, [projectId, socket])

  useEffect(() => {
    if (!socket) return

    const handleProjectUpdate = (payload: ChangeLog) => {
      setLastUpdate(payload)
      setConnected(true)
    }

    const handleConnect = () => {
      setConnected(true)
      setError(null)
    }

    const handleDisconnect = () => {
      setConnected(false)
    }

    const handleError = (event: any) => {
      setError(event.message)
    }

    socket.on('project-update', handleProjectUpdate)
    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('error', handleError)

    return () => {
      socket.off('project-update', handleProjectUpdate)
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('error', handleError)
    }
  }, [socket])

  return {
    connected,
    lastUpdate,
    error,
    subscribe,
    unsubscribe
  }
}