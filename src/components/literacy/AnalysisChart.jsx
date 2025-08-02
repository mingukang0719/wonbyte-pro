import React, { memo } from 'react'
import ProgressBar from '../common/ProgressBar'

/**
 * 문해력 분석 차트 컴포넌트 (메모이제이션)
 * @param {object} analysisResult - 분석 결과 데이터
 */
const AnalysisChart = memo(function AnalysisChart({ analysisResult }) {
  if (!analysisResult) return null

  const analysisItems = [
    { label: '지문 길이', score: analysisResult.textLength },
    { label: '어휘 수준', score: analysisResult.vocabularyLevel },
    { label: '문장 구조 복잡성', score: analysisResult.sentenceComplexity },
    { label: '내용 구성 수준', score: analysisResult.contentLevel },
    { label: '배경지식 의존도', score: analysisResult.backgroundKnowledge }
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">문해력 난이도 분석 결과</h3>
      
      {/* 분석 항목별 점수 */}
      <div className="space-y-3">
        {analysisItems.map((item, index) => (
          <ProgressBar
            key={index}
            label={item.label}
            value={item.score}
            max={10}
            color="blue"
            size="medium"
          />
        ))}
      </div>

      {/* 총점 */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-lg">종합 난이도</span>
          <span className="text-2xl font-bold text-blue-600">
            {analysisResult.totalScore}/10
          </span>
        </div>
      </div>
    </div>
  )
})

export default AnalysisChart