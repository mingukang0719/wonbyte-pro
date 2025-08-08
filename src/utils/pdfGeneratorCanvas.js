/**
 * Canvas 기반 PDF 생성 유틸리티
 * Canvas를 사용하여 한글을 올바르게 렌더링한 후 PDF로 변환
 */
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// 가상 DOM 요소를 생성하여 Canvas로 렌더링
const createVirtualElement = (content) => {
  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.style.width = '210mm'
  container.style.padding = '20mm'
  container.style.fontFamily = 'Malgun Gothic, 맑은 고딕, sans-serif'
  container.style.fontSize = '12pt'
  container.style.lineHeight = '1.6'
  container.style.backgroundColor = 'white'
  container.innerHTML = content
  document.body.appendChild(container)
  return container
}

// HTML 콘텐츠 생성
const createPageHTML = (title, subtitle, content) => {
  return `
    <div style="margin-bottom: 40px;">
      <h1 style="font-size: 22pt; font-weight: bold; margin-bottom: 10px;">${title}</h1>
      <p style="font-size: 12pt; color: #666; margin-bottom: 20px;">${subtitle}</p>
      <hr style="border: none; border-top: 1px solid #ccc; margin-bottom: 30px;">
      ${content}
    </div>
  `
}

// 지문 페이지 HTML 생성
const createTextPageHTML = (text, grade, date) => {
  const content = `
    <h2 style="font-size: 16pt; font-weight: bold; margin-bottom: 20px;">읽기 지문</h2>
    <div style="font-size: 12pt; line-height: 1.8; text-align: justify;">
      ${text.replace(/\n/g, '<br>')}
    </div>
    <div style="position: absolute; bottom: 20mm; left: 20mm; font-size: 10pt; color: #666;">
      총 ${text.length}자
    </div>
  `
  return createPageHTML('원바이트 PRO 문해력 훈련', `${grade} | ${date}`, content)
}

// 어휘 페이지 HTML 생성
const createVocabularyPageHTML = (vocabulary, grade, date) => {
  let content = '<h2 style="font-size: 16pt; font-weight: bold; margin-bottom: 20px;">어휘 학습</h2>'
  
  if (vocabulary.length > 0) {
    vocabulary.forEach((vocab, index) => {
      content += `
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 14pt; font-weight: bold; margin-bottom: 10px;">
            ${index + 1}. ${vocab.word}
          </h3>
          <div style="margin-left: 20px;">
            ${vocab.meaning ? `<p style="margin-bottom: 5px;"><strong>뜻:</strong> ${vocab.meaning}</p>` : ''}
            ${vocab.etymology ? `<p style="margin-bottom: 5px;"><strong>한자:</strong> ${vocab.etymology}</p>` : ''}
            ${vocab.example ? `<p style="margin-bottom: 5px;"><strong>예문:</strong> ${vocab.example}</p>` : ''}
            ${vocab.difficulty ? `<p style="font-size: 10pt; color: #666;">난이도: ${vocab.difficulty}</p>` : ''}
          </div>
        </div>
      `
    })
  } else {
    content += '<p style="color: #999;">선택된 어휘가 없습니다.</p>'
  }
  
  return createPageHTML('어휘 학습', `${grade} | ${date}`, content)
}

// 문제 페이지 HTML 생성
const createProblemsPageHTML = (problems, grade, date) => {
  let content = '<h2 style="font-size: 16pt; font-weight: bold; margin-bottom: 20px;">문해력 문제</h2>'
  
  if (problems.length > 0) {
    problems.forEach((problem, index) => {
      content += `
        <div style="margin-bottom: 25px;">
          <div style="font-size: 10pt; color: #666; margin-bottom: 5px;">
            ${problem.type === 'multiple_choice' ? '[객관식]' : '[서술형]'}
          </div>
          <h3 style="font-size: 12pt; font-weight: bold; margin-bottom: 10px;">
            ${index + 1}. ${problem.question}
          </h3>
      `
      
      if (problem.type === 'multiple_choice' && problem.options) {
        content += '<div style="margin-left: 20px;">'
        problem.options.forEach((option, optIndex) => {
          content += `<p style="margin-bottom: 5px;">${optIndex + 1}) ${option}</p>`
        })
        content += '</div>'
      } else if (problem.type === 'short_answer') {
        content += `
          <div style="margin-left: 20px;">
            <p style="font-size: 10pt; color: #999; margin-bottom: 10px;">
              (${problem.expectedLength || '1-2문장'} 답안 작성)
            </p>
            <div style="border-bottom: 1px solid #ccc; margin-bottom: 10px; height: 30px;"></div>
            <div style="border-bottom: 1px solid #ccc; margin-bottom: 10px; height: 30px;"></div>
            <div style="border-bottom: 1px solid #ccc; height: 30px;"></div>
          </div>
        `
      }
      
      content += '</div>'
    })
  } else {
    content += '<p style="color: #999;">생성된 문제가 없습니다.</p>'
  }
  
  return createPageHTML('문해력 문제', `${grade} | ${date}`, content)
}

export const generatePDF = async (data) => {
  const {
    title = '원바이트 PRO 문해력 훈련',
    grade,
    text,
    selectedVocabulary = [],
    generatedProblems = []
  } = data

  const date = new Date().toLocaleDateString('ko-KR')
  
  try {
    // PDF 생성
    const pdf = new jsPDF('portrait', 'mm', 'a4')
    
    // 페이지 1: 지문
    const page1 = createVirtualElement(createTextPageHTML(text, grade, date))
    const canvas1 = await html2canvas(page1, {
      scale: 2,
      useCORS: true,
      logging: false
    })
    document.body.removeChild(page1)
    
    const imgData1 = canvas1.toDataURL('image/png')
    pdf.addImage(imgData1, 'PNG', 0, 0, 210, 297)
    
    // 페이지 2: 어휘
    pdf.addPage()
    const page2 = createVirtualElement(createVocabularyPageHTML(selectedVocabulary, grade, date))
    const canvas2 = await html2canvas(page2, {
      scale: 2,
      useCORS: true,
      logging: false
    })
    document.body.removeChild(page2)
    
    const imgData2 = canvas2.toDataURL('image/png')
    pdf.addImage(imgData2, 'PNG', 0, 0, 210, 297)
    
    // 페이지 3: 문제
    pdf.addPage()
    const page3 = createVirtualElement(createProblemsPageHTML(generatedProblems, grade, date))
    const canvas3 = await html2canvas(page3, {
      scale: 2,
      useCORS: true,
      logging: false
    })
    document.body.removeChild(page3)
    
    const imgData3 = canvas3.toDataURL('image/png')
    pdf.addImage(imgData3, 'PNG', 0, 0, 210, 297)
    
    // 페이지 번호 추가
    const totalPages = pdf.internal.getNumberOfPages()
    pdf.setFontSize(9)
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i)
      pdf.text(`${i} / ${totalPages}`, 105, 290, { align: 'center' })
    }
    
    // PDF 다운로드
    const fileName = `문해력훈련_${grade}_${date.replace(/\//g, '-')}.pdf`
    pdf.save(fileName)
    
    return true
  } catch (error) {
    console.error('PDF 생성 오류:', error)
    throw error
  }
}