import { useState, useCallback } from 'react'
import aiService from '../services/aiService'

/**
 * 텍스트 분석을 위한 커스텀 훅
 * @returns {Object} 텍스트 분석 관련 상태와 함수
 */
export function useTextAnalysis() {
  const [analysisResult, setAnalysisResult] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  
  // 간단한 문해력 분석 함수
  const analyzeReadingLevelLocal = useCallback((text) => {
    const charCount = text.length
    const sentences = text.split(/[.!?]/).filter(s => s.trim())
    const sentenceCount = sentences.length || 1
    const avgSentenceLength = charCount / sentenceCount
    
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length
    const avgWordLength = charCount / (wordCount || 1)
    
    return {
      textLength: Math.min(10, Math.round(charCount / 200)),
      vocabularyLevel: Math.min(10, Math.round(avgWordLength * 2)),
      sentenceComplexity: Math.min(10, Math.round(avgSentenceLength / 10)),
      contentLevel: Math.min(10, 7),
      backgroundKnowledge: Math.min(10, 5),
      totalScore: Math.round((charCount / 200 + avgWordLength * 2 + avgSentenceLength / 10 + 7 + 5) / 5)
    }
  }, [])
  
  // AI 기반 텍스트 분석
  const analyzeText = useCallback(async (text, gradeLevel) => {
    setAnalyzing(true)
    
    try {
      const response = await aiService.analyzeReadingLevel(text, gradeLevel)
      
      if (response.success) {
        setAnalysisResult(response.content)
        return response.content
      } else {
        // 실패 시 로컬 분석 사용
        const localAnalysis = analyzeReadingLevelLocal(text)
        setAnalysisResult(localAnalysis)
        return localAnalysis
      }
    } catch (error) {
      console.error('분석 오류:', error)
      // 오류 시 로컬 분석 사용
      const localAnalysis = analyzeReadingLevelLocal(text)
      setAnalysisResult(localAnalysis)
      return localAnalysis
    } finally {
      setAnalyzing(false)
    }
  }, [analyzeReadingLevelLocal])
  
  const resetAnalysis = useCallback(() => {
    setAnalysisResult(null)
    setAnalyzing(false)
  }, [])
  
  return {
    analysisResult,
    analyzing,
    analyzeText,
    resetAnalysis
  }
}