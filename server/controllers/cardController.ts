import { Request, Response } from 'express'
import mongoose from 'mongoose'
import mime from 'mime-types'
import Card from '../model/Card.js'
import Deck from '../model/Deck.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ValidationError, NotFoundError, ForbiddenError, InternalServerError } from '../utils/errors.js'
import * as r2Service from '../services/r2.service.js'
import type { ISRSConfig } from '../model/types.js'

// 定義 Card 創建時的數據類型
interface CardDataInput {
  deck: string
  front: string
  back: {
    content: string
    image?: {
      url: string
      key: string
      alt: string
    }
  }
  audio?: {
    url: string
    key: string
  }
  tags: string[]
  user: string
}

/**
 * @desc    創建新的 Card（支持文件上傳）
 * @route   POST /api/cards
 * @access  Private
 */
export const createCard = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId

  if (!userId) {
    throw new ForbiddenError('未登入')
  }

  // 獲取上傳的文件
  const files = req.files as {
    image?: Express.Multer.File[]
    audio?: Express.Multer.File[]
  }

  // 解析文本字段（注意：back 可能是 JSON 字符串）
  const { deck: deckId, front, back, tags } = req.body
  const backContent = typeof back === 'string' ? JSON.parse(back) : back

  // 驗證必填欄位
  if (!deckId) {
    throw new ValidationError('必須指定所屬的卡組')
  }

  if (!front || front.trim() === '') {
    throw new ValidationError('正面內容為必填項目')
  }

  if (!backContent?.content || backContent.content.trim() === '') {
    throw new ValidationError('背面內容為必填項目')
  }

  // 檢查 Deck 是否存在且用戶有權限
  const deck = await Deck.findOne({
    _id: deckId,
    isDeleted: false,
  })

  if (!deck) {
    throw new NotFoundError('找不到指定的卡組')
  }

  if (deck.user.toString() !== userId) {
    throw new ForbiddenError('您沒有權限在此卡組中創建字卡')
  }

  // 準備卡片數據
  const cardData: CardDataInput = {
    deck: deckId,
    front: front.trim(),
    back: {
      content: backContent.content.trim(),
    },
    tags: tags || [],
    user: userId,
  }

  // 生成唯一 ID 用於文件命名
  const uniqueId = new mongoose.Types.ObjectId().toString()

  // 處理圖片上傳
  if (files?.image?.[0]) {
    const imageFile = files.image[0]
    const ext = mime.extension(imageFile.mimetype) || 'jpg'
    const key = `cards/${userId}/${uniqueId}/image.${ext}`

    try {
      const url = await r2Service.uploadImage(imageFile.buffer, key, imageFile.mimetype)
      cardData.back.image = {
        url,
        key,
        alt: imageFile.originalname,
      }
    } catch (error) {
      console.error('圖片上傳失敗:', error)
      throw new InternalServerError('圖片上傳失敗')
    }
  }

  // 處理音頻上傳
  if (files?.audio?.[0]) {
    const audioFile = files.audio[0]
    const ext = mime.extension(audioFile.mimetype) || 'mp3'
    const key = `cards/${userId}/${uniqueId}/audio.${ext}`

    try {
      const url = await r2Service.uploadAudio(audioFile.buffer, key, audioFile.mimetype)
      cardData.audio = {
        url,
        key,
      }
    } catch (error) {
      console.error('音頻上傳失敗:', error)
      // 如果已上傳圖片，需要清理
      if (cardData.back.image?.key) {
        await r2Service.deleteImage(cardData.back.image.key).catch(console.error)
      }
      throw new InternalServerError('音頻上傳失敗')
    }
  }

  // 創建卡片
  const card = await Card.create(cardData)

  res.status(201).json({
    message: 'success',
    data: {
      card,
    },
  })
})

/**
 * @desc    獲取指定 Deck 的所有 Cards
 * @route   GET /api/cards?deck=deckId
 * @access  Private
 */
