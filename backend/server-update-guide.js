// server.js 업데이트 가이드
// 다음 코드를 기존 server.js에 추가하세요

// 1. Import 추가 (파일 상단)
import templateRoutes from './routes/templates.js'
import aiGenerationRoutes from './routes/aiGeneration.js'

// 2. 라우트 추가 (기존 라우트들 아래)
app.use('/api/admin/templates', templateRoutes)
app.use('/api/admin/ai', aiGenerationRoutes)

// 3. 관리자 전용 통계 엔드포인트 수정
app.get('/api/admin/stats', adminAuthMiddleware, async (req, res) => {
  try {
    // 기본 통계
    const stats = await supabaseService.getUsageStats()
    
    // Claude 사용 통계 추가
    const { data: claudeStats } = await supabase
      .from('ai_generation_logs')
      .select('ai_provider, tokens_used, cost_estimate')
      .eq('ai_provider', 'claude')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    const claudeUsage = claudeStats?.reduce((acc, log) => ({
      totalTokens: acc.totalTokens + (log.tokens_used || 0),
      totalCost: acc.totalCost + (log.cost_estimate || 0),
      count: acc.count + 1
    }), { totalTokens: 0, totalCost: 0, count: 0 })

    res.json({
      success: true,
      stats: {
        totalGenerations: stats.totalGenerations,
        totalTokens: stats.totalTokens,
        providerBreakdown: {
          ...stats.byProvider,
          claude: claudeUsage
        },
        contentTypeBreakdown: stats.byContentType,
        dailyUsage: stats.dailyUsage,
        templates: {
          total: await supabase.from('reading_templates').select('count'),
          active: await supabase.from('reading_templates').select('count').eq('is_active', true)
        }
      }
    })

  } catch (error) {
    console.error('Stats error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch stats' 
    })
  }
})

// 4. 에러 핸들링 미들웨어 강화 (맨 아래)
app.use((err, req, res, next) => {
  // 감사 로그 저장
  if (req.user) {
    supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: 'ERROR',
      resource_type: 'system',
      request_data: {
        method: req.method,
        path: req.path,
        error: err.message
      },
      response_status: 500,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    }).catch(console.error)
  }

  console.error(err.stack)
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})