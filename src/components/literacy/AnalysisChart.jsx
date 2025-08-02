import React, { memo, useRef, useEffect } from 'react'
import ProgressBar from '../common/ProgressBar'

/**
 * 문해력 분석 차트 컴포넌트 (메모이제이션)
 * @param {object} analysisResult - 분석 결과 데이터
 */
const AnalysisChart = memo(function AnalysisChart({ analysisResult }) {
  const canvasRef = useRef(null)

  const analysisItems = [
    { label: '지문 길이', score: analysisResult?.textLength || 0 },
    { label: '어휘 수준', score: analysisResult?.vocabularyLevel || 0 },
    { label: '문장 구조 복잡성', score: analysisResult?.sentenceComplexity || 0 },
    { label: '내용 구성 수준', score: analysisResult?.contentLevel || 0 },
    { label: '배경지식 의존도', score: analysisResult?.backgroundKnowledge || 0 }
  ]

  // 오각형 그래프 그리기 함수
  const drawPentagonChart = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const maxRadius = Math.min(canvas.width, canvas.height) / 2 - 40

    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 배경 격자 그리기 (1-10점까지 5단계)
    const levels = [2, 4, 6, 8, 10]
    levels.forEach((level, index) => {
      const radius = (maxRadius * level) / 10
      ctx.beginPath()
      ctx.strokeStyle = index === levels.length - 1 ? '#d1d5db' : '#f3f4f6'
      ctx.lineWidth = index === levels.length - 1 ? 2 : 1

      // 오각형 격자
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius
        
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.closePath()
      ctx.stroke()
    })

    // 축 선 그리기
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2
      const x = centerX + Math.cos(angle) * maxRadius
      const y = centerY + Math.sin(angle) * maxRadius
      
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(x, y)
      ctx.stroke()
    }

    // 데이터 그래프 그리기
    ctx.beginPath()
    ctx.fillStyle = 'rgba(59, 130, 246, 0.3)'
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 3

    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2
      const value = analysisItems[i].score
      const radius = (maxRadius * value) / 10
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius
      
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // 데이터 포인트 그리기
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2
      const value = analysisItems[i].score
      const radius = (maxRadius * value) / 10
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius
      
      ctx.beginPath()
      ctx.arc(x, y, 6, 0, 2 * Math.PI)
      ctx.fillStyle = '#3b82f6'
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // 라벨 그리기
    ctx.fillStyle = '#374151'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2
      const labelRadius = maxRadius + 25
      const x = centerX + Math.cos(angle) * labelRadius
      const y = centerY + Math.sin(angle) * labelRadius
      
      // 라벨 위치 미세 조정
      let textX = x
      let textY = y
      
      if (i === 0) { // 위쪽
        textY -= 5
      } else if (i === 1) { // 오른쪽 위
        textX += 10
        textY -= 5
      } else if (i === 2) { // 오른쪽 아래
        textX += 10
        textY += 5
      } else if (i === 3) { // 왼쪽 아래
        textX -= 10
        textY += 5
      } else { // 왼쪽 위
        textX -= 10
        textY -= 5
      }
      
      ctx.fillText(analysisItems[i].label, textX, textY)
      
      // 점수 표시
      ctx.font = 'bold 12px sans-serif'
      ctx.fillStyle = '#3b82f6'
      ctx.fillText(`${analysisItems[i].score}`, textX, textY + 15)
      ctx.font = '14px sans-serif'
      ctx.fillStyle = '#374151'
    }
  }

  useEffect(() => {
    if (analysisResult) {
      drawPentagonChart()
    }
  }, [analysisResult])

  if (!analysisResult) return null

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">문해력 난이도 분석 결과</h3>
      
      {/* 오각형 차트 */}
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="max-w-full h-auto"
        />
      </div>
      
      {/* 분석 항목별 점수 (상세) */}
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
        <p className="text-sm text-gray-600 mt-2">
          {analysisResult.analysis || '해당 학년 수준에 적합한 난이도입니다.'}
        </p>
      </div>
    </div>
  )
})

export default AnalysisChart