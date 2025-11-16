# 樣式指南 - RabbirVocab

本專案使用 **Tailwind CSS** 搭配自定義的簡約現代風格設計系統。

## 🎨 設計理念

- **簡約現代風**：適合學習應用，不會分散注意力
- **配色**：柔和的藍綠色系 + 中性灰
- **特點**：大量留白、圓角、柔和陰影
- **靈感來源**：Notion、Linear、Craft

## 📦 已配置的功能

✅ Tailwind CSS v4
✅ 暗色模式支援 (class-based)
✅ 自定義顏色系統
✅ 響應式設計
✅ 動畫效果
✅ 自定義元件類別

## 🎯 顏色系統

### 主色 (Primary) - 溫和的綠色
代表成長與學習
- `primary-50` ~ `primary-950`
- 主色調：`primary-500` (#22c55e)

```vue
<button class="bg-primary-600 text-white hover:bg-primary-700">
  開始學習
</button>
```

### 輔助色 (Secondary) - 藍色
代表知識與專業
- `secondary-50` ~ `secondary-950`
- 主色調：`secondary-500` (#3b82f6)

```vue
<div class="bg-secondary-100 text-secondary-800 dark:bg-secondary-900 dark:text-secondary-200">
  提示訊息
</div>
```

### 中性色 (Gray)
- `gray-50` ~ `gray-950`

### 功能色
- `success`: #22c55e (綠色)
- `warning`: #f59e0b (橙色)
- `error`: #ef4444 (紅色)
- `info`: #3b82f6 (藍色)

## 🧩 預設元件類別

### 按鈕 (Buttons)

```vue
<!-- 主要按鈕 -->
<button class="btn btn-primary">主要按鈕</button>

<!-- 次要按鈕 -->
<button class="btn btn-secondary">次要按鈕</button>

<!-- 外框按鈕 -->
<button class="btn btn-outline">外框按鈕</button>

<!-- 使用 Tailwind 原生類別 -->
<button class="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all">
  自訂按鈕
</button>
```

### 卡片 (Cards)

```vue
<!-- 基本卡片 -->
<div class="card">
  <h3>卡片標題</h3>
  <p>卡片內容</p>
</div>

<!-- 學習卡片（帶懸停效果） -->
<div class="study-card">
  <h3>單字卡片</h3>
  <p>單字內容</p>
</div>
```

### 表單 (Forms)

```vue
<div class="form-group">
  <label class="form-label">使用者名稱</label>
  <input type="text" class="input" placeholder="請輸入使用者名稱" />
  <p class="form-error">此欄位為必填</p>
</div>

<!-- 或使用 Tailwind 原生類別 -->
<input
  type="text"
  class="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 focus:ring-2 focus:ring-primary-500"
/>
```

### 導航 (Navigation)

```vue
<nav>
  <a href="#" class="nav-link">首頁</a>
  <a href="#" class="nav-link active">學習</a>
  <a href="#" class="nav-link">設定</a>
</nav>
```

### 徽章 (Badges)

```vue
<span class="badge badge-primary">新功能</span>
<span class="badge badge-secondary">進階</span>
```

### 通知 (Notifications)

```vue
<!-- 成功通知 -->
<div class="notification notification-success">
  操作成功！
</div>

<!-- 錯誤通知 -->
<div class="notification notification-error">
  發生錯誤，請稍後再試。
</div>

<!-- 資訊通知 -->
<div class="notification notification-info">
  這是一則提示訊息。
</div>
```

### 載入狀態 (Loading)

```vue
<div class="loading">
  <div class="spinner"></div>
</div>
```

### 空狀態 (Empty State)

```vue
<div class="empty-state">
  <div class="empty-state-icon">
    <!-- 圖示 -->
  </div>
  <h3 class="empty-state-title">沒有任何資料</h3>
  <p class="empty-state-description">開始建立你的第一個單字卡吧！</p>
</div>
```

## 🌓 暗色模式

使用 `dark:` 前綴來設定暗色模式樣式：

```vue
<div class="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  自動支援暗色模式
</div>
```

切換暗色模式（在你的 Vue 元件中）：

```vue
<script setup>
const toggleDarkMode = () => {
  document.documentElement.classList.toggle('dark')
}
</script>

<template>
  <button @click="toggleDarkMode" class="btn btn-outline">
    切換暗色模式
  </button>
</template>
```

## 🎭 實用工具類別

### 容器

```vue
<div class="container-custom">
  <!-- 內容會自動居中，並有響應式 padding -->
</div>
```

### 漸變背景

```vue
<!-- 主色漸變 -->
<div class="gradient-primary text-white p-8">
  漸變背景
</div>

<!-- 頁面背景漸變 -->
<div class="gradient-bg min-h-screen">
  頁面內容
</div>
```

### 玻璃擬態效果

```vue
<div class="glass p-6 rounded-xl">
  半透明的玻璃效果
</div>
```

### 文字截斷

```vue
<!-- 2 行截斷 -->
<p class="truncate-2">
  這段文字會在第二行後截斷...
</p>

<!-- 3 行截斷 -->
<p class="truncate-3">
  這段文字會在第三行後截斷...
</p>
```

### 聚焦環

```vue
<button class="focus-ring">
  帶有清晰聚焦指示的按鈕
</button>
```

## 📱 響應式設計

Tailwind 提供響應式斷點：

```vue
<div class="text-sm md:text-base lg:text-lg xl:text-xl">
  響應式文字大小
</div>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- 響應式網格 -->
</div>
```

## ✨ 動畫效果

```vue
<!-- 淡入動畫 -->
<div class="animate-fade-in">淡入</div>

<!-- 向上滑入 -->
<div class="animate-slide-up">向上滑入</div>

<!-- 向下滑入 -->
<div class="animate-slide-down">向下滑入</div>

<!-- 平滑過渡 -->
<div class="animate-smooth hover:scale-105">
  懸停時放大
</div>
```

## 📐 間距系統

除了 Tailwind 預設的間距，還額外提供：
- `spacing-128`: 32rem
- `spacing-144`: 36rem

```vue
<div class="mt-128">超大間距</div>
```

## 🔄 陰影效果

```vue
<!-- 柔和陰影 -->
<div class="shadow-soft">柔和陰影</div>

<!-- 大型柔和陰影 -->
<div class="shadow-soft-lg">大型柔和陰影</div>
```

## 🎨 完整範例

```vue
<template>
  <div class="gradient-bg min-h-screen py-8">
    <div class="container-custom">
      <!-- 標題區域 -->
      <header class="text-center mb-12">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          RabbirVocab
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          開始你的學習之旅
        </p>
      </header>

      <!-- 卡片網格 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="study-card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-semibold">單字組 1</h3>
            <span class="badge badge-primary">24 個單字</span>
          </div>
          <p class="text-gray-600 dark:text-gray-400 truncate-2">
            這是一個範例的單字組，包含各種常用的英文單字...
          </p>
          <div class="mt-4 flex gap-2">
            <button class="btn btn-primary flex-1">開始學習</button>
            <button class="btn btn-outline">編輯</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```

## 🚀 開始使用

1. 安裝建議的 VSCode 擴展（會自動提示）
2. 重新載入 VSCode 視窗以套用設定
3. 開始使用 Tailwind CSS 和自定義類別進行設計！

## 📚 參考資源

- [Tailwind CSS 官方文檔](https://tailwindcss.com/docs)
- [Tailwind CSS 顏色參考](https://tailwindcss.com/docs/customizing-colors)
- [Tailwind CSS 暗色模式](https://tailwindcss.com/docs/dark-mode)
