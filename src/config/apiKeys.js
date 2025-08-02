// API Keys configuration
// These should be set via environment variables

// Safely access environment variables
const getEnvVar = (key) => {
  try {
    return import.meta.env?.[key] || ''
  } catch {
    return ''
  }
}

export const apiKeys = {
  openai: getEnvVar('VITE_OPENAI_API_KEY'),
  anthropic: getEnvVar('VITE_ANTHROPIC_API_KEY')
}

// Check if at least one API key is configured
export const hasApiKeys = () => {
  // Always return true since we're using backend API
  return true
}

// Get available AI providers based on API keys
export const getAvailableProviders = () => {
  // Since we're using backend API, all providers are available
  // The backend will handle the actual API keys
  return [
    { id: 'openai', name: 'OpenAI GPT' },
    { id: 'anthropic', name: 'Anthropic Claude' },
    { id: 'gemini', name: 'Google Gemini' }
  ]
}