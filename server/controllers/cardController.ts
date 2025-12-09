import { Request, Response } from 'express'
import Card from '../model/Card.js'
import Deck from '../model/Deck.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ValidationError, NotFoundError, ForbiddenError } from '../utils/errors.js'

/**
 * @desc    創建新的 Card
 * @route   POST /api/cards
 * @access  Private
 */
export const createCard = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId

  if (!userId) {
    throw new ForbiddenError('未登入')
  }

  const { deck: deckId, front, back, audio, tags } = req.body

  // 驗證必填欄位
  if (!deckId) {
    throw new ValidationError('必須指定所屬的卡組')
  }

  if (!front || front.trim() === '') {
    throw new ValidationError('正面內容為必填項目')
  }

  if (!back?.content || back.content.trim() === '') {
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

  // 創建新的 Card
  const card = await Card.create({
    deck: deckId,
    front: front.trim(),
    back: {
      image: back.image || {},
      content: back.content.trim(),
    },
    audio: audio || {},
    tags: tags || [],
    user: userId,
  })

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
 * @desc    更新 Card（完整替換）
 * @route   PUT /api/cards/:cardId
 * @access  Private
 */
export const updateCard = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId

  if (!userId) {
    throw new ForbiddenError('未登入')
  }

  const { cardId } = req.params
  const { front, back, audio, tags } = req.body

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

  if (!back?.content || back.content.trim() === '') {
    throw new ValidationError('背面內容為必填項目')
  }

  // 完整替換所有欄位
  card.front = front.trim()
  card.back = {
    image: back.image || {},
    content: back.content.trim(),
  }
  card.audio = audio || {}
  card.tags = tags || []

  await card.save()

  res.status(200).json({
    message: 'success',
    data: {
      card,
    },
  })
})

/**
 * @desc    刪除 Card（軟刪除）
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

  // 軟刪除
  card.isDeleted = true
  await card.save()

  res.status(200).json({
    message: 'success',
    data: {
      card,
    },
  })
})
