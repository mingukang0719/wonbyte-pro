import crypto from 'crypto'

// 암호화 키 생성 헬퍼
export function generateEncryptionKeys() {
  return {
    sessionSecret: crypto.randomBytes(32).toString('hex'),
    encryptionKey: crypto.randomBytes(32).toString('hex'),
    fieldEncryptionKey: crypto.randomBytes(32).toString('hex'),
    masterKey: crypto.randomBytes(32).toString('hex')
  }
}

// 사용법:
// node -e "import('./utils/encryption.js').then(m => console.log(m.generateEncryptionKeys()))"

class APIKeyManager {
  constructor() {
    this.algorithm = 'aes-256-gcm'
    this.secretKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex')
  }
  
  encrypt(apiKey) {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this.secretKey, 'hex'), iv)
    
    let encrypted = cipher.update(apiKey, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    return {
      encrypted: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    }
  }
  
  decrypt(encryptedData) {
    const decipher = crypto.createDecipheriv(
      this.algorithm, 
      Buffer.from(this.secretKey, 'hex'), 
      Buffer.from(encryptedData.iv, 'hex')
    )
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'))
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }
}

export default APIKeyManager