// Frontend PDF service - generates HTML for browser printing
class PDFService {
  constructor() {
    this.A4_WIDTH = '210mm'
    this.A4_HEIGHT = '297mm'
  }

  generatePDF(projectData) {
    const { title = '한국어 학습 자료', blocks = [] } = projectData

    try {
      // Generate HTML content
      const htmlContent = this.generateHTML(title, blocks)
      
      return {
        success: true,
        htmlContent,
        title
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

    @media print {
      .no-print {
        display: none !important;
      }
    }

    .print-controls {
      text-align: center;
      margin-top: 20px;
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

    .close-button {
      background: #6b7280;
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

    .close-button:hover {
      background: #4b5563;
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

  <!-- 인쇄 컨트롤 (화면에서만 보임) -->
  <div class="print-controls no-print">
    <h2 style="margin-bottom: 16px; color: #1f2937;">PDF 내보내기</h2>
    <p style="margin-bottom: 20px; color: #666; font-size: 14px;">
      브라우저의 인쇄 기능을 사용하여 PDF로 저장할 수 있습니다.
    </p>
    <button class="print-button" onclick="window.print()">
      📄 PDF로 저장 / 인쇄
    </button>
    <button class="close-button" onclick="window.close()">
      ✕ 닫기
    </button>
  </div>

  <script>
    // 인쇄 완료 후 처리
    window.addEventListener('afterprint', function() {
      // Print completed
    });

    // 키보드 단축키
    document.addEventListener('keydown', function(e) {
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        window.print();
      }
      if (e.key === 'Escape') {
        window.close();
      }
    });
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

  // Open PDF preview in new window
  openPDFPreview(title, blocks) {
    const result = this.generatePDF({ title, blocks })
    
    if (result.success) {
      const previewWindow = window.open('', '_blank', 'width=900,height=1200,scrollbars=yes')
      previewWindow.document.write(result.htmlContent)
      previewWindow.document.close()
      return true
    }
    return false
  }
}

export default PDFService