export const getCards = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId

  if (!userId) {
    throw new ForbiddenError('未登入')
  }

  const { deck: deckId } = req.query

  if (!deckId || typeof deckId !== 'string') {
    throw new ValidationError('必須指定卡組 ID')
  }

  // 檢查 Deck 是否存在且用戶有權限
  const deck = await Deck.findOne({
    _id: deckId,
    isDeleted: false,
  })

  if (!deck) {
    throw new NotFoundError('找不到指定的卡組')
  }

  // 檢查權限：只有擁有者或公開的卡組可以查看
  if (deck.user.toString() !== userId && !deck.settings?.isPublic) {
    throw new ForbiddenError('您沒有權限查看此卡組的字卡')
  }

  // 獲取未刪除的 Cards
  const cards = await Card.find({
    deck: deckId,
    isDeleted: false,
  })
    .populate('tags')
    .sort({ createdAt: -1 })

  res.status(200).json({
    message: 'success',
    data: {
      cards,
      count: cards.length,
    },
  })
})

/**
 * @desc    獲取指定 Deck 的所有 Cards (使用路由參數)
 * @route   GET /api/cards/deck/:deckId
 * @access  Private
 */
export const getAllCardsInDeck = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId

  if (!userId) {
    throw new ForbiddenError('未登入')
  }

  const { deckId } = req.params

  if (!deckId) {
    throw new ValidationError('必須指定卡組 ID')
  }

  // 檢查 Deck 是否存在且用戶有權限
  const deck = await Deck.findOne({
    _id: deckId,
    isDeleted: false,
  })

  if (!deck) {
    throw new NotFoundError('找不到指定的卡組')
  }

  // 檢查權限：只有擁有者或公開的卡組可以查看
  if (deck.user.toString() !== userId && !deck.settings?.isPublic) {
    throw new ForbiddenError('您沒有權限查看此卡組的字卡')
  }

  // 獲取未刪除的 Cards
  const cards = await Card.find({
    deck: deckId,
    isDeleted: false,
  }).sort({ createdAt: -1 })

  res.status(200).json({
    message: 'success',
    data: {
      cards,
      count: cards.length,
    },
  })
})

/**
 * @desc    獲取單個 Card
 * @route   GET /api/cards/:cardId
 * @access  Private
 */
export const getCard = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId

  if (!userId) {
    throw new ForbiddenError('未登入')
  }

  const { cardId } = req.params

  const card = await Card.findOne({
    _id: cardId,
    isDeleted: false,
  }).populate('tags')

  if (!card) {
    throw new NotFoundError('找不到此字卡')
  }

  // 檢查權限：透過 Deck 的擁有者來確認
  const deck = await Deck.findById(card.deck)

  if (!deck) {
    throw new NotFoundError('找不到此字卡所屬的卡組')
  }

  if (deck.user.toString() !== userId && !deck.settings?.isPublic) {
    throw new ForbiddenError('您沒有權限查看此字卡')
  }

  res.status(200).json({
    message: 'success',
    data: {
      card,
    },
  })
})

/**
 * @desc    更新 Card（完整替換，支持文件更新）
 * @route   PUT /api/cards/:cardId
 * @access  Private
 */
export const updateCard = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId

  if (!userId) {
    throw new ForbiddenError('未登入')
  }

  const { cardId } = req.params

  // 獲取上傳的文件
  const files = req.files as {
    image?: Express.Multer.File[]
    audio?: Express.Multer.File[]
  }

  // 解析文本字段
  const { front, back, tags } = req.body
  const backContent = typeof back === 'string' ? JSON.parse(back) : back

  const card = await Card.findOne({
    _id: cardId,
    isDeleted: false,
  })

  if (!card) {
    throw new NotFoundError('找不到此字卡')
  }

  // 檢查權限：只有擁有者可以更新
  if (card.user.toString() !== userId) {
    throw new ForbiddenError('您沒有權限更新此字卡')
  }

  // PUT 語義：驗證所有必填欄位
  if (!front || front.trim() === '') {
    throw new ValidationError('正面內容為必填項目')
  }

  if (!backContent?.content || backContent.content.trim() === '') {
    throw new ValidationError('背面內容為必填項目')
  }

  // 更新文本字段
  card.front = front.trim()
  card.back.content = backContent.content.trim()
  card.tags = tags || []

  // 處理圖片更新
  if (files?.image?.[0]) {
    // 刪除舊圖片
    if (card.back.image?.key) {
      await r2Service.deleteImage(card.back.image.key).catch(console.error)
    }

    // 上傳新圖片
    const imageFile = files.image[0]
    const ext = mime.extension(imageFile.mimetype) || 'jpg'
    const key = `cards/${userId}/${cardId}/image.${ext}`

    try {
      const url = await r2Service.uploadImage(imageFile.buffer, key, imageFile.mimetype)
      card.back.image = {
        url,
        key,
        alt: imageFile.originalname,
      }
    } catch (error) {
      console.error('圖片上傳失敗:', error)
      throw new InternalServerError('圖片上傳失敗')
    }
  }

  // 處理音頻更新
  if (files?.audio?.[0]) {
    // 刪除舊音頻
    if (card.audio?.key) {
      await r2Service.deleteAudio(card.audio.key).catch(console.error)
    }

    // 上傳新音頻
    const audioFile = files.audio[0]
    const ext = mime.extension(audioFile.mimetype) || 'mp3'
    const key = `cards/${userId}/${cardId}/audio.${ext}`

    try {
      const url = await r2Service.uploadAudio(audioFile.buffer, key, audioFile.mimetype)
      card.audio = {
        url,
        key,
      }
    } catch (error) {
      console.error('音頻上傳失敗:', error)
      throw new InternalServerError('音頻上傳失敗')
    }
  }

  await card.save()

  res.status(200).json({
    message: 'success',
    data: {
      card,
    },
  })
})

