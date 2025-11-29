import { Request, Response } from 'express'
import Deck from '../model/Deck.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ValidationError, NotFoundError, ForbiddenError } from '../utils/errors.js'

/**
 * @desc    創建新的 Deck
 * @route   POST /api/decks
 * @access  Private
 */
export const createDeck = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId

  if (!userId) {
    throw new ForbiddenError('未登入')
  }

  const { name, description, settings } = req.body

  // 驗證必填欄位
  if (!name || name.trim() === '') {
    throw new ValidationError('卡組名稱為必填項目')
  }

  // 創建新的 Deck
  const deck = await Deck.create({
    name: name.trim(),
    description: description?.trim() || '',
    user: userId,
    settings: settings || {},
  })

  res.status(201).json({
    message: 'success',
    data: {
      deck,
    },
  })
})

/**
 * @desc    獲取當前用戶的所有 Decks
 * @route   GET /api/decks
 * @access  Private
 */
export const getDecks = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId

  if (!userId) {
    throw new ForbiddenError('未登入')
  }

  // 獲取未刪除的 Decks
  const decks = await Deck.find({
    user: userId,
    isDeleted: false,
  }).sort({ createdAt: -1 })

  res.status(200).json({
    message: 'success',
    data: {
      decks,
      count: decks.length,
    },
  })
})

/**
 * @desc    獲取單個 Deck
 * @route   GET /api/decks/:deckId
 * @access  Private
 */
export const getDeck = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId

  if (!userId) {
    throw new ForbiddenError('未登入')
  }

  const { deckId } = req.params

  const deck = await Deck.findOne({
    _id: deckId,
    isDeleted: false,
  })

  if (!deck) {
    throw new NotFoundError('找不到此卡組')
  }

  // 檢查權限：只有擁有者或公開的卡組可以查看
  if (deck.user.toString() !== userId && !deck.settings?.isPublic) {
    throw new ForbiddenError('您沒有權限查看此卡組')
  }

  res.status(200).json({
    message: 'success',
    data: {
      deck,
    },
  })
})

/**
 * @desc    更新 Deck（完整替換）
 * @route   PUT /api/decks/:deckId
 * @access  Private
 */
export const updateDeck = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId

  if (!userId) {
    throw new ForbiddenError('未登入')
  }

  const { deckId } = req.params
  const { name, description, settings } = req.body

  const deck = await Deck.findOne({
    _id: deckId,
    isDeleted: false,
  })

  if (!deck) {
    throw new NotFoundError('找不到此卡組')
  }

  // 檢查權限：只有擁有者可以更新
  if (deck.user.toString() !== userId) {
    throw new ForbiddenError('您沒有權限更新此卡組')
  }

  // PUT 語義：驗證所有必填欄位
  if (!name || name.trim() === '') {
    throw new ValidationError('卡組名稱為必填項目')
  }

  // 完整替換所有欄位
  deck.name = name.trim()
  deck.description = description?.trim() || ''
  deck.settings = settings || {}

  await deck.save()

  res.status(200).json({
    message: 'success',
    data: {
      deck,
    },
  })
})

/**
 * @desc    刪除 Deck（軟刪除）
 * @route   DELETE /api/decks/:deckId
 * @access  Private
 */
export const deleteDeck = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId

  if (!userId) {
    throw new ForbiddenError('未登入')
  }

  const { deckId } = req.params

  const deck = await Deck.findOne({
    _id: deckId,
    isDeleted: false,
  })

  if (!deck) {
    throw new NotFoundError('找不到此卡組')
  }

  // 檢查權限：只有擁有者可以刪除
  if (deck.user.toString() !== userId) {
    throw new ForbiddenError('您沒有權限刪除此卡組')
  }

  // 軟刪除
  deck.isDeleted = true
  await deck.save()

  res.status(200).json({
    message: 'success',
    data: {
      deck,
    },
  })
})
