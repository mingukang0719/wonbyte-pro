/**
 * PDF 생성 유틸리티
 * 실제 구현은 react-pdf/renderer 라이브러리를 설치해야 함
 * 현재는 기본 구조만 제공
 */

export const generatePDF = async (data) => {
  const {
    grade,
    text,
    analysisResult,
    vocabularyProblems,
    readingProblems,
    date = new Date().toLocaleDateString('ko-KR')
  } = data

  // PDF 생성을 위한 데이터 구조
  const pdfContent = {
    metadata: {
      title: '원바이트 PRO 문해력 훈련 자료',
      author: '원바이트 PRO',
      subject: `${grade} 문해력 훈련`,
      keywords: '문해력, 훈련, 한국어, 읽기',
      createdAt: date
    },
    
    content: {
      // 표지
      cover: {
        title: '문해력 훈련 자료',
        subtitle: grade,
        date: date
      },
      
      // 지문
      reading: {
        title: '읽기 지문',
        text: text,
        wordCount: text.length
      },
      
      // 분석 결과
      analysis: analysisResult ? {
        title: '문해력 난이도 분석',
        items: [
          { label: '지문 길이', score: analysisResult.textLength },
          { label: '어휘 수준', score: analysisResult.vocabularyLevel },
          { label: '문장 구조 복잡성', score: analysisResult.sentenceComplexity },
          { label: '내용 구성 수준', score: analysisResult.contentLevel },
          { label: '배경지식 의존도', score: analysisResult.backgroundKnowledge },
          { label: '종합 난이도', score: analysisResult.totalScore }
        ]
      } : null,
      
      // 어휘 문제
      vocabulary: {
        title: '어휘 이해 문제',
        problems: vocabularyProblems.map((problem, index) => ({
          number: index + 1,
          question: problem.question,
          options: problem.options,
          answer: problem.answer
        }))
      },
      
      // 독해 문제
      comprehension: {
        title: '독해 이해 문제',
        problems: readingProblems.map((problem, index) => ({
          number: index + 1,
          question: problem.question,
          options: problem.options,
          answer: problem.answer
        }))
      },
      
      // 정답
      answers: {
        title: '정답',
        vocabulary: vocabularyProblems.map((p, i) => ({
          number: i + 1,
          answer: p.answer + 1
        })),
        reading: readingProblems.map((p, i) => ({
          number: i + 1,
          answer: p.answer + 1
        }))
      }
    }
  }

  // 실제 PDF 생성 로직은 react-pdf/renderer 설치 후 구현
  // PDF 데이터가 준비됨: pdfContent
  
  // 임시로 JSON 파일로 다운로드
  const blob = new Blob([JSON.stringify(pdfContent, null, 2)], { 
    type: 'application/json' 
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `문해력훈련_${date.replace(/\//g, '-')}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  return true
}