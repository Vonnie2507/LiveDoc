import { useState, useEffect } from 'react'
import { apiClient } from '../utils/apiClient'
import { Extraction } from '../types/models'

export function useExtraction(communicationId?: string): { 
  extractions: Extraction[], 
  loading: boolean, 
  processing: boolean, 
  error: string | null, 
  triggerExtraction: (commId: string, text: string) => Promise<void>, 
  getExtractions: (commId: string) => Promise<void>, 
  confirmExtraction: (extractionId: string) => Promise<void>, 
  rejectExtraction: (extractionId: string) => Promise<void>, 
  applyExtraction: (extractionId: string, projectId: string) => Promise<void>, 
  batchApply: (extractionIds: string[], projectId: string) => Promise<void> 
} {
  const [extractions, setExtractions] = useState<Extraction[]>([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getExtractions = async (commId: string): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.get(`/communications/${commId}/extractions`)
      setExtractions(response.data)
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to load extractions'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (communicationId) {
      getExtractions(communicationId)
    }
  }, [communicationId])

  const triggerExtraction = async (commId: string, text: string): Promise<void> => {
    setProcessing(true)
    setError(null)
    try {
      await apiClient.post('/extractions/extract', { communicationId: commId, text })
      await getExtractions(commId)
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to trigger extraction'
      setError(message)
      throw err
    } finally {
      setProcessing(false)
    }
  }

  const confirmExtraction = async (extractionId: string): Promise<void> => {
    const originalExtractions = [...extractions]
    setExtractions(prev => prev.map(ext => 
      ext.id === extractionId ? { ...ext, status: 'confirmed' } : ext
    ))
    setError(null)
    try {
      await apiClient.put(`/extractions/${extractionId}/confirm`)
    } catch (err: any) {
      setExtractions(originalExtractions)
      const message = err.response?.data?.message || 'Failed to confirm extraction'
      setError(message)
      throw err
    }
  }

  const rejectExtraction = async (extractionId: string): Promise<void> => {
    const originalExtractions = [...extractions]
    setExtractions(prev => prev.map(ext => 
      ext.id === extractionId ? { ...ext, status: 'rejected' } : ext
    ))
    setError(null)
    try {
      await apiClient.put(`/extractions/${extractionId}/reject`)
    } catch (err: any) {
      setExtractions(originalExtractions)
      const message = err.response?.data?.message || 'Failed to reject extraction'
      setError(message)
      throw err
    }
  }

  const applyExtraction = async (extractionId: string, projectId: string): Promise<void> => {
    setProcessing(true)
    setError(null)
    try {
      await apiClient.post(`/extractions/${extractionId}/apply`, { projectId })
      setExtractions(prev => prev.map(ext => 
        ext.id === extractionId ? { ...ext, status: 'applied' } : ext
      ))
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to apply extraction'
      setError(message)
      throw err
    } finally {
      setProcessing(false)
    }
  }

  const batchApply = async (extractionIds: string[], projectId: string): Promise<void> => {
    setProcessing(true)
    setError(null)
    try {
      await apiClient.post('/extractions/batch-apply', { extractionIds, projectId })
      setExtractions(prev => prev.map(ext => 
        extractionIds.includes(ext.id) ? { ...ext, status: 'applied' } : ext
      ))
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to batch apply extractions'
      setError(message)
      throw err
    } finally {
      setProcessing(false)
    }
  }

  return {
    extractions,
    loading,
    processing,
    error,
    triggerExtraction,
    getExtractions,
    confirmExtraction,
    rejectExtraction,
    applyExtraction,
    batchApply
  }
}