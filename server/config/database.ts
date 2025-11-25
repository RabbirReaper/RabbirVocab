import mongoose from 'mongoose'

/**
 * 連接到 MongoDB 資料庫
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rabbirvocab'

    const options = {
      // 連接選項
      maxPoolSize: 10, // 最大連接池大小
      minPoolSize: 2, // 最小連接池大小
      serverSelectionTimeoutMS: 5000, // 伺服器選擇超時
      socketTimeoutMS: 45000, // Socket 超時
    }

    await mongoose.connect(mongoUri, options)

    console.log(`✅ MongoDB 已連接: ${mongoose.connection.host}`)

    // 監聽連接事件
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB 連接錯誤:', err)
    })

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB 已斷開連接')
    })

    // 優雅關閉
    process.on('SIGINT', async () => {
      await mongoose.connection.close()
      console.log('MongoDB 連接已關閉（程序終止）')
      process.exit(0)
    })
  } catch (error) {
    console.error('❌ MongoDB 連接失敗:', error)
    process.exit(1)
  }
}
