# PDF 생성 시스템 설계

## 1. PDF 생성 시스템 개요

원바이트 Print 모드의 PDF 생성 시스템은 A4 페이지 기반의 한국어 학습 자료를 고품질 PDF로 변환하는 시스템입니다. Puppeteer를 기반으로 하여 정확한 레이아웃과 한국어 폰트를 지원합니다.

### 1.1 핵심 요구사항

- **정확한 A4 크기**: 210mm × 297mm (794px × 1123px at 96 DPI)
- **한국어 폰트 지원**: Noto Sans KR, 나눔고딕 등
- **고해상도 출력**: 인쇄용 300 DPI 품질
- **블록 기반 레이아웃**: 정확한 위치와 크기 유지
- **배치 처리**: 대량 PDF 생성 지원
- **워터마크 지원**: 무료/유료 사용자 구분

## 2. 시스템 아키텍처

```
PDF 생성 파이프라인
├── 1. 데이터 수집 (Project + Blocks)
├── 2. HTML 템플릿 생성
├── 3. CSS 스타일 적용
├── 4. Puppeteer 렌더링
├── 5. PDF 최적화
├── 6. 파일 저장 및 URL 생성
└── 7. 사용자 알림 및 다운로드
```

## 3. PDF 생성 서비스 구현

### 3.1 메인 PDF 생성 서비스

