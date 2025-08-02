// Local test script
import fetch from 'node-fetch'

const BASE_URL = 'http://localhost:3001'

async function test() {
  console.log('🧪 Testing EduText Pro Backend...\n')

  // 1. Health check
  console.log('1️⃣ Health Check:')
  try {
    const res = await fetch(`${BASE_URL}/api/health`)
    const data = await res.json()
    console.log('   Status:', res.status)
    console.log('   Response:', data)
  } catch (error) {
    console.log('   ❌ Error:', error.message)
  }

  // 2. AI Status
  console.log('\n2️⃣ AI Status:')
  try {
    const res = await fetch(`${BASE_URL}/api/ai/status`)
    const data = await res.json()
    console.log('   Status:', res.status)
    console.log('   Response:', data)
  } catch (error) {
    console.log('   ❌ Error:', error.message)
  }

  // 3. Generate Content
  console.log('\n3️⃣ Generate Content:')
  try {
    const res = await fetch(`${BASE_URL}/api/ai/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: '전주 비빔밥',
        contentType: 'reading',
        targetAge: 10,
        contentLength: 300
      })
    })
    const data = await res.json()
    console.log('   Status:', res.status)
    console.log('   Success:', data.success)
    if (data.content) {
      console.log('   Content preview:', data.content.substring(0, 100) + '...')
    } else {
      console.log('   Error:', data.error)
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message)
  }

  console.log('\n✅ Test complete!')
}

test().catch(console.error)