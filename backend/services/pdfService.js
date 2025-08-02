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