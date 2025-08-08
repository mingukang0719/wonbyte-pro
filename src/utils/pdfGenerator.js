/**
 * PDF 생성 유틸리티
 * jsPDF를 사용한 A4 사이즈 3페이지 PDF 생성
 * 페이지 1: 생성된 지문
 * 페이지 2: 생성된(+ 유저가 추가한) 어휘
 * 페이지 3: 생성된 문제
 */
import jsPDF from 'jspdf'

// 한글 폰트 지원을 위한 설정
const setupKoreanFont = (doc) => {
  // jsPDF의 기본 한글 지원은 제한적이므로, 필요시 추가 폰트 설정
  doc.setFont('helvetica')
}

// 한글 텍스트 줄바꿈 함수 (한글 특성 고려)
const wrapKoreanText = (doc, text, x, y, maxWidth, lineHeight = 7) => {
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
    selectedVocabulary = [],
    generatedProblems = []
  } = data

  // A4 사이즈 PDF 생성 (210 x 297mm)
  const doc = new jsPDF('portrait', 'mm', 'a4')
  setupKoreanFont(doc)
  
  const pageWidth = 210
  const pageHeight = 297
  const margin = 20
  const contentWidth = pageWidth - (margin * 2)
  
  const date = new Date().toLocaleDateString('ko-KR')
  
  // ==================== 페이지 1: 생성된 지문 ====================
  // 헤더
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text(title, margin, margin + 10)
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`${grade} | ${date}`, margin, margin + 20)
  
  // 구분선
  doc.setLineWidth(0.5)
  doc.line(margin, margin + 25, pageWidth - margin, margin + 25)
  
  // 읽기 지문 제목
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('읽기 지문', margin, margin + 40)
  
  // 지문 내용
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  let currentY = wrapKoreanText(doc, text, margin, margin + 55, contentWidth, 8)
  
  // 글자 수 정보
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`총 ${text.length}자`, margin, pageHeight - 15)
  doc.setTextColor(0)
  
  // ==================== 페이지 2: 어휘 학습 ====================
  doc.addPage()
  currentY = margin + 10
  
  // 헤더
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('어휘 학습', margin, currentY)
  currentY += 10
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`${grade} | ${date}`, margin, currentY)
  currentY += 10
  
  // 구분선
  doc.setLineWidth(0.5)
  doc.line(margin, currentY, pageWidth - margin, currentY)
  currentY += 20
  
  // 선택된 어휘 목록
  if (selectedVocabulary.length > 0) {
    selectedVocabulary.forEach((vocab, index) => {
      if (currentY > pageHeight - 40) {
        return // 페이지 넘어가면 중단
      }
      
      // 어휘 번호와 단어
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. ${vocab.word}`, margin, currentY)
      currentY += 10
      
      // 뜻
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      if (vocab.meaning) {
        currentY = wrapKoreanText(doc, `뜻: ${vocab.meaning}`, margin + 10, currentY, contentWidth - 10, 6)
        currentY += 3
      }
      
      // 예문
      if (vocab.example) {
        currentY = wrapKoreanText(doc, `예문: ${vocab.example}`, margin + 10, currentY, contentWidth - 10, 6)
      }
      
      // 난이도
      if (vocab.difficulty) {
        doc.setFontSize(10)
        doc.text(`난이도: ${vocab.difficulty}`, margin + 10, currentY + 5)
        currentY += 8
      }
      
      currentY += 10
    })
  } else {
    doc.setFontSize(12)
    doc.setTextColor(150)
    doc.text('선택된 어휘가 없습니다.', margin, currentY)
    doc.setTextColor(0)
  }
  
  // ==================== 페이지 3: 문제 ====================
  doc.addPage()
  currentY = margin + 10
  
  // 헤더
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('문해력 문제', margin, currentY)
  currentY += 10
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`${grade} | ${date}`, margin, currentY)
  currentY += 10
  
  // 구분선
  doc.setLineWidth(0.5)
  doc.line(margin, currentY, pageWidth - margin, currentY)
  currentY += 20
  
  // 문제 목록
  if (generatedProblems.length > 0) {
    generatedProblems.forEach((problem, index) => {
      if (currentY > pageHeight - 60) {
        return // 페이지 넘어가면 중단
      }
      
      // 문제 번호와 유형
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100)
      doc.text(problem.type === 'multiple_choice' ? '[객관식]' : '[서술형]', margin, currentY)
      doc.setTextColor(0)
      
      // 문제
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      currentY = wrapKoreanText(doc, `${index + 1}. ${problem.question}`, margin, currentY + 8, contentWidth, 6)
      currentY += 8
      
      // 객관식 선택지
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      if (problem.type === 'multiple_choice' && problem.options) {
        problem.options.forEach((option, optIndex) => {
          doc.text(`  ${optIndex + 1}) ${option}`, margin + 5, currentY)
          currentY += 7
        })
      }
      
      // 서술형 답안 공간
      if (problem.type === 'short_answer') {
        doc.setTextColor(150)
        doc.setFontSize(10)
        doc.text(`(${problem.expectedLength || '1-2문장'} 답안 작성)`, margin + 5, currentY)
        doc.setTextColor(0)
        
        // 답안 작성 줄
        doc.setDrawColor(200)
        for (let i = 0; i < 3; i++) {
          doc.line(margin + 5, currentY + 8 + (i * 8), pageWidth - margin - 5, currentY + 8 + (i * 8))
        }
        currentY += 30
        doc.setDrawColor(0)
      }
      
      currentY += 10
    })
  } else {
    doc.setFontSize(12)
    doc.setTextColor(150)
    doc.text('생성된 문제가 없습니다.', margin, currentY)
    doc.setTextColor(0)
  }
  
  // 모든 페이지에 페이지 번호 추가
  const totalPages = doc.internal.getNumberOfPages()
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(150)
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.text(`${i} / ${totalPages}`, pageWidth / 2 - 10, pageHeight - 10)
    doc.text('원바이트 PRO', pageWidth - margin - 30, pageHeight - 10)
  }
  doc.setTextColor(0)
  
  // PDF 다운로드
  const fileName = `문해력훈련_${grade}_${date.replace(/\//g, '-')}.pdf`
  doc.save(fileName)
  
  return true
}