/**
 * @desc    刪除 Card（軟刪除，同時刪除 R2 文件）
 * @route   DELETE /api/cards/:cardId
 * @access  Private
 */
export const deleteCard = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId

  if (!userId) {
    throw new ForbiddenError('未登入')
  }

  const { cardId } = req.params

  const card = await Card.findOne({
    _id: cardId,
    isDeleted: false,
  })

  if (!card) {
    throw new NotFoundError('找不到此字卡')
  }

  // 檢查權限：只有擁有者可以刪除
  if (card.user.toString() !== userId) {
    throw new ForbiddenError('您沒有權限刪除此字卡')
  }

  // 並行刪除 R2 文件
  const deletePromises: Promise<void>[] = []

  if (card.back.image?.key) {
    deletePromises.push(r2Service.deleteImage(card.back.image.key))
  }

  if (card.audio?.key) {
    deletePromises.push(r2Service.deleteAudio(card.audio.key))
  }

  // 使用 Promise.allSettled 忽略 R2 刪除失敗
  await Promise.allSettled(deletePromises)

  // 繼續軟刪除
  card.isDeleted = true
  await card.save()

  res.status(200).json({
    message: 'success',
    data: {
      card,
    },
  })
})

/**
 * @desc    複習 Card（根據 Deck 的 SRS 設定計算下次複習時間）
 * @route   POST /api/cards/:cardId/review
 * @access  Private
 */
export const reviewCard = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId

  if (!userId) {
    throw new ForbiddenError('未登入')
  }

  const { cardId } = req.params
  const { quality, duration = 0 } = req.body

  // 驗證 quality 參數
  if (quality === undefined || quality === null) {
    throw new ValidationError('必須提供複習品質評等 (quality)')
  }

  if (typeof quality !== 'number' || quality < 0 || quality > 3) {
    throw new ValidationError('複習品質評等必須是 0-3 之間的數字')
  }

  // 獲取卡片
  const card = await Card.findOne({
    _id: cardId,
    isDeleted: false,
  })

  if (!card) {
    throw new NotFoundError('找不到此字卡')
  }

  // 檢查權限：只有擁有者可以複習
  if (card.user.toString() !== userId) {
    throw new ForbiddenError('您沒有權限複習此字卡')
  }

  // 獲取所屬 Deck 的 SRS 配置
  const deck = await Deck.findOne({
    _id: card.deck,
    isDeleted: false,
  })

  if (!deck) {
    throw new NotFoundError('找不到此字卡所屬的卡組')
  }

  // 使用 Deck 的 SRS 配置計算下次複習時間
  const srsConfig = deck.settings.srsConfig as Required<ISRSConfig>

  // 調用 Card model 的 calculateNextReview 方法
  card.calculateNextReview(quality, srsConfig, duration)

  // 保存更新後的卡片
  await card.save()

  res.status(200).json({
    message: 'success',
    data: {
      card,
    },
  })
})
