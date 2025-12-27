import { useState, useEffect } from 'react'
import { apiClient } from '../utils/apiClient'
import { ChangeLog } from '../types/models'

export function useChangeHistory(projectId: string | null): { 
  changeLogs: ChangeLog[], 
  loading: boolean, 
  error: string | null, 
  filterByUser: (userId: string | null) => void, 
  filterByDateRange: (startDate: Date | null, endDate: Date | null) => void, 
  filterByChangeType: (changeType: 'standard' | 'statusChange' | 'aiExtraction' | 'note' | null) => void, 
  refresh: () => Promise<void> 
} {
  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([])
  const [allChangeLogs, setAllChangeLogs] = useState<ChangeLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userFilter, setUserFilter] = useState<string | null>(null)
  const [dateRangeFilter, setDateRangeFilter] = useState<{ start: Date | null, end: Date | null }>({ start: null, end: null })
  const [changeTypeFilter, setChangeTypeFilter] = useState<'standard' | 'statusChange' | 'aiExtraction' | 'note' | null>(null)

  const applyFilters = () => {
    let filtered = [...allChangeLogs]
    
    if (userFilter !== null) {
      filtered = filtered.filter(log => log.changed_by_id === userFilter)
    }
    
    if (dateRangeFilter.start !== null) {
      try {
        filtered = filtered.filter(log => new Date(log.changed_at) >= dateRangeFilter.start!)
      } catch {
        filtered = []
      }
    }
    
    if (dateRangeFilter.end !== null) {
      try {
        filtered = filtered.filter(log => new Date(log.changed_at) <= dateRangeFilter.end!)
      } catch {
        filtered = []
      }
    }
    
    if (changeTypeFilter !== null) {
      filtered = filtered.filter(log => log.change_type === changeTypeFilter)
    }
    
    setChangeLogs(filtered)
  }

  useEffect(() => {
    if (projectId !== null) {
      const fetchChangeHistory = async () => {
        try {
          setLoading(true)
          const response = await apiClient.get(`/projects/${projectId}/history`)
          setAllChangeLogs(response.data)
          setChangeLogs(response.data)
          setError(null)
        } catch (err: any) {
          setError(err.response?.data?.message || 'Failed to load change history')
        } finally {
          setLoading(false)
        }
      }
      
      fetchChangeHistory()
    }
  }, [projectId])

  useEffect(() => {
    applyFilters()
  }, [allChangeLogs, userFilter, dateRangeFilter, changeTypeFilter])

  const filterByUser = (userId: string | null) => {
    setUserFilter(userId)
  }

  const filterByDateRange = (startDate: Date | null, endDate: Date | null) => {
    setDateRangeFilter({ start: startDate, end: endDate })
  }

  const filterByChangeType = (changeType: 'standard' | 'statusChange' | 'aiExtraction' | 'note' | null) => {
    setChangeTypeFilter(changeType)
  }

  const refresh = async () => {
    if (projectId !== null) {
      try {
        const response = await apiClient.get(`/projects/${projectId}/history`)
        setAllChangeLogs(response.data)
        applyFilters()
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load change history')
      }
    }
  }

  return {
    changeLogs,
    loading,
    error,
    filterByUser,
    filterByDateRange,
    filterByChangeType,
    refresh
  }
}