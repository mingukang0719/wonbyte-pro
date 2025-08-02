// 매우 간단한 테스트 라우트
import express from 'express'

const router = express.Router()

// 가장 기본적인 테스트 엔드포인트
router.get('/ping', (req, res) => {
  res.json({ 
    success: true, 
    message: 'pong',
    timestamp: new Date().toISOString(),
    version: '2024-08-02-fix'
  })
})

// POST 테스트
router.post('/echo', (req, res) => {
  res.json({
    success: true,
    received: req.body,
    timestamp: new Date().toISOString()
  })
})

export default router