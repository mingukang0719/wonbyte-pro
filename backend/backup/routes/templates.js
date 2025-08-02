import express from 'express'
import { adminAuthMiddleware, requirePermission } from '../middleware/adminAuth.js'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const router = express.Router()
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// 모든 템플릿 조회
router.get('/', adminAuthMiddleware, async (req, res) => {
  try {
    const { data: templates, error } = await supabase
      .from('reading_templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json({
      success: true,
      templates
    })
  } catch (error) {
    console.error('Get templates error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch templates' 
    })
  }
})

// 템플릿 생성
router.post('/', adminAuthMiddleware, requirePermission('manage_templates'), async (req, res) => {
  try {
    const {
      title,
      content_type,
      difficulty,
      target_age,
      template_prompt,
      variables = []
    } = req.body

    // 입력 검증
    if (!title || !content_type || !difficulty || !target_age || !template_prompt) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      })
    }

    const { data: template, error } = await supabase
      .from('reading_templates')
      .insert({
        title,
        content_type,
        difficulty,
        target_age,
        template_prompt,
        variables,
        created_by: req.user.id
      })
      .select()
      .single()

    if (error) throw error

    // 감사 로그
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: 'CREATE_TEMPLATE',
      resource_type: 'template',
      resource_id: template.id,
      request_data: req.body,
      response_status: 201,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    })

    res.status(201).json({
      success: true,
      template
    })
  } catch (error) {
    console.error('Create template error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Failed to create template' 
    })
  }
})

// 템플릿 수정
router.put('/:id', adminAuthMiddleware, requirePermission('manage_templates'), async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const { data: template, error } = await supabase
      .from('reading_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      template
    })
  } catch (error) {
    console.error('Update template error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Failed to update template' 
    })
  }
})

// 템플릿 삭제 (soft delete)
router.delete('/:id', adminAuthMiddleware, requirePermission('manage_templates'), async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('reading_templates')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error

    res.json({
      success: true,
      message: 'Template deleted successfully'
    })
  } catch (error) {
    console.error('Delete template error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete template' 
    })
  }
})

export default router