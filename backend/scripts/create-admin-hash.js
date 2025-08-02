import bcrypt from 'bcryptjs'

const password = 'admin123'
const saltRounds = 10

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err)
    return
  }
  console.log(`Password: ${password}`)
  console.log(`Hash: ${hash}`)
  console.log('\nUse this SQL to update the admin user:')
  console.log(`UPDATE users SET password_hash = '${hash}' WHERE email = 'admin@onbyte.com';`)
})