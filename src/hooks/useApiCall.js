import { useState, useCallback, useRef } from 'react'

/**
 * API 호출을 위한 커스텀 훅
 * @param {Function} apiFunction - 호출할 API 함수
 * @returns {Object} API 호출 상태와 함수
 */
export function useApiCall(apiFunction) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const abortControllerRef = useRef(null)

  const execute = useCallback(async (...args) => {
    // 이전 요청이 진행 중이면 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()
    setLoading(true)
    setError(null)
    
    try {
      const result = await apiFunction(...args, { signal: abortControllerRef.current.signal })
      setData(result)
      return result
    } catch (err) {
      if (err.name === 'AbortError') {
        return // 요청이 취소된 경우 에러 처리하지 않음
      }
      const errorMessage = err.response?.data?.message || err.message || '알 수 없는 오류가 발생했습니다'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }, [apiFunction])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return { data, loading, error, execute, reset }
}

/**
 * 여러 API 호출을 병렬로 처리하는 커스텀 훅
 * @returns {Object} 병렬 API 호출 함수와 상태
 */
export function useParallelApiCalls() {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState([])

  const executeAll = useCallback(async (apiCalls) => {
    setLoading(true)
    setErrors([])
    
    try {
      const results = await Promise.allSettled(apiCalls)
      
      const successResults = []
      const failedResults = []
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successResults.push(result.value)
        } else {
          failedResults.push({
            index,
            error: result.reason?.message || '알 수 없는 오류'
          })
        }
      })
      
      if (failedResults.length > 0) {
        setErrors(failedResults)
      }
      
      return { 
        success: successResults, 
        failed: failedResults,
        hasErrors: failedResults.length > 0
      }
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, errors, executeAll }
}