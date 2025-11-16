# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

RabbirVocab 是一個使用 Vue 3 + TypeScript 開發的詞彙學習應用,採用間隔重複系統 (SRS) 演算法來優化學習效果。

**技術棧**: Vue 3 (Composition API), TypeScript, Vite, Pinia, Vue Router, Tailwind CSS v4, Mongoose, bcryptjs

## 常用開發指令

### 依賴安裝
```bash
yarn
```

### 開發環境
```bash
yarn dev  # 啟動開發伺服器 (http://localhost:5173)
```

### 建置與類型檢查
```bash
yarn build       # 類型檢查 + 建置生產版本
yarn build-only  # 僅建置 (不進行類型檢查)
yarn type-check  # 僅類型檢查
yarn preview     # 預覽生產建置
```

### 測試
```bash
# 單元測試 (Vitest)
yarn test:unit

# E2E 測試 (Playwright)
npx playwright install  # 首次執行需安裝瀏覽器
yarn test:e2e
yarn test:e2e --project=chromium  # 僅在 Chromium 執行
yarn test:e2e e2e/example.spec.ts # 執行特定測試檔案
yarn test:e2e --debug             # Debug 模式
```

### 代碼品質
```bash
yarn lint    # ESLint 檢查並自動修復
yarn format  # Prettier 格式化 src/ 目錄
```

## 專案架構

### 目錄結構
- `/src/components` - 可重用的 Vue 元件
- `/src/views` - 路由頁面元件
- `/src/stores` - Pinia 狀態管理 stores (使用 Composition API 風格)
- `/src/router` - Vue Router 路由配置
- `/src/assets` - 靜態資源 (CSS, 圖片等)
- `/e2e` - Playwright E2E 測試

### 關鍵配置
- **路徑別名**: `@` 指向 `/src` 目錄 (在 [vite.config.ts:18-20](vite.config.ts#L18-L20) 配置)
- **狀態管理**: 使用 Pinia Composition API 風格 (參考 [src/stores/counter.ts](src/stores/counter.ts))
- **路由**: Vue Router 使用 HTML5 History 模式,支援 lazy loading

## Tailwind CSS 樣式系統

本專案使用 Tailwind CSS v4 搭配自定義設計系統,詳細說明請參閱 [STYLING_GUIDE.md](STYLING_GUIDE.md)。

### 核心要點
- **暗色模式**: 使用 `class` 策略,通過 `dark:` 前綴應用暗色樣式
- **主色系**: 綠色 (`primary-*`) 代表成長與學習
- **輔助色**: 藍色 (`secondary-*`) 代表知識與專業
- **自定義元件類別**: 預定義的 `.btn`, `.card`, `.study-card`, `.badge` 等類別
- **動畫**: 支援 `animate-fade-in`, `animate-slide-up`, `animate-slide-down` 等動畫

### 樣式開發建議
- 新增元件時,優先參考 STYLING_GUIDE.md 中的範例和預設類別
- 保持設計系統一致性,使用預定義的顏色和間距
- 需要暗色模式支援時,確保加上 `dark:` 變體

## 數據模型架構

根據最近的 commit 歷史,資料模型結構如下:

- **Deck (單字卡組)**: 包含 SRS 演算法配置,已移除封面圖片屬性
- **User (使用者)**: 擁有者屬性已統一為 `user`,學習設定已移至 Deck 層級管理

### 關聯設計原則
- 使用 `user` 而非 `owner` 來表示擁有者關係
- SRS 演算法配置存儲在 Deck 層級,允許每個卡組有獨立的學習設定

## 測試策略

### 單元測試
- 使用 Vitest + jsdom 環境
- 元件測試範例位於 [src/components/__tests__/](src/components/__tests__/)
- 測試檔案命名: `*.spec.ts`

### E2E 測試
- 使用 Playwright 測試三大瀏覽器引擎 (Chromium, Firefox, WebKit)
- 開發環境使用 `localhost:5173`,CI 環境使用 `localhost:4173`
- 測試會自動啟動開發伺服器,無需手動啟動

## Node 版本要求

- Node.js 版本: `^20.19.0` 或 `>=22.12.0`
- 建議使用 yarn 作為套件管理器
