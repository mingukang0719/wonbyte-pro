import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// 관리자 인증 미들웨어
export const adminAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    // JWT 토큰 검증
    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError)
      return res.status(401).json({ error: 'Invalid token' })
    }

    // JWT 토큰에서 사용자 정보 사용
    const userId = decoded.userId
    const userEmail = decoded.email
    const userRole = decoded.role

    // 관리자 권한 확인 (간단한 체크)
    if (userRole !== 'admin') {
      // Supabase에서 관리자 권한 확인
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select(`
          *,
          admin_roles (
            role_name,
            permissions
          )
        `)
        .eq('id', userId)
        .eq('is_active', true)
        .single()

      if (adminError || !adminUser) {
        console.error('Admin check error:', adminError)
        return res.status(403).json({ error: 'Not authorized as admin' })
      }

      // 요청 객체에 사용자 정보 추가
      req.user = { id: userId, email: userEmail }
      req.adminRole = adminUser.admin_roles?.role_name
      req.permissions = adminUser.admin_roles?.permissions
    } else {
      // JWT에 admin role이 있는 경우
      req.user = { id: userId, email: userEmail }
      req.adminRole = 'admin'
      req.permissions = { all: true }
    }

    next()
  } catch (error) {
    console.error('Admin auth error:', error)
    res.status(500).json({ error: 'Authentication failed' })
  }
}

// 특정 권한 확인 미들웨어
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.permissions) {
      return res.status(403).json({ error: 'No permissions found' })
    }

    if (req.permissions.all || req.permissions[permission]) {
      next()
    } else {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permission 
      })
    }
  }
}

export default adminAuthMiddleware