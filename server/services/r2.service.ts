import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'
import { InternalServerError } from '../utils/errors.js'

// 延遲初始化 R2 客戶端
let s3Client: S3Client | null = null

/**
 * 獲取 R2 客戶端（延遲初始化）
 */
function getR2Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.R2_REGION || 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })
  }
  return s3Client
}

/**
 * 驗證 R2 配置環境變數
 */
export function validateR2Config(): void {
  const required = [
    'R2_REGION',
    'R2_ENDPOINT',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET',
    'R2_PUBLIC_URL',
  ]

  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    throw new Error(`Missing R2 environment variables: ${missing.join(', ')}`)
  }
}

/**
 * 上傳圖片到 R2
 * @param buffer - 圖片數據
 * @param key - 存儲路徑（例如: cards/userId/cardId/image.jpg）
 * @param contentType - 圖片類型（例如: image/jpeg）
 * @returns 圖片的公開 URL
 */
export async function uploadImage(
  buffer: Buffer,
  key: string,
  contentType: string = 'image/jpeg',
): Promise<string> {
  try {
    const r2 = getR2Client()
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })

    await r2.send(command)
    return getPublicUrl(key)
  } catch (error) {
    console.error('R2 圖片上傳失敗:', error)
    throw new InternalServerError('圖片上傳失敗')
  }
}

/**
 * 上傳音頻到 R2
 * @param buffer - 音頻數據
 * @param key - 存儲路徑（例如: cards/userId/cardId/audio.mp3）
 * @param contentType - 音頻類型（例如: audio/mpeg）
 * @returns 音頻的公開 URL
 */
export async function uploadAudio(
  buffer: Buffer,
  key: string,
  contentType: string = 'audio/mpeg',
): Promise<string> {
  try {
    const r2 = getR2Client()
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })

    await r2.send(command)
    return getPublicUrl(key)
  } catch (error) {
    console.error('R2 音頻上傳失敗:', error)
    throw new InternalServerError('音頻上傳失敗')
  }
}

/**
 * 刪除圖片
 * @param key - 圖片路徑
 */
export async function deleteImage(key: string): Promise<void> {
  try {
    const r2 = getR2Client()
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
    })

    await r2.send(command)
  } catch (error) {
    console.error('R2 圖片刪除失敗:', error)
    // 不拋出錯誤，允許繼續執行
  }
}

/**
 * 刪除音頻
 * @param key - 音頻路徑
 */
export async function deleteAudio(key: string): Promise<void> {
  try {
    const r2 = getR2Client()
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
    })

    await r2.send(command)
  } catch (error) {
    console.error('R2 音頻刪除失敗:', error)
    // 不拋出錯誤，允許繼續執行
  }
}

/**
 * 檢查圖片是否存在
 * @param key - 圖片路徑
 * @returns 圖片是否存在
 */
export async function imageExists(key: string): Promise<boolean> {
  try {
    const r2 = getR2Client()
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
    })

    await r2.send(command)
    return true
  } catch (error: unknown) {
    if (error instanceof Error && 'name' in error && error.name === 'NoSuchKey') {
      return false
    }
    throw error
  }
}

/**
 * 檢查音頻是否存在
 * @param key - 音頻路徑
 * @returns 音頻是否存在
 */
export async function audioExists(key: string): Promise<boolean> {
  try {
    const r2 = getR2Client()
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
    })

    await r2.send(command)
    return true
  } catch (error: unknown) {
    if (error instanceof Error && 'name' in error && error.name === 'NoSuchKey') {
      return false
    }
    throw error
  }
}

/**
 * 列出指定資料夾下的所有文件
 * @param prefix - 資料夾路徑（例如: cards/userId/）
 * @returns 文件路徑列表
 */
export async function listFiles(prefix: string): Promise<string[]> {
  try {
    const r2 = getR2Client()
    const command = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET!,
      Prefix: prefix,
    })

    const response = await r2.send(command)
    return response.Contents?.map((item) => item.Key!) || []
  } catch (error) {
    console.error('R2 列表查詢失敗:', error)
    throw new InternalServerError('文件列表查詢失敗')
  }
}

/**
 * 批量刪除指定前綴的所有文件
 * @param prefix - 資料夾路徑（例如: cards/userId/）
 */
export async function deleteByPrefix(prefix: string): Promise<void> {
  try {
    const files = await listFiles(prefix)

    const deletePromises = files.map((key) =>
      deleteImage(key).catch((error) => {
        console.error(`刪除文件失敗: ${key}`, error)
      }),
    )

    await Promise.allSettled(deletePromises)
  } catch (error) {
    console.error('R2 批量刪除失敗:', error)
    // 不拋出錯誤，允許繼續執行
  }
}

/**
 * 獲取文件的公開 URL
 * @param key - 文件路徑
 * @returns 文件的公開 URL
 */
export function getPublicUrl(key: string): string {
  const publicUrl = process.env.R2_PUBLIC_URL

  if (!publicUrl) {
    throw new Error('R2_PUBLIC_URL environment variable is not set')
  }

  const baseUrl = publicUrl.endsWith('/') ? publicUrl : `${publicUrl}/`
  return `${baseUrl}${key}`
}
