import React from 'react'

export default function TestEnvPage() {
  const supabaseUrl = (typeof process !== 'undefined' && process.env?.REACT_APP_SUPABASE_URL) || 
                      import.meta.env?.VITE_SUPABASE_URL || 
                      'NOT SET'
  const supabaseAnonKey = (typeof process !== 'undefined' && process.env?.REACT_APP_SUPABASE_ANON_KEY) || 
                          import.meta.env?.VITE_SUPABASE_ANON_KEY || 
                          'NOT SET'

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Test</h1>
      <div className="space-y-2">
        <p>REACT_APP_SUPABASE_URL: <code className="bg-gray-100 px-2 py-1 rounded">{supabaseUrl}</code></p>
        <p>REACT_APP_SUPABASE_ANON_KEY: <code className="bg-gray-100 px-2 py-1 rounded">{supabaseAnonKey === 'NOT SET' ? 'NOT SET' : 'SET (hidden)'}</code></p>
        <p>NODE_ENV: <code className="bg-gray-100 px-2 py-1 rounded">{process.env.NODE_ENV || 'NOT SET'}</code></p>
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Instructions if NOT SET:</h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>Go to Netlify Dashboard</li>
          <li>Navigate to Site Configuration → Environment Variables</li>
          <li>Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY</li>
          <li>Redeploy the site</li>
        </ol>
      </div>
    </div>
  )
}