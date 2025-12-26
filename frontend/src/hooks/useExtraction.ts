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

  useEffect(() => {
    if (communicationId) {
      getExtractions(communicationId)
    }
  }, [communicationId])

  const triggerExtraction = async (commId: string, text: string): Promise<void> => {
    try {
      setError(null)
      setProcessing(true)
      await apiClient.post('/extractions/extract', {
        communicationId: commId,
        text
      })
      await getExtractions(commId)
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to trigger extraction'
      setError(message)
      throw err
    } finally {
      setProcessing(false)
    }
  }

  const getExtractions = async (commId: string): Promise<void> => {
    try {
      setError(null)
      setLoading(true)
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

  const confirmExtraction = async (extractionId: string): Promise<void> => {
    const originalExtractions = [...extractions]
    try {
      setError(null)
      setExtractions(prev => prev.map(extraction => 
        extraction.id === extractionId 
          ? { ...extraction, status: 'confirmed' as const }
          : extraction
      ))
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
    try {
      setError(null)
      setExtractions(prev => prev.map(extraction => 
        extraction.id === extractionId 
          ? { ...extraction, status: 'rejected' as const }
          : extraction
      ))
      await apiClient.put(`/extractions/${extractionId}/reject`)
    } catch (err: any) {
      setExtractions(originalExtractions)
      const message = err.response?.data?.message || 'Failed to reject extraction'
      setError(message)
      throw err
    }
  }

  const applyExtraction = async (extractionId: string, projectId: string): Promise<void> => {
    try {
      setError(null)
      setProcessing(true)
      await apiClient.post(`/extractions/${extractionId}/apply`, { projectId })
      setExtractions(prev => prev.map(extraction => 
        extraction.id === extractionId 
          ? { ...extraction, status: 'applied' as const }
          : extraction
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
    try {
      setError(null)
      setProcessing(true)
      await apiClient.post('/extractions/batch-apply', { extractionIds, projectId })
      setExtractions(prev => prev.map(extraction => 
        extractionIds.includes(extraction.id) 
          ? { ...extraction, status: 'applied' as const }
          : extraction
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