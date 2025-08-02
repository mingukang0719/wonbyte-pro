// Unified configuration file
// Force deployment update - 2025-08-02 14:30
// Using wonbyte-pro.onrender.com as backend - FORCE REBUILD
const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

// API Configuration
// Vite 환경 변수 우선, 없으면 프로덕션/개발 환경에 따라 기본값 사용
const API_URL = import.meta.env?.VITE_API_URL || 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001'
    : 'https://wonbyte-pro.onrender.com')

// Supabase Configuration
const SUPABASE_URL = 'https://jqlouemxgafrbzdxyojl.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxbG91ZW14Z2FmcmJ6ZHh5b2psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMDE5ODgsImV4cCI6MjA2OTY3Nzk4OH0.lzd76e3ZeH5eq33G6V6FMbs5lDToV9tGDUIilAVDPYI'

// GitHub Pages Configuration
const GITHUB_PAGES_BASENAME = '/'

export const config = {
  // Environment
  isDevelopment,
  isProduction,
  
  // API Settings
  apiUrl: API_URL,
  demo: false,
  
  // Supabase Settings
  supabase: {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY
  },
  
  // GitHub Pages
  basename: GITHUB_PAGES_BASENAME,
  
  // API Endpoints
  endpoints: {
    // Admin endpoints
    adminLogin: `${API_URL}/api/admin/login`,
    adminStats: `${API_URL}/api/admin/stats`,
    adminTemplates: `${API_URL}/api/admin/templates`,
    
    // AI Generation endpoints
    generateFromTemplate: `${API_URL}/api/ai/generate-from-template`,
    generateDirect: `${API_URL}/api/ai/generate-direct`,
    generateBatch: `${API_URL}/api/ai/generate-batch`,
    generationHistory: `${API_URL}/api/ai/history`,
    
    // Health check
    health: `${API_URL}/api/health`
  }
}

// API Fetch Helper
export const apiFetch = async (url, options = {}) => {
  const token = localStorage.getItem('adminToken')
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  }
  
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  }
  
  return fetch(url, mergedOptions)
}

export default config