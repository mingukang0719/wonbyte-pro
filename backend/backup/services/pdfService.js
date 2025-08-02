// 간단한 PDF 생성 서비스 (Puppeteer 없이 HTML → PDF)
import fs from 'fs/promises'
import path from 'path'

class PDFService {
  constructor() {
    this.A4_WIDTH = '210mm'
    this.A4_HEIGHT = '297mm'
  }

  async generatePDF(projectData) {
    const { title = '한국어 학습 자료', blocks = [] } = projectData

    try {
      // HTML 콘텐츠 생성
      const htmlContent = this.generateHTML(title, blocks)
      
      // 임시로 HTML 파일로 반환 (실제 PDF 생성은 클라이언트에서 처리)
      const fileName = `${title}-${Date.now()}.html`
      
      return {
        success: true,
        fileName,
        htmlContent,
        downloadUrl: `/api/pdf/download/${fileName}`,
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      console.error('PDF Generation Error:', error)
      throw new Error(`PDF 생성에 실패했습니다: ${error.message}`)
    }
  }

  // 문해력 훈련용 PDF 생성
  async generateLiteracyTrainingPDF(data) {
    const {
      title = '원바이트 PRO 문해력 훈련',
      grade,
      text,
      analysisResult,
      selectedVocabulary = [],
      generatedProblems = [],
      vocabularyProblems = [],
      readingProblems = [],
      timestamp
    } = data

    try {
      const htmlContent = this.generateLiteracyTrainingHTML({
        title,
        grade,
        text,
        analysisResult,
        selectedVocabulary,
        generatedProblems,
        vocabularyProblems,
        readingProblems,
        timestamp
      })

      const fileName = `문해력훈련_${grade}_${new Date().toISOString().split('T')[0]}.html`

      return {
        success: true,
        fileName,
        htmlContent,
        downloadUrl: `/api/pdf/download/${fileName}`,
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      console.error('Literacy Training PDF Generation Error:', error)
      throw new Error(`문해력 훈련 PDF 생성에 실패했습니다: ${error.message}`)
    }
  }

  generateLiteracyTrainingHTML(data) {
    const {
      title,
      grade,
      text,
      analysisResult,
      selectedVocabulary,
      generatedProblems,
      vocabularyProblems,
      readingProblems
    } = data

    const date = new Date().toLocaleDateString('ko-KR')

    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Noto Sans KR', sans-serif;
      background: #f8f9fa;
      color: #333;
      line-height: 1.6;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }

    .page {
      background: white;
      margin-bottom: 30px;
      padding: 40px;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    h1 {
      color: #2563eb;
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 10px;
      text-align: center;
    }

    h2 {
      color: #1e40af;
      font-size: 20px;
      font-weight: 600;
      margin: 30px 0 15px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }

    h3 {
      color: #374151;
      font-size: 16px;
      font-weight: 600;
      margin: 20px 0 10px 0;
    }

    .subtitle {
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      margin-bottom: 30px;
    }

    .reading-text {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin: 15px 0;
      font-size: 14px;
      line-height: 1.8;
    }

    .analysis-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin: 20px 0;
    }

    .analysis-item {
      background: #f3f4f6;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #3b82f6;
    }

    .analysis-item .label {
      font-weight: 600;
      color: #374151;
      margin-bottom: 5px;
    }

    .analysis-item .score {
      font-size: 18px;
      font-weight: 700;
      color: #2563eb;
    }

    .vocabulary-list {
      margin: 15px 0;
    }

    .vocabulary-item {
      background: #fef3c7;
      border: 1px solid #fbbf24;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 10px;
    }

    .vocabulary-word {
      font-weight: 600;
      color: #92400e;
      font-size: 16px;
    }

    .vocabulary-meaning {
      color: #451a03;
      margin-top: 5px;
      font-size: 14px;
    }

    .vocabulary-example {
      color: #78350f;
      margin-top: 5px;
      font-size: 13px;
      font-style: italic;
    }

    .problem-list {
      margin: 15px 0;
    }

    .problem-item {
      background: #fef2f2;
      border: 1px solid #fca5a5;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 15px;
    }

    .problem-question {
      font-weight: 600;
      color: #991b1b;
      margin-bottom: 10px;
    }

    .problem-options {
      margin-left: 15px;
    }

    .problem-option {
      margin: 5px 0;
      color: #7f1d1d;
    }

    .answer-section {
      margin-top: 30px;
    }

    .answer-item {
      background: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 10px;
    }

    .answer-text {
      font-weight: 600;
      color: #166534;
    }

    .answer-explanation {
      color: #15803d;
      margin-top: 5px;
      font-size: 14px;
    }

    .tips-section {
      background: #eff6ff;
      border: 1px solid #93c5fd;
      border-radius: 8px;
      padding: 20px;
      margin-top: 30px;
    }

    .tip-item {
      margin: 8px 0;
      color: #1e40af;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin: 20px 0;
    }

    .stats-item {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 15px;
      text-align: center;
    }

    .stats-number {
      font-size: 24px;
      font-weight: 700;
      color: #2563eb;
    }

    .stats-label {
      font-size: 12px;
      color: #64748b;
      margin-top: 5px;
    }

    @page {
      size: A4;
      margin: 0;
    }

    @media print {
      body {
        background: white !important;
      }
      
      .container {
        max-width: none;
        padding: 0;
      }

      .page {
        box-shadow: none;
        margin-bottom: 0;
        page-break-after: always;
      }

      .page:last-child {
        page-break-after: auto;
      }

      .no-print {
        display: none !important;
      }
    }

    .print-controls {
      text-align: center;
      margin: 30px 0;
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .print-button {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-size: 16px;
      cursor: pointer;
      font-family: 'Noto Sans KR', sans-serif;
      margin: 0 8px;
      transition: background-color 0.2s;
    }

    .print-button:hover {
      background: #2563eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- 인쇄 컨트롤 -->
    <div class="print-controls no-print">
      <h2>📄 PDF 생성</h2>
      <p style="margin: 10px 0; color: #666;">브라우저의 인쇄 기능을 사용하여 PDF로 저장하세요.</p>
      <button class="print-button" onclick="window.print()">
        📥 PDF로 저장 / 인쇄
      </button>
    </div>

    <!-- 페이지 1: 표지 및 개요 -->
    <div class="page">
      <h1>${title}</h1>
      <div class="subtitle">${grade} | ${date}</div>
      
      <div class="stats-grid">
        <div class="stats-item">
          <div class="stats-number">${text?.length || 0}</div>
          <div class="stats-label">총 글자 수</div>
        </div>
        <div class="stats-item">
          <div class="stats-number">${selectedVocabulary?.length || 0}</div>
          <div class="stats-label">학습 어휘</div>
        </div>
        <div class="stats-item">
          <div class="stats-number">${(vocabularyProblems?.length || 0) + (readingProblems?.length || 0)}</div>
          <div class="stats-label">훈련 문제</div>
        </div>
      </div>

      <h2>📖 읽기 지문</h2>
      <div class="reading-text">${this.escapeHtml(text || '')}</div>

      ${analysisResult ? `
      <h2>📊 문해력 난이도 분석</h2>
      <div class="analysis-grid">
        <div class="analysis-item">
          <div class="label">어휘 수준</div>
          <div class="score">${analysisResult.vocabularyLevel || 0}/10</div>
        </div>
        <div class="analysis-item">
          <div class="label">문장 복잡성</div>
          <div class="score">${analysisResult.sentenceComplexity || 0}/10</div>
        </div>
        <div class="analysis-item">
          <div class="label">내용 난이도</div>
          <div class="score">${analysisResult.contentLevel || 0}/10</div>
        </div>
        <div class="analysis-item">
          <div class="label">종합 점수</div>
          <div class="score">${analysisResult.totalScore || 0}/10</div>
        </div>
      </div>
      ` : ''}
    </div>

    <!-- 페이지 2: 어휘 학습 -->
    <div class="page">
      <h2>📝 핵심 어휘 학습</h2>
      ${selectedVocabulary && selectedVocabulary.length > 0 ? `
        <div class="vocabulary-list">
          ${selectedVocabulary.map((vocab, index) => `
            <div class="vocabulary-item">
              <div class="vocabulary-word">${index + 1}. ${vocab.word || vocab}</div>
              ${vocab.meaning ? `<div class="vocabulary-meaning">뜻: ${vocab.meaning}</div>` : ''}
              ${vocab.example ? `<div class="vocabulary-example">예문: ${vocab.example}</div>` : ''}
            </div>
          `).join('')}
        </div>
      ` : `
        <div style="text-align: center; color: #6b7280; padding: 40px;">
          선택된 어휘가 없습니다.
        </div>
      `}
    </div>

    <!-- 페이지 3: 문해력 문제 -->
    <div class="page">
      <h2>❓ 문해력 훈련 문제</h2>
      
      ${vocabularyProblems && vocabularyProblems.length > 0 ? `
        <h3>1. 어휘 이해 문제</h3>
        <div class="problem-list">
          ${vocabularyProblems.map((problem, index) => `
            <div class="problem-item">
              <div class="problem-question">문제 ${index + 1}: ${problem.question || `"${problem.word || ''}"의 의미로 가장 적절한 것은?`}</div>
              ${problem.options ? `
                <div class="problem-options">
                  ${problem.options.map((option, optIndex) => `
                    <div class="problem-option">${optIndex + 1}. ${option}</div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${readingProblems && readingProblems.length > 0 ? `
        <h3>2. 독해 이해 문제</h3>
        <div class="problem-list">
          ${readingProblems.map((problem, index) => `
            <div class="problem-item">
              <div class="problem-question">문제 ${index + 1}: ${problem.question || ''}</div>
              ${problem.options ? `
                <div class="problem-options">
                  ${problem.options.map((option, optIndex) => `
                    <div class="problem-option">${optIndex + 1}. ${option}</div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>

    <!-- 페이지 4: 정답 및 해설 -->
    <div class="page">
      <h2>✅ 정답 및 해설</h2>
      
      ${vocabularyProblems && vocabularyProblems.length > 0 ? `
        <h3>1. 어휘 이해 문제 정답</h3>
        <div class="answer-section">
          ${vocabularyProblems.map((problem, index) => `
            <div class="answer-item">
              <div class="answer-text">문제 ${index + 1}: 정답 ${(problem.answer || problem.correct || 0) + 1}번</div>
              ${problem.explanation ? `<div class="answer-explanation">해설: ${problem.explanation}</div>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${readingProblems && readingProblems.length > 0 ? `
        <h3>2. 독해 이해 문제 정답</h3>
        <div class="answer-section">
          ${readingProblems.map((problem, index) => `
            <div class="answer-item">
              <div class="answer-text">문제 ${index + 1}: 정답 ${(problem.answer || problem.correct || 0) + 1}번</div>
              ${problem.explanation ? `<div class="answer-explanation">해설: ${problem.explanation}</div>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="tips-section">
        <h3>💡 학습 팁</h3>
        <div class="tip-item">1. 모르는 단어가 나오면 문맥으로 뜻을 유추해보세요.</div>
        <div class="tip-item">2. 지문을 읽고 핵심 내용을 한 문장으로 요약해보세요.</div>
        <div class="tip-item">3. 문제를 풀기 전에 지문을 두 번 읽어보세요.</div>
        <div class="tip-item">4. 틀린 문제는 다시 한 번 지문을 찾아 확인해보세요.</div>
      </div>
    </div>
  </div>

  <script>
    // 키보드 단축키
    document.addEventListener('keydown', function(e) {
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        window.print();
      }
    });
  </script>
</body>
</html>`
  }

  generateHTML(title, blocks) {
    const blockHtml = blocks.map(block => {
      if (block.type === 'text') {
        return this.generateTextBlockHTML(block)
      }
      return ''
    }).join('\n')

    return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Noto Sans KR', sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }

    .page {
      width: ${this.A4_WIDTH};
      min-height: ${this.A4_HEIGHT};
      background: white;
      margin: 0 auto;
      padding: 20mm;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      position: relative;
    }

    .block {
      position: absolute;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .text-block {
      white-space: pre-wrap;
      line-height: 1.6;
    }

    @page {
      size: A4;
      margin: 0;
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .page {
        box-shadow: none;
        margin: 0;
        width: 100%;
        min-height: 100vh;
      }
    }

    /* 인쇄용 스타일 */
    .no-print {
      display: none !important;
    }
  </style>
</head>
<body>
  <div class="page">
    ${blockHtml}
    
    <!-- 페이지 정보 -->
    <div style="position: absolute; bottom: 10px; right: 10px; font-size: 10px; color: #999;">
      ${title} - 생성일: ${new Date().toLocaleDateString('ko-KR')}
    </div>
  </div>

  <!-- 인쇄 버튼 (화면에서만 보임) -->
  <div style="text-align: center; margin-top: 20px;" class="no-print">
    <button onclick="window.print()" style="
      background: #3b82f6;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      font-size: 16px;
      cursor: pointer;
      font-family: 'Noto Sans KR', sans-serif;
    ">
      PDF로 저장 / 인쇄
    </button>
    <p style="margin-top: 10px; color: #666; font-size: 14px;">
      브라우저의 인쇄 기능을 사용하여 PDF로 저장할 수 있습니다.
    </p>
  </div>

  <script>
    // 자동으로 인쇄 대화상자 열기 (선택사항)
    // window.onload = () => window.print();
  </script>
</body>
</html>`
  }

  generateTextBlockHTML(block) {
    const {
      x = 0,
      y = 0,
      width = 200,
      height = 100,
      text = '',
      fontSize = 16,
      fontFamily = 'Noto Sans KR',
      color = '#333333'
    } = block

    return `
    <div class="block text-block" style="
      left: ${x}px;
      top: ${y}px;
      width: ${width}px;
      height: ${height}px;
      font-size: ${fontSize}px;
      font-family: '${fontFamily}', sans-serif;
      color: ${color};
    ">${this.escapeHtml(text)}</div>`
  }

  escapeHtml(text) {
    if (!text) return ''
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/\n/g, '<br>')
  }
}

export default PDFService