import express from 'express'
import PDFService from '../services/pdfService.js'

const router = express.Router()
const pdfService = new PDFService()

// PDF 생성 엔드포인트 (공개)
router.post('/generate', async (req, res) => {
  try {
    const { 
      title = '원바이트 PRO 문해력 훈련',
      grade,
      text,
      analysisResult,
      selectedVocabulary = [],
      generatedProblems = [],
      vocabularyProblems = [],
      readingProblems = []
    } = req.body

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required for PDF generation'
      })
    }

    // PDF 생성 데이터 준비
    const pdfData = {
      title,
      grade: grade || '초등학교 4학년',
      text,
      analysisResult,
      selectedVocabulary,
      generatedProblems,
      vocabularyProblems,
      readingProblems,
      timestamp: new Date().toISOString()
    }

    const result = await pdfService.generateLiteracyTrainingPDF(pdfData)
    
    res.json({
      success: true,
      ...result,
      metadata: {
        contentLength: text.length,
        vocabularyCount: selectedVocabulary.length,
        problemCount: vocabularyProblems.length + readingProblems.length,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('PDF generation error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate PDF',
      message: error.message
    })
  }
})

// PDF 다운로드 엔드포인트
router.get('/download/:filename', async (req, res) => {
  try {
    const { filename } = req.params
    
    // 보안을 위한 파일명 검증
    if (!filename || filename.includes('..') || !filename.endsWith('.html')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filename'
      })
    }

    // 실제로는 임시 파일 저장소나 메모리 캐시에서 가져와야 함
    // 현재는 클라이언트에서 직접 HTML을 받아서 처리하도록 안내
    res.json({
      success: false,
      error: 'Direct download not implemented',
      message: 'Please use browser print function to save as PDF'
    })

  } catch (error) {
    console.error('PDF download error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to download PDF'
    })
  }
})

export default router