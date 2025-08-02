// Unified configuration file
// Force deployment update - 2025-08-02
const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

// API Configuration
// Vite 환경 변수 우선, 없으면 기본값 사용
const API_URL = import.meta.env?.VITE_API_URL || (isProduction 
  ? 'https://edutext-pro-backend.onrender.com' 
  : 'http://localhost:3001')

// Supabase Configuration
const SUPABASE_URL = 'https://xrjrddwrsasjifhghzfl.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyanJkZHdyc2FzamlmaGdoemZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTg1NTIsImV4cCI6MjA2Nzk5NDU1Mn0.pAqrS-9NYXiUZ1lONXlDm8YK-c3zhZj2VIix0_Q36rw'

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