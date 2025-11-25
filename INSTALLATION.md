# 後端安裝指南

## 1. 安裝必要依賴

### 核心依賴
```bash
yarn add express express-session connect-mongo cors helmet morgan dotenv
```

### TypeScript 類型定義
```bash
yarn add -D @types/express @types/express-session @types/cors @types/morgan tsx
```

### 說明
- `express` - Node.js web 框架
- `express-session` - Session 管理
- `connect-mongo` - 將 session 儲存到 MongoDB
- `cors` - 跨域資源共享
- `helmet` - 安全性 HTTP headers
- `morgan` - HTTP 請求日誌
- `dotenv` - 環境變數管理
- `tsx` - TypeScript 執行工具（開發用）

## 2. 更新 package.json

在 `package.json` 中添加以下腳本：

```json
{
  "scripts": {
    "dev": "vite",
    "server:dev": "tsx watch server/server.ts",
    "server:build": "tsc -p tsconfig.server.json",
    "server:start": "node dist/server/server.js",
    "build": "run-p type-check \"build-only {@}\" --",
    "preview": "vite preview",
    "test:unit": "vitest",
    "test:e2e": "playwright test",
    "build-only": "vite build",
    "type-check": "vue-tsc --build",
    "lint": "eslint . --fix",
    "format": "prettier --write src/"
  }
}
```

## 3. 環境變數設置

複製 `.env.example` 為 `.env`：

```bash
cp .env.example .env
```

編輯 `.env` 文件，設置你的配置：

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/rabbirvocab

# Session
SESSION_SECRET=請修改為你自己的強密鑰

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173
```

⚠️ **重要**: 在生產環境中，務必修改 `SESSION_SECRET` 為強隨機字串！

## 4. 安裝 MongoDB

### 選項 1: 本地安裝
從 [MongoDB 官網](https://www.mongodb.com/try/download/community) 下載並安裝 MongoDB Community Edition。

啟動 MongoDB：
```bash
# Windows
net start MongoDB

# macOS (使用 Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### 選項 2: 使用 Docker
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 選項 3: 使用 MongoDB Atlas (雲端)
1. 前往 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. 創建免費帳號並建立 Cluster
3. 獲取連接字串並更新 `.env` 中的 `MONGODB_URI`

## 5. 啟動開發伺服器

### 同時啟動前端和後端

**方式 1: 使用兩個終端視窗**
```bash
# 終端 1 - 前端
yarn dev

# 終端 2 - 後端
yarn server:dev
```

**方式 2: 使用 concurrently (推薦)**

安裝 concurrently：
```bash
yarn add -D concurrently
```

在 `package.json` 添加腳本：
```json
{
  "scripts": {
    "dev:all": "concurrently \"yarn dev\" \"yarn server:dev\" --names \"client,server\" --prefix-colors \"blue,green\""
  }
}
```

然後執行：
```bash
yarn dev:all
```

## 6. 驗證安裝

### 測試後端健康檢查
```bash
curl http://localhost:3000/health
```

應該返回：
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### 測試註冊 API
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 測試登入 API
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }' \
  -c cookies.txt
```

### 測試獲取當前用戶
```bash
curl http://localhost:3000/api/auth/me -b cookies.txt
```

## 7. 前端整合

在前端使用 fetch 或 axios 呼叫 API 時，記得設置 `credentials: 'include'` 以傳遞 cookie：

```typescript
// 使用 fetch
fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // 重要：允許傳遞 cookie
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123',
  }),
})

// 或使用 axios
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true, // 重要：允許傳遞 cookie
})

api.post('/auth/login', {
  email: 'test@example.com',
  password: 'password123',
})
```

## 8. 生產環境部署

### 建置後端
```bash
yarn server:build
```

### 設置生產環境變數
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=你的生產資料庫URI
SESSION_SECRET=強隨機字串
CLIENT_URL=https://你的前端域名.com
```

### 啟動生產伺服器
```bash
yarn server:start
```

### 使用 PM2 管理 (推薦)
```bash
# 安裝 PM2
npm install -g pm2

# 啟動伺服器
pm2 start dist/server/server.js --name rabbirvocab-api

# 查看狀態
pm2 status

# 查看日誌
pm2 logs rabbirvocab-api

# 重啟
pm2 restart rabbirvocab-api

# 停止
pm2 stop rabbirvocab-api
```

## 故障排除

### MongoDB 連接失敗
- 確認 MongoDB 服務正在運行
- 檢查 `.env` 中的 `MONGODB_URI` 是否正確
- 如果使用 Atlas，確認 IP 白名單設置

### CORS 錯誤
- 確認 `.env` 中的 `CLIENT_URL` 與前端 URL 一致
- 前端請求時確保設置了 `credentials: 'include'`

### Session 無法保存
- 確認前端設置了 `withCredentials: true` 或 `credentials: 'include'`
- 檢查瀏覽器是否阻擋 third-party cookies
- 開發環境可以嘗試使用 localhost 而非 127.0.0.1

### TypeScript 編譯錯誤
- 執行 `yarn install` 確保所有類型定義已安裝
- 檢查 `tsconfig.server.json` 配置是否正確

## 完成！

現在你的後端 API 應該已經成功運行了。可以開始開發其他功能的 controller 和 routes。

參考 [server/README.md](server/README.md) 了解更多 API 使用方式和 RBAC 權限控制。
