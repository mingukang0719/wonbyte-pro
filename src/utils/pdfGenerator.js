/**
 * PDF 생성 유틸리티
 * jsPDF를 사용한 A4 사이즈 4페이지 PDF 생성
 */
import jsPDF from 'jspdf'

// 한글 폰트 지원을 위한 설정
const setupKoreanFont = (doc) => {
  // jsPDF의 기본 한글 지원은 제한적이므로, 필요시 추가 폰트 설정
  doc.setFont('helvetica')
}

// 텍스트를 지정된 너비에 맞게 줄바꿈하는 함수
const wrapText = (doc, text, x, y, maxWidth, lineHeight = 6) => {
  const words = text.split(' ')
  let lines = []
  let currentLine = ''
  
  for (let word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word
    const textWidth = doc.getTextWidth(testLine)
    
    if (textWidth > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  
  if (currentLine) {
    lines.push(currentLine)
  }
  
  // 텍스트 출력
  lines.forEach((line, index) => {
    doc.text(line, x, y + (index * lineHeight))
  })
  
  return y + (lines.length * lineHeight)
}

// 한글 텍스트 줄바꿈 함수 (한글 특성 고려)
const wrapKoreanText = (doc, text, x, y, maxWidth, lineHeight = 6) => {
  const chars = text.split('')
  let lines = []
  let currentLine = ''
  
  for (let char of chars) {
    const testLine = currentLine + char
    const textWidth = doc.getTextWidth(testLine)
    
    if (textWidth > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = char
    } else {
      currentLine = testLine
    }
  }
  
  if (currentLine) {
    lines.push(currentLine)
  }
  
  // 텍스트 출력
  lines.forEach((line, index) => {
    doc.text(line, x, y + (index * lineHeight))
  })
  
  return y + (lines.length * lineHeight)
}

export const generatePDF = async (data) => {
  const {
    title = '원바이트 PRO 문해력 훈련',
    grade,
    text,
    analysisResult,
    selectedVocabulary = [],
    generatedProblems = [],
    vocabularyProblems = [],
    readingProblems = []
  } = data

  // A4 사이즈 PDF 생성 (210 x 297mm)
  const doc = new jsPDF('portrait', 'mm', 'a4')
  setupKoreanFont(doc)
  
  const pageWidth = 210
  const pageHeight = 297
  const margin = 20
  const contentWidth = pageWidth - (margin * 2)
  const contentHeight = pageHeight - (margin * 2)
  
  const date = new Date().toLocaleDateString('ko-KR')
  
  // ==================== 페이지 1: 읽기 지문 및 분석 ====================
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(title, margin, margin + 15)
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`${grade} | ${date}`, margin, margin + 25)
  
  // 구분선
  doc.setLineWidth(0.5)
  doc.line(margin, margin + 30, pageWidth - margin, margin + 30)
  
  let currentY = margin + 45
  
  // 읽기 지문
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('📖 읽기 지문', margin, currentY)
  currentY += 15
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  currentY = wrapKoreanText(doc, text, margin, currentY, contentWidth, 5)
  currentY += 15
  
  // 문해력 분석 결과
  if (analysisResult) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('📊 문해력 난이도 분석', margin, currentY)
    currentY += 15
    
    const analysisItems = [
      { label: '지문 길이', score: analysisResult.textLength || 0 },
      { label: '어휘 수준', score: analysisResult.vocabularyLevel || 0 },
      { label: '문장 복잡성', score: analysisResult.sentenceComplexity || 0 },
      { label: '내용 수준', score: analysisResult.contentLevel || 0 },
      { label: '배경지식', score: analysisResult.backgroundKnowledge || 0 },
      { label: '종합 난이도', score: analysisResult.totalScore || 0 }
    ]
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    
    analysisItems.forEach((item, index) => {
      const yPos = currentY + (index * 8)
      doc.text(`${item.label}:`, margin, yPos)
      doc.text(`${item.score}/10`, margin + 50, yPos)
      
      // 간단한 진행 바 (별표로 표시)
      const stars = '★'.repeat(Math.min(item.score, 10)) + '☆'.repeat(Math.max(0, 10 - item.score))
      doc.text(stars, margin + 70, yPos)
    })
    currentY += (analysisItems.length * 8) + 10
  }
  
  // 글자 수 정보
  doc.setFontSize(10)
  doc.text(`총 글자 수: ${text.length}자`, margin, currentY)
  
  // ==================== 페이지 2: 선별된 어휘 ====================
  doc.addPage()
  currentY = margin + 15
  
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('📝 핵심 어휘 학습', margin, currentY)
  currentY += 20
  
  // 선택된 어휘 목록 표시
  if (selectedVocabulary.length > 0) {
    selectedVocabulary.forEach((vocab, index) => {
      if (currentY > pageHeight - 40) {
        doc.addPage()
        currentY = margin + 15
      }
      
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. ${vocab.word}`, margin, currentY)
      currentY += 8
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      if (vocab.meaning) {
        currentY = wrapKoreanText(doc, `뜻: ${vocab.meaning}`, margin + 5, currentY, contentWidth - 5, 5)
      }
      if (vocab.example) {
        currentY = wrapKoreanText(doc, `예문: ${vocab.example}`, margin + 5, currentY, contentWidth - 5, 5)
      }
      currentY += 8
    })
  } else {
    doc.setFontSize(12)
    doc.text('선택된 어휘가 없습니다.', margin, currentY)
  }
  
  // ==================== 페이지 3: 문해력 문제 ====================
  doc.addPage()
  currentY = margin + 15
  
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('❓ 문해력 훈련 문제', margin, currentY)
  currentY += 20
  
  // 어휘 문제
  if (vocabularyProblems.length > 0) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('1. 어휘 이해 문제', margin, currentY)
    currentY += 15
    
    vocabularyProblems.forEach((problem, index) => {
      if (currentY > pageHeight - 60) {
        doc.addPage()
        currentY = margin + 15
      }
      
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      currentY = wrapKoreanText(doc, `문제 ${index + 1}: ${problem.question}`, margin, currentY, contentWidth, 5)
      currentY += 5
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      if (problem.options) {
        problem.options.forEach((option, optIndex) => {
          doc.text(`${optIndex + 1}. ${option}`, margin + 10, currentY)
          currentY += 5
        })
      }
      currentY += 5
    })
  }
  
  // 독해 문제
  if (readingProblems.length > 0) {
    if (currentY > pageHeight - 80) {
      doc.addPage()
      currentY = margin + 15
    }
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('2. 독해 이해 문제', margin, currentY)
    currentY += 15
    
    readingProblems.forEach((problem, index) => {
      if (currentY > pageHeight - 60) {
        doc.addPage()
        currentY = margin + 15
      }
      
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      currentY = wrapKoreanText(doc, `문제 ${index + 1}: ${problem.question}`, margin, currentY, contentWidth, 5)
      currentY += 5
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      if (problem.options) {
        problem.options.forEach((option, optIndex) => {
          doc.text(`${optIndex + 1}. ${option}`, margin + 10, currentY)
          currentY += 5
        })
      }
      currentY += 5
    })
  }
  
  // AI 생성 문제 (새로운 형식)
  if (generatedProblems.length > 0) {
    if (currentY > pageHeight - 80) {
      doc.addPage()
      currentY = margin + 15
    }
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('3. 추가 문제', margin, currentY)
    currentY += 15
    
    generatedProblems.forEach((problem, index) => {
      if (currentY > pageHeight - 40) {
        doc.addPage()
        currentY = margin + 15
      }
      
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      currentY = wrapKoreanText(doc, `문제 ${index + 1}: ${problem.question}`, margin, currentY, contentWidth, 5)
      currentY += 10
    })
  }
  
  // ==================== 페이지 4: 정답 및 해설 ====================
  doc.addPage()
  currentY = margin + 15
  
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('✅ 정답 및 해설', margin, currentY)
  currentY += 20
  
  // 어휘 문제 정답
  if (vocabularyProblems.length > 0) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('1. 어휘 이해 문제 정답', margin, currentY)
    currentY += 15
    
    vocabularyProblems.forEach((problem, index) => {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`문제 ${index + 1}: 정답 ${(problem.answer || 0) + 1}번`, margin, currentY)
      currentY += 6
      
      if (problem.explanation) {
        currentY = wrapKoreanText(doc, `해설: ${problem.explanation}`, margin + 10, currentY, contentWidth - 10, 5)
        currentY += 5
      }
    })
    currentY += 10
  }
  
  // 독해 문제 정답
  if (readingProblems.length > 0) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('2. 독해 이해 문제 정답', margin, currentY)
    currentY += 15
    
    readingProblems.forEach((problem, index) => {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`문제 ${index + 1}: 정답 ${(problem.answer || 0) + 1}번`, margin, currentY)
      currentY += 6
      
      if (problem.explanation) {
        currentY = wrapKoreanText(doc, `해설: ${problem.explanation}`, margin + 10, currentY, contentWidth - 10, 5)
        currentY += 5
      }
    })
  }
  
  // 학습 팁
  if (currentY < pageHeight - 60) {
    currentY += 20
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('💡 학습 팁', margin, currentY)
    currentY += 10
    
    const tips = [
      '모르는 단어가 나오면 문맥으로 뜻을 유추해보세요.',
      '지문을 읽고 핵심 내용을 한 문장으로 요약해보세요.',
      '문제를 풀기 전에 지문을 두 번 읽어보세요.',
      '틀린 문제는 다시 한 번 지문을 찾아 확인해보세요.'
    ]
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    tips.forEach((tip, index) => {
      doc.text(`${index + 1}. ${tip}`, margin, currentY)
      currentY += 6
    })
  }
  
  // 모든 페이지에 페이지 번호 추가
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`${i} / ${totalPages}`, pageWidth - margin - 10, pageHeight - 10)
    doc.text('원바이트 PRO - 문해력 훈련', margin, pageHeight - 10)
  }
  
  // PDF 다운로드
  const fileName = `문해력훈련_${grade}_${date.replace(/\//g, '-')}.pdf`
  doc.save(fileName)
  
  return true
}