```javascript
// backend/services/pdfService.js
import puppeteer from 'puppeteer'
import handlebars from 'handlebars'
import fs from 'fs/promises'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

class PDFGenerationService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    )
    this.browserPool = new BrowserPool()
    this.templateCache = new Map()
    this.fontCache = new Map()
  }

  async generatePDF(projectId, userId, options = {}) {
    const startTime = Date.now()
    let browser = null

    try {
      // 1. 프로젝트 데이터 수집
      const projectData = await this.getProjectData(projectId, userId)
      
      // 2. 생성 로그 생성
      const exportLog = await this.createExportLog(projectId, userId, options)

      // 3. HTML 콘텐츠 생성
      const htmlContent = await this.generateHTML(projectData, options)

      // 4. 브라우저 인스턴스 획득
      browser = await this.browserPool.acquire()
      const page = await browser.newPage()

      // 5. 페이지 설정
      await this.configurePage(page, options)

      // 6. 콘텐츠 로드
      await page.setContent(htmlContent, { 
        waitUntil: 'networkidle0',
        timeout: 30000
      })

      // 7. PDF 생성
      const pdfBuffer = await this.generatePDFBuffer(page, projectData, options)

      // 8. 파일 저장
      const filePath = await this.savePDFFile(pdfBuffer, projectId, userId)

      // 9. 생성 로그 업데이트
      const processingTime = Date.now() - startTime
      await this.updateExportLog(exportLog.id, {
        processing_status: 'completed',
        file_path: filePath,
        file_size: pdfBuffer.length,
        processing_time_ms: processingTime
      })

      return {
        success: true,
        fileUrl: filePath,
        fileSize: pdfBuffer.length,
        processingTime: processingTime,
        exportId: exportLog.id
      }

    } catch (error) {
      console.error('PDF Generation Error:', error)
      
      // 실패 로그 업데이트
      if (exportLog?.id) {
        await this.updateExportLog(exportLog.id, {
          processing_status: 'failed',
          error_message: error.message,
          processing_time_ms: Date.now() - startTime
        })
      }

      throw error

    } finally {
      if (browser) {
        await this.browserPool.release(browser)
      }
    }
  }

  async getProjectData(projectId, userId) {
    // 프로젝트 기본 정보
    const { data: project, error: projectError } = await this.supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (projectError || !project) {
      throw new Error('프로젝트를 찾을 수 없습니다.')
    }

    // 블록 데이터
    const { data: blocks, error: blocksError } = await this.supabase
      .from('blocks')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index')

    if (blocksError) {
      throw new Error('블록 데이터를 가져올 수 없습니다.')
    }

    // 파일 업로드 정보
    const { data: files, error: filesError } = await this.supabase
      .from('file_uploads')
      .select('*')
      .eq('project_id', projectId)

    return {
      project,
      blocks: blocks || [],
      files: files || []
    }
  }

  async generateHTML(projectData, options) {
    const { project, blocks, files } = projectData
    
    // 파일 맵 생성 (빠른 조회용)
    const fileMap = new Map()
    files.forEach(file => {
      if (file.block_id) {
        fileMap.set(file.block_id, file)
      }
    })

    // 블록 데이터 준비
    const processedBlocks = await Promise.all(
      blocks.map(async (block) => {
        const processedBlock = await this.processBlock(block, fileMap, options)
        return processedBlock
      })
    )

    // HTML 템플릿 생성
    const templateData = {
      project,
      blocks: processedBlocks,
      options,
      styles: await this.generateStyles(options),
      fonts: await this.getFontUrls(options)
    }

    const template = await this.getHTMLTemplate()
    const compiledTemplate = handlebars.compile(template)
    
    return compiledTemplate(templateData)
  }

  async processBlock(block, fileMap, options) {
    const processedBlock = {
      ...block,
      style: this.generateBlockStyle(block),
      content: await this.processBlockContent(block, fileMap, options)
    }

    return processedBlock
  }

  generateBlockStyle(block) {
    return [
      `position: absolute`,
      `left: ${block.position_x}px`,
      `top: ${block.position_y}px`,
      `width: ${block.width}px`,
      `height: ${block.height}px`,
      `transform: rotate(${block.rotation || 0}deg)`,
      `z-index: ${block.layer || 0}`,
      `visibility: ${block.is_visible ? 'visible' : 'hidden'}`,
      ...(block.styles ? Object.entries(block.styles).map(([k, v]) => `${k}: ${v}`) : [])
    ].join('; ')
  }

  async processBlockContent(block, fileMap, options) {
    switch (block.type) {
      case 'text':
        return this.processTextBlock(block)
      
      case 'image':
        return await this.processImageBlock(block, fileMap)
      
      case 'table':
        return this.processTableBlock(block)
      
      case 'quiz':
        return this.processQuizBlock(block, options)
      
      default:
        return block.content
    }
  }

  processTextBlock(block) {
    const content = block.content
    const fontSize = content.fontSize || 14
    const fontFamily = content.fontFamily || 'Noto Sans KR'
    const textAlign = content.textAlign || 'left'
    const lineHeight = content.lineHeight || 1.6
    const color = content.color || '#333333'

    return `
      <div style="
        font-size: ${fontSize}px;
        font-family: '${fontFamily}', sans-serif;
        text-align: ${textAlign};
        line-height: ${lineHeight};
        color: ${color};
        word-wrap: break-word;
        overflow-wrap: break-word;
      ">
        ${this.escapeHtml(content.text || '')}
      </div>
    `
  }

  async processImageBlock(block, fileMap) {
    const file = fileMap.get(block.id)
    if (!file) {
      return '<div style="background: #f0f0f0; display: flex; align-items: center; justify-content: center;">이미지 없음</div>'
    }

    const imageUrl = file.cdn_url || file.file_path
    const alt = block.content.alt || ''
    const objectFit = block.content.objectFit || 'cover'
    const borderRadius = block.content.borderRadius || 0

    return `
      <img 
        src="${imageUrl}" 
        alt="${this.escapeHtml(alt)}"
        style="
          width: 100%;
          height: 100%;
          object-fit: ${objectFit};
          border-radius: ${borderRadius}px;
        "
      />
    `
  }

  processTableBlock(block) {
    const tableData = block.content
    const borderStyle = tableData.borderStyle || '1px solid #ddd'
    const cellPadding = tableData.cellPadding || '8px'

    let html = `<table style="width: 100%; border-collapse: collapse;">`
    
    // 헤더
    if (tableData.headers) {
      html += '<thead><tr>'
      tableData.headers.forEach(header => {
        html += `<th style="border: ${borderStyle}; padding: ${cellPadding}; background: #f8f9fa;">${this.escapeHtml(header)}</th>`
      })
      html += '</tr></thead>'
    }

    // 데이터 행
    html += '<tbody>'
    if (tableData.rows) {
      tableData.rows.forEach(row => {
        html += '<tr>'
        row.forEach(cell => {
          html += `<td style="border: ${borderStyle}; padding: ${cellPadding};">${this.escapeHtml(cell)}</td>`
        })
        html += '</tr>'
      })
    }
    html += '</tbody></table>'

    return html
  }

  processQuizBlock(block, options) {
    const quiz = block.content
    const showAnswers = options.showAnswers || false

    let html = `<div class="quiz-block">`
    
    if (quiz.question) {
      html += `<h4 style="margin: 0 0 10px 0;">${this.escapeHtml(quiz.question)}</h4>`
    }

    if (quiz.type === 'multiple-choice' && quiz.options) {
      html += '<ol style="margin: 10px 0;">'
      quiz.options.forEach((option, index) => {
        const isCorrect = showAnswers && index === quiz.correctAnswer
        const style = isCorrect ? 'font-weight: bold; color: #22c55e;' : ''
        html += `<li style="${style}">${this.escapeHtml(option)}</li>`
      })
      html += '</ol>'
    } else if (quiz.type === 'fill-in-blank') {
      const sentence = quiz.sentence || ''
      const answer = showAnswers ? quiz.answer : '___________'
      html += `<p>${this.escapeHtml(sentence.replace('_____', answer))}</p>`
    }

    if (showAnswers && quiz.explanation) {
      html += `<p style="margin-top: 10px; padding: 8px; background: #f0f9ff; border-left: 4px solid #0ea5e9;"><strong>설명:</strong> ${this.escapeHtml(quiz.explanation)}</p>`
    }

    html += '</div>'
    return html
  }

  async getHTMLTemplate() {
    if (this.templateCache.has('main')) {
      return this.templateCache.get('main')
    }

    const template = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>{{project.title}}</title>
      
      {{#each fonts}}
      <link href="{{this}}" rel="stylesheet">
      {{/each}}
      
      <style>
        {{{styles}}}
      </style>
    </head>
    <body>
      <div class="page">
        {{#if options.showHeader}}
        <header class="page-header">
          <h1>{{project.title}}</h1>
          {{#if project.description}}
          <p>{{project.description}}</p>
          {{/if}}
        </header>
        {{/if}}

        <main class="page-content">
          {{#each blocks}}
          <div class="block block-{{type}}" style="{{{style}}}">
            {{{content}}}
          </div>
          {{/each}}
        </main>

        {{#if options.showFooter}}
        <footer class="page-footer">
          <p>원바이트 Print 모드로 생성됨 - {{formatDate project.created_at}}</p>
        </footer>
        {{/if}}

        {{#if options.watermark}}
        <div class="watermark">{{options.watermark}}</div>
        {{/if}}
      </div>
    </body>
    </html>
    `

    this.templateCache.set('main', template)
    return template
  }

  async generateStyles(options) {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif;
        font-size: 14px;
        line-height: 1.6;
        color: #333;
        background: white;
      }

      .page {
        width: 210mm;
        min-height: 297mm;
        margin: 0 auto;
        background: white;
        position: relative;
        padding: ${options.pageMargins?.top || 20}mm ${options.pageMargins?.right || 20}mm ${options.pageMargins?.bottom || 20}mm ${options.pageMargins?.left || 20}mm;
      }

      .page-header {
        margin-bottom: 20px;
        border-bottom: 2px solid #e5e7eb;
        padding-bottom: 10px;
      }

      .page-header h1 {
        font-size: 24px;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 5px;
      }

      .page-header p {
        font-size: 14px;
        color: #6b7280;
      }

      .page-content {
        position: relative;
        min-height: calc(297mm - ${(options.pageMargins?.top || 20) + (options.pageMargins?.bottom || 20)}mm - 40mm);
      }

      .page-footer {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        text-align: center;
        font-size: 12px;
        color: #9ca3af;
        border-top: 1px solid #e5e7eb;
        padding-top: 10px;
      }

      .block {
        position: absolute;
      }

      .block-text {
        word-break: keep-all;
        overflow-wrap: break-word;
      }

      .block-image img {
        max-width: 100%;
        height: auto;
      }

      .block-table table {
        border-collapse: collapse;
        width: 100%;
      }

      .block-table th,
      .block-table td {
        border: 1px solid #d1d5db;
        padding: 8px;
        text-align: left;
      }

      .block-table th {
        background-color: #f9fafb;
        font-weight: 600;
      }

      .quiz-block {
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 16px;
        background: #fafafa;
      }

      .quiz-block h4 {
        color: #1f2937;
        margin-bottom: 12px;
      }

      .quiz-block ol {
        padding-left: 20px;
      }

      .quiz-block li {
        margin-bottom: 4px;
      }

      .watermark {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        font-size: 48px;
        color: rgba(0, 0, 0, 0.1);
        font-weight: bold;
        pointer-events: none;
        z-index: 1000;
      }

      @page {
        size: A4;
        margin: 0;
      }

      @media print {
        body {
          margin: 0;
        }
        
        .page {
          box-shadow: none;
          margin: 0;
        }
      }
    `
  }

  async getFontUrls(options) {
    return [
      'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap'
    ]
  }

  async configurePage(page, options) {
    // A4 크기 설정 (794 x 1123 pixels at 96 DPI)
    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: options.quality === 'high' ? 2 : 1
    })

    // 미디어 타입 설정
    await page.emulateMediaType('print')

    // 추가 CSS 주입 (필요한 경우)
    await page.addStyleTag({
      content: `
        body { 
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
      `
    })
  }

  async generatePDFBuffer(page, projectData, options) {
    const pdfOptions = {
      format: 'A4',
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      },
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false
    }

    // 품질별 설정
    if (options.quality === 'high') {
      pdfOptions.quality = 100
    } else if (options.quality === 'draft') {
      pdfOptions.quality = 60
    }

    return await page.pdf(pdfOptions)
  }

  async savePDFFile(pdfBuffer, projectId, userId) {
    const fileName = `project-${projectId}-${Date.now()}.pdf`
    const filePath = `pdfs/${userId}/${fileName}`

    // Supabase Storage에 업로드
    const { data, error } = await this.supabase.storage
      .from('exports')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false
      })

    if (error) {
      throw new Error(`PDF 파일 저장 실패: ${error.message}`)
    }

    // 공개 URL 생성
    const { data: { publicUrl } } = this.supabase.storage
      .from('exports')
      .getPublicUrl(filePath)

    return publicUrl
  }

  async createExportLog(projectId, userId, options) {
    const { data, error } = await this.supabase
      .from('pdf_exports')
      .insert({
        user_id: userId,
        project_id: projectId,
        export_settings: options,
        processing_status: 'processing'
      })
      .select()
      .single()

    if (error) {
      throw new Error(`내보내기 로그 생성 실패: ${error.message}`)
    }

    return data
  }

  async updateExportLog(exportId, updates) {
    const { error } = await this.supabase
      .from('pdf_exports')
      .update(updates)
      .eq('id', exportId)

    if (error) {
      console.error('Export log update error:', error)
    }
  }

  escapeHtml(text) {
    if (!text) return ''
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }
}
```

### 3.2 브라우저 풀 관리

```javascript
// backend/utils/browserPool.js
class BrowserPool {
  constructor(options = {}) {
    this.maxInstances = options.maxInstances || 3
    this.instances = []
    this.available = []
    this.waiting = []
    this.browserOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    }
  }

  async acquire() {
    if (this.available.length > 0) {
      return this.available.pop()
    }

    if (this.instances.length < this.maxInstances) {
      const browser = await puppeteer.launch(this.browserOptions)
      this.instances.push(browser)
      return browser
    }

    // 대기열에 추가
    return new Promise((resolve) => {
      this.waiting.push(resolve)
    })
  }

  async release(browser) {
    if (this.waiting.length > 0) {
      const resolve = this.waiting.shift()
      resolve(browser)
    } else {
      this.available.push(browser)
    }
  }

  async cleanup() {
    const browsers = [...this.instances]
    this.instances = []
    this.available = []
    
    await Promise.all(
      browsers.map(browser => browser.close().catch(console.error))
    )
  }
}
```

### 3.3 배치 처리 시스템

```javascript
// backend/services/batchPDFService.js
class BatchPDFService {
  constructor() {
    this.queue = []
    this.processing = false
    this.concurrency = 2
  }

  async addToQueue(projectId, userId, options = {}) {
    const job = {
      id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      userId,
      options,
      status: 'queued',
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: 3
    }

    this.queue.push(job)
    
    if (!this.processing) {
      this.processQueue()
    }

    return job.id
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true
    const pdfService = new PDFGenerationService()

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.concurrency)
      
      await Promise.allSettled(
        batch.map(job => this.processJob(job, pdfService))
      )
    }

    this.processing = false
  }

  async processJob(job, pdfService) {
    try {
      job.status = 'processing'
      job.startedAt = new Date()

      const result = await pdfService.generatePDF(
        job.projectId,
        job.userId,
        job.options
      )

      job.status = 'completed'
      job.completedAt = new Date()
      job.result = result

      // 성공 알림
      await this.notifyUser(job.userId, {
        type: 'pdf_completed',
        jobId: job.id,
        downloadUrl: result.fileUrl
      })

    } catch (error) {
      job.attempts++
      job.lastError = error.message

      if (job.attempts >= job.maxAttempts) {
        job.status = 'failed'
        job.failedAt = new Date()

        // 실패 알림
        await this.notifyUser(job.userId, {
          type: 'pdf_failed',
          jobId: job.id,
          error: error.message
        })
      } else {
        job.status = 'queued'
        this.queue.push(job) // 재시도를 위해 큐에 다시 추가
      }
    }
  }

  async notifyUser(userId, notification) {
    // 웹소켓 또는 이메일을 통한 사용자 알림
    console.log(`Notification for user ${userId}:`, notification)
  }

  getJobStatus(jobId) {
    const job = this.queue.find(j => j.id === jobId)
    if (!job) {
      return { status: 'not_found' }
    }

    return {
      status: job.status,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      failedAt: job.failedAt,
      attempts: job.attempts,
      error: job.lastError,
      result: job.result
    }
  }
}
```

## 4. API 엔드포인트

```javascript
// backend/routes/pdf.js
import express from 'express'
import { PDFGenerationService } from '../services/pdfService.js'
import { BatchPDFService } from '../services/batchPDFService.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()
const pdfService = new PDFGenerationService()
const batchService = new BatchPDFService()

// PDF 생성 (즉시)
router.post('/generate/:projectId', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params
    const userId = req.user.id
    const options = req.body

    const result = await pdfService.generatePDF(projectId, userId, options)
    
    res.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('PDF Generation Error:', error)
    res.status(500).json({
      success: false,
      error: 'PDF 생성에 실패했습니다.',
      message: error.message
    })
  }
})

// PDF 생성 (배치)
router.post('/generate-batch/:projectId', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params
    const userId = req.user.id
    const options = req.body

    const jobId = await batchService.addToQueue(projectId, userId, options)
    
    res.json({
      success: true,
      jobId,
      message: 'PDF 생성이 대기열에 추가되었습니다.'
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'PDF 생성 요청에 실패했습니다.',
      message: error.message
    })
  }
})

// 작업 상태 확인
router.get('/job/:jobId', authMiddleware, async (req, res) => {
  try {
    const { jobId } = req.params
    const status = batchService.getJobStatus(jobId)
    
    res.json({
      success: true,
      data: status
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      error: '작업 상태 확인에 실패했습니다.'
    })
  }
})

// PDF 다운로드
router.get('/download/:exportId', authMiddleware, async (req, res) => {
  try {
    const { exportId } = req.params
    const userId = req.user.id

    // 내보내기 정보 조회
    const { data: exportData, error } = await supabase
      .from('pdf_exports')
      .select('*')
      .eq('id', exportId)
      .eq('user_id', userId)
      .single()

    if (error || !exportData) {
      return res.status(404).json({
        success: false,
        error: '파일을 찾을 수 없습니다.'
      })
    }

    // 다운로드 카운트 증가
    await supabase
      .from('pdf_exports')
      .update({ 
        download_count: exportData.download_count + 1,
        last_downloaded_at: new Date().toISOString()
      })
      .eq('id', exportId)

    res.redirect(exportData.file_path)

  } catch (error) {
    res.status(500).json({
      success: false,
      error: '파일 다운로드에 실패했습니다.'
    })
  }
})

// 내보내기 히스토리
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    const { limit = 20, offset = 0 } = req.query

    const { data: exports, error } = await supabase
      .from('pdf_exports')
      .select(`
        *,
        projects:project_id (title, description)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    res.json({
      success: true,
      data: exports
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      error: '내보내기 히스토리 조회에 실패했습니다.'
    })
  }
})

export default router
```

## 5. 프론트엔드 PDF 서비스

```javascript
// src/services/pdfService.js
class PDFService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001'
  }

  async generatePDF(projectId, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}/api/pdf/generate/${projectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(options)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'PDF 생성에 실패했습니다.')
      }

      return data.data

    } catch (error) {
      console.error('PDF Service Error:', error)
      throw error
    }
  }

  async generateBatchPDF(projectId, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}/api/pdf/generate-batch/${projectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(options)
      })

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'PDF 생성 요청에 실패했습니다.')
      }

      return data.jobId

    } catch (error) {
      console.error('Batch PDF Service Error:', error)
      throw error
    }
  }

  async checkJobStatus(jobId) {
    try {
      const response = await fetch(`${this.baseURL}/api/pdf/job/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await response.json()
      return data.data

    } catch (error) {
      console.error('Job Status Error:', error)
      return null
    }
  }

  async getExportHistory(limit = 20, offset = 0) {
    try {
      const response = await fetch(
        `${this.baseURL}/api/pdf/history?limit=${limit}&offset=${offset}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )

      const data = await response.json()
      return data.data

    } catch (error) {
      console.error('Export History Error:', error)
      return []
    }
  }

  downloadPDF(exportId) {
    const url = `${this.baseURL}/api/pdf/download/${exportId}`
    const link = document.createElement('a')
    link.href = url
    link.target = '_blank'
    link.click()
  }
}

export default new PDFService()
```

## 6. 성능 최적화 및 모니터링

### 6.1 성능 최적화

```javascript
// backend/utils/pdfOptimizer.js
class PDFOptimizer {
  static async optimizeImages(htmlContent) {
    // 이미지 최적화 로직
    return htmlContent.replace(
      /<img[^>]+src="([^"]+)"[^>]*>/g,
      (match, src) => {
        if (src.includes('?')) {
          return match.replace(src, `${src}&w=800&q=80`)
        } else {
          return match.replace(src, `${src}?w=800&q=80`)
        }
      }
    )
  }

  static async compressPDF(pdfBuffer, quality = 'standard') {
    // PDF 압축 로직 (필요한 경우)
    if (quality === 'draft') {
      // 압축 적용
    }
    return pdfBuffer
  }

  static estimateProcessingTime(blockCount, hasImages = false) {
    let baseTime = 2000 // 2초 기본
    baseTime += blockCount * 100 // 블록당 100ms
    if (hasImages) {
      baseTime += 3000 // 이미지가 있으면 3초 추가
    }
    return baseTime
  }
}
```

### 6.2 모니터링 및 로깅

```javascript
// backend/utils/pdfMetrics.js
class PDFMetrics {
  static async logGeneration(userId, projectId, startTime, endTime, success, fileSize = 0) {
    const processingTime = endTime - startTime
    
    // 성능 메트릭 로깅
    console.log(`PDF Generation Metrics:`, {
      userId,
      projectId,
      processingTime,
      success,
      fileSize,
      timestamp: new Date().toISOString()
    })

    // 데이터베이스에 저장 (선택적)
    // await this.saveMetrics(...)
  }

  static async getAverageProcessingTime() {
    // 평균 처리 시간 계산
    return 5000 // 5초 (예시)
  }

  static async getSuccessRate() {
    // 성공률 계산
    return 0.95 // 95% (예시)
  }
}
```

이 PDF 생성 시스템은 고품질의 한국어 학습 자료를 정확한 A4 형식으로 출력할 수 있으며, 확장성과 성능을 고려하여 설계되었습니다. 배치 처리와 브라우저 풀을 통해 대량 처리도 효율적으로 지원합니다.