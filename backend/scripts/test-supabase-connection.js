import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import https from 'https'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') })

console.log('Testing Supabase connection...\n')
console.log('SUPABASE_URL:', process.env.SUPABASE_URL)
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set (hidden)' : 'Not set')
console.log('\n')

// Test basic connectivity to Supabase
const testUrl = new URL(process.env.SUPABASE_URL)
https.get(testUrl.href, (res) => {
  console.log(`✅ HTTPS connection successful: Status ${res.statusCode}`)
}).on('error', (err) => {
  console.error('❌ HTTPS connection failed:', err.message)
})

// Test Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testConnection() {
  try {
    // Test basic query
    console.log('\nTesting Supabase client...')
    const { data, error } = await supabase
      .from('api_keys')
      .select('count')
      .limit(1)
    
    if (error) {
      console.log('❌ Supabase query failed:', error.message)
      console.log('Error details:', error)
    } else {
      console.log('✅ Supabase connection successful!')
      
      // Check table structure
      const { data: tableData, error: tableError } = await supabase
        .from('api_keys')
        .select('*')
        .limit(1)
      
      if (!tableError) {
        console.log('\nTable structure check:')
        if (tableData && tableData.length > 0) {
          console.log('Columns:', Object.keys(tableData[0]))
        } else {
          console.log('Table is empty but accessible')
          
          // Get table schema
          const { data: schema, error: schemaError } = await supabase
            .rpc('get_table_columns', { table_name: 'api_keys' })
            .catch(() => ({ data: null, error: 'RPC not available' }))
          
          if (schema) {
            console.log('Table schema:', schema)
          }
        }
      }
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

testConnection()