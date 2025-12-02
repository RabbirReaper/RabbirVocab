import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// ES Module 環境下獲取 __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 載入環境變數 (明確指定 .env 路徑)
const envPath = path.resolve(__dirname, '..', '.env')
dotenv.config({ path: envPath })

// 驗證環境變數載入
console.log('📝 Environment variables loaded:')
console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? '✓ Set' : '✗ Not set'}`)
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`)
console.log(`   PORT: ${process.env.PORT || 8080}`)

// 在載入環境變數後才 import app
import('./app.js').then(({ startServer }) => {
  startServer()
})
