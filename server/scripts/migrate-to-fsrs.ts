/**
 * SM-2 to FSRS-6 Migration Script
 *
 * 這個腳本會將所有使用 SM-2 算法的卡片遷移到 FSRS-6
 *
 * 使用方式:
 * ```bash
 * ts-node server/scripts/migrate-to-fsrs.ts
 * ```
 *
 * 或者如果已編譯:
 * ```bash
 * node dist/scripts/migrate-to-fsrs.js
 * ```
 */

import mongoose from 'mongoose';
import Card from '../model/Card';
import Deck from '../model/Deck';

// MongoDB 連接字串
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rabbir-vocab';

/**
 * 從 SM-2 的 easeFactor 估算 FSRS 的 difficulty
 *
 * easeFactor 範圍: 1.3 - 2.5+
 * difficulty 範圍: 1 - 10
 *
 * 映射邏輯:
 * - easeFactor 2.5 → difficulty 5 (中等)
 * - easeFactor 1.3 → difficulty 9 (困難)
 * - easeFactor 3.0+ → difficulty 2 (簡單)
 */
function convertEaseFactorToDifficulty(easeFactor: number): number {
  // difficulty = 11 - (easeFactor - 1.3) * 6
  const difficulty = 11 - (easeFactor - 1.3) * 6;

  // 限制在 [1, 10] 範圍內
  return Math.max(1, Math.min(10, difficulty));
}

/**
 * 從 SM-2 的 interval 估算 FSRS 的 stability
 *
 * 在 SM-2 中，interval 表示間隔天數
 * 在 FSRS 中，stability 也表示穩定度（天數）
 *
 * 可以直接使用 interval 作為初始 stability
 */
function convertIntervalToStability(interval: number): number {
  // 直接使用 interval，但確保至少為 0.1
  return Math.max(0.1, interval);
}

/**
 * 遷移單張卡片
 */
async function migrateCard(card: any): Promise<boolean> {
  // 檢查是否已經是 FSRS 格式
  if (card.srs.stability !== undefined && card.srs.difficulty !== undefined) {
    console.log(`  ✓ 卡片 ${card._id} 已經是 FSRS 格式，跳過`);
    return false;
  }

  // 檢查是否有舊的 SM-2 欄位
  if (card.srs.easeFactor === undefined || card.srs.interval === undefined) {
    console.log(`  ⚠ 卡片 ${card._id} 缺少 SM-2 欄位，跳過`);
    return false;
  }

  // 轉換為 FSRS 狀態
  const stability = convertIntervalToStability(card.srs.interval);
  const difficulty = convertEaseFactorToDifficulty(card.srs.easeFactor);

  // 更新卡片
  card.srs.stability = stability;
  card.srs.difficulty = difficulty;

  // 移除舊的 SM-2 欄位（可選，保留可能有助於回滾）
  // delete card.srs.easeFactor;
  // delete card.srs.interval;
  // delete card.srs.repetitions;

  // 保留 learningStep 和 lapseCount（FSRS 也使用）
  // 如果 learningStep 不存在，設為 -1（已畢業）
  if (card.srs.learningStep === undefined) {
    card.srs.learningStep = -1;
  }

  // 如果 lapseCount 不存在，設為 0
  if (card.srs.lapseCount === undefined) {
    card.srs.lapseCount = 0;
  }

  await card.save();

  console.log(`  ✓ 成功遷移卡片 ${card._id}`);
  console.log(`    - easeFactor ${card.srs.easeFactor} → difficulty ${difficulty.toFixed(2)}`);
  console.log(`    - interval ${card.srs.interval} → stability ${stability.toFixed(2)}`);

  return true;
}

/**
 * 遷移所有卡片
 */
async function migrateAllCards(): Promise<void> {
  console.log('\n📊 開始遷移所有卡片到 FSRS-6...\n');

  try {
    // 獲取所有卡片
    const cards = await Card.find({ isDeleted: false });

    console.log(`找到 ${cards.length} 張卡片\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // 遷移每張卡片
    for (const card of cards) {
      try {
        const migrated = await migrateCard(card);
        if (migrated) {
          migratedCount++;
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.error(`  ✗ 遷移卡片 ${card._id} 失敗:`, error);
        errorCount++;
      }
    }

    console.log('\n📊 遷移完成！');
    console.log(`  - 成功遷移: ${migratedCount} 張`);
    console.log(`  - 跳過: ${skippedCount} 張`);
    console.log(`  - 錯誤: ${errorCount} 張\n`);
  } catch (error) {
    console.error('\n❌ 遷移過程中發生錯誤:', error);
    throw error;
  }
}

/**
 * 更新所有 Deck 的 SRS 配置
 * 將舊的 SM-2 配置轉換為 FSRS-6 配置
 */
async function migrateDeckConfigs(): Promise<void> {
  console.log('\n📊 更新 Deck 配置...\n');

  try {
    const decks = await Deck.find({ isDeleted: false });

    console.log(`找到 ${decks.length} 個卡組\n`);

    let updatedCount = 0;

    for (const deck of decks) {
      // 檢查是否已經有 FSRS 配置
      if (deck.settings.srsConfig?.weights) {
        console.log(`  ✓ 卡組 "${deck.name}" 已經有 FSRS 配置，跳過`);
        continue;
      }

      // 使用預設的 FSRS-6 配置
      deck.settings.srsConfig = {
        weights: [
          0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49,
          0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61,
          0.0, 0.0  // FSRS-6 新增的參數
        ],
        desiredRetention: 0.9,
        learningSteps: [1, 10],
        relearningSteps: [10],
        maximumInterval: 36500,
        leechThreshold: 8,
      };

      await deck.save();

      console.log(`  ✓ 成功更新卡組 "${deck.name}"`);
      updatedCount++;
    }

    console.log(`\n📊 更新完成！共更新 ${updatedCount} 個卡組\n`);
  } catch (error) {
    console.error('\n❌ 更新 Deck 配置時發生錯誤:', error);
    throw error;
  }
}

/**
 * 主函數
 */
async function main() {
  console.log('\n🚀 SM-2 to FSRS-6 遷移工具\n');
  console.log('⚠️  警告: 請在遷移前備份資料庫！\n');

  try {
    // 連接資料庫
    console.log(`📡 連接到 MongoDB: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    console.log('✓ 資料庫連接成功\n');

    // 遷移 Deck 配置
    await migrateDeckConfigs();

    // 遷移卡片
    await migrateAllCards();

    console.log('✅ 所有遷移完成！\n');
  } catch (error) {
    console.error('\n❌ 遷移失敗:', error);
    process.exit(1);
  } finally {
    // 關閉資料庫連接
    await mongoose.connection.close();
    console.log('📡 資料庫連接已關閉');
  }
}

// 執行遷移
main();
