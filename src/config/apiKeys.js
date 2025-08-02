// API Keys configuration
// These should be set via environment variables

export const apiKeys = {
  openai: import.meta.env.VITE_OPENAI_API_KEY || '',
  anthropic: import.meta.env.VITE_ANTHROPIC_API_KEY || ''
}

// Check if at least one API key is configured
export const hasApiKeys = () => {
  return apiKeys.openai || apiKeys.anthropic
}

// Get available AI providers based on API keys
export const getAvailableProviders = () => {
  const providers = []
  if (apiKeys.openai) providers.push({ id: 'openai', name: 'OpenAI GPT' })
  if (apiKeys.anthropic) providers.push({ id: 'anthropic', name: 'Anthropic Claude' })
  return providers
}