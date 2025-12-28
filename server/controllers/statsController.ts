import { Request, Response } from 'express'
import { Types } from 'mongoose'
import Deck from '../model/Deck.js'
import Card from '../model/Card.js'
import Review from '../model/Review.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ForbiddenError, NotFoundError } from '../utils/errors.js'

/**
 * @desc    獲取用戶總體統計
 * @route   GET /api/stats/overview
 * @access  Private
 */
export const getOverviewStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId

  if (!userId) {
    throw new ForbiddenError('未登入')
  }

  // 並行查詢，提升效能
  const [totalDecks, totalCards, dueCards, reviewsToday] = await Promise.all([
    Deck.countDocuments({ user: userId, isDeleted: false }),
    Card.countDocuments({ user: userId, isDeleted: false }),
    Card.countDocuments({
      user: userId,
      isDeleted: false,
      'srs.dueDate': { $lte: new Date() },
    }),
    Review.countDocuments({
      user: userId,
      reviewedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }),
  ])

  res.json({
    message: 'success',
    data: {
      totalDecks,
      totalCards,
      dueCards,
      reviewsToday,
    },
  })
})

/**
 * @desc    獲取最近學習記錄
 * @route   GET /api/stats/recent-activity
 * @access  Private
 */
export const getRecentActivity = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId

  if (!userId) {
    throw new ForbiddenError('未登入')
  }

  const days = parseInt(req.query.days as string) || 7

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)

  const endDate = new Date()
  endDate.setHours(23, 59, 59, 999)

  const stats = await Review.getUserStats(new Types.ObjectId(userId), startDate, endDate)

  res.json({
    message: 'success',
    data: {
      stats,
    },
  })
})

/**
 * @desc    獲取 Deck 統計
 * @route   GET /api/stats/deck/:deckId
 * @access  Private
 */
export const getDeckStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId

  if (!userId) {
    throw new ForbiddenError('未登入')
  }

  const { deckId } = req.params

  const deck = await Deck.findOne({
    _id: deckId,
    user: userId,
    isDeleted: false,
  })

  if (!deck) {
    throw new NotFoundError('找不到此卡組')
  }

  // 並行查詢統計
  const [cardCount, totalNewCount, learningCount, reviewCount, masteredCount] = await Promise.all([
    Card.countDocuments({ deck: deckId, isDeleted: false }),
    Card.countDocuments({ deck: deckId, status: 'new', isDeleted: false }),
    // 學習中且已到期的卡片
    Card.countDocuments({
      deck: deckId,
      status: 'learning',
      'srs.dueDate': { $lte: new Date() },
      isDeleted: false,
    }),
    Card.countDocuments({
      deck: deckId,
      status: 'review',
      'srs.dueDate': { $lte: new Date() },
      isDeleted: false,
    }),
    Card.countDocuments({
      deck: deckId,
      'srs.stability': { $gte: 21 },
      isDeleted: false,
    }),
  ])

  // 新卡片數量受每日限制約束
  const newCount = Math.min(totalNewCount, deck.settings.newCardsPerDay)

  res.json({
    message: 'success',
    data: {
      deckId,
      cardCount,
      newCount,
      learningCount,
      reviewCount,
      masteredCount,
    },
  })
})
