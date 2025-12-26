import { useState, useEffect } from 'react'
import { apiClient } from '../utils/apiClient'
import { Question, Response } from '../types/models'

interface QuestionsError extends Error {
  response?: {
    data?: {
      message?: string
    }
  }
}

export function useQuestions(projectId: string, stage: string): { questions: Question[], responses: Record<string, Response>, loading: boolean, submitting: boolean, error: string | null, submitResponse: (questionId: string, value: any) => Promise<void>, getNextQuestions: (questionId: string) => Promise<Question[]>, refreshResponses: () => Promise<void> } {
  const [questions, setQuestions] = useState<Question[]>([])
  const [responses, setResponses] = useState<Record<string, Response>>({})
  const [loading, setLoading] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await apiClient.get(`/questions/${stage}`)
        setQuestions(response.data)
      } catch (err) {
        const questionsError = err as QuestionsError
        const errorMessage = questionsError.response?.data?.message || 'Failed to load questions'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    loadQuestions()
  }, [stage])

  const refreshResponses = async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.get(`/projects/${projectId}/responses`)
      const responsesRecord: Record<string, Response> = {}
      response.data.forEach((resp: Response) => {
        responsesRecord[resp.question_id] = resp
      })
      setResponses(responsesRecord)
    } catch (err) {
      const questionsError = err as QuestionsError
      const errorMessage = questionsError.response?.data?.message || 'Failed to refresh responses'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshResponses()
  }, [projectId])

  const submitResponse = async (questionId: string, value: any): Promise<void> => {
    try {
      setSubmitting(true)
      setError(null)
      const response = await apiClient.post(`/projects/${projectId}/responses`, {
        questionId,
        value
      })
      
      setResponses(prev => ({
        ...prev,
        [questionId]: response.data
      }))

      try {
        await getNextQuestions(questionId)
      } catch (nextQuestionsErr) {
        // Non-critical failure - do not show error to user
      }
    } catch (err) {
      const questionsError = err as QuestionsError
      const errorMessage = questionsError.response?.data?.message || 'Failed to submit response'
      setError(errorMessage)
      throw err
    } finally {
      setSubmitting(false)
    }
  }

  const getNextQuestions = async (questionId: string): Promise<Question[]> => {
    try {
      const response = await apiClient.get(`/questions/${questionId}/next`)
      const nextQuestions: Question[] = response.data
      
      const existingQuestionIds = new Set(questions.map(q => q.question_id))
      const newQuestions = nextQuestions.filter(q => !existingQuestionIds.has(q.question_id))
      
      if (newQuestions.length > 0) {
        setQuestions(prev => [...prev, ...newQuestions])
      }
      
      return response.data
    } catch (err) {
      const questionsError = err as QuestionsError
      const errorMessage = questionsError.response?.data?.message || 'Failed to load next questions'
      throw new Error(errorMessage)
    }
  }

  return {
    questions,
    responses,
    loading,
    submitting,
    error,
    submitResponse,
    getNextQuestions,
    refreshResponses
  }
}