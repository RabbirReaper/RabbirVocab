# 快速開始指南

## 🚀 安裝步驟

### 1. 安裝依賴
```bash
yarn install
```

### 2. 設置環境變數
複製 `.env.example` 為 `.env`：
```bash
cp .env.example .env
```

編輯 `.env` 文件（**重要**）：
```env
# Server Configuration
NODE_ENV=development
PORT=80

# Database - 修改為你的 MongoDB URI
MONGODB_URI=mongodb://localhost:27017/rabbirvocab

# Session - 請修改為強隨機字串！
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173
```

⚠️ **重要**: 務必修改 `SESSION_SECRET` 為你自己的強隨機字串！

### 3. 確保 MongoDB 正在運行

**選項 1: 本地 MongoDB**
```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

**選項 2: Docker**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**選項 3: MongoDB Atlas (雲端)**
- 前往 https://www.mongodb.com/cloud/atlas
- 創建免費集群並獲取連接字串
- 更新 `.env` 中的 `MONGODB_URI`

### 4. 啟動開發伺服器

**方式 1: 同時啟動前端和後端（推薦）**
```bash
yarn dev:all
```

**方式 2: 分別啟動**
```bash
# 終端 1 - 前端 (http://localhost:5173)
yarn dev

# 終端 2 - 後端 (http://localhost:80)
yarn server:dev
```

## ✅ 驗證安裝

### 測試後端健康檢查
```bash
curl http://localhost:80/health
```

應該返回：
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-01-21T12:00:00.000Z",
  "environment": "development"
}
```

### 測試註冊 API
```bash
curl -X POST http://localhost:80/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

如果成功，應該返回：
```json
{
  "success": true,
  "message": "註冊成功",
  "data": {
    "user": {
      "id": "...",
      "username": "testuser",
      "email": "test@example.com",
      "role": "user"
    }
  }
}
```

## 📝 可用的腳本

```bash
# 前端開發
yarn dev                    # 啟動前端開發伺服器
yarn build                  # 建置前端生產版本
yarn preview               # 預覽前端建置

# 後端開發
yarn server:dev            # 啟動後端開發伺服器（熱重載）
yarn server:build          # 建置後端生產版本
yarn server:start          # 啟動後端生產伺服器

# 同時開發
yarn dev:all               # 同時啟動前端和後端

# 測試
yarn test:unit             # 運行單元測試
yarn test:e2e              # 運行 E2E 測試

# 代碼品質
yarn lint                  # ESLint 檢查並自動修復
yarn format                # Prettier 格式化
yarn type-check            # TypeScript 類型檢查
```

## 🔑 API 端點

### 認證 API
- `POST /api/auth/register` - 註冊新用戶
- `POST /api/auth/login` - 用戶登入
- `POST /api/auth/logout` - 用戶登出
- `GET /api/auth/me` - 獲取當前用戶資訊
- `PATCH /api/auth/profile` - 更新用戶資料
- `PATCH /api/auth/change-password` - 修改密碼

詳細 API 文檔請參考 [server/README.md](server/README.md)

## 🛠️ 常見問題

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
- 開發環境建議使用 localhost 而非 127.0.0.1

### TypeScript 錯誤
- 執行 `yarn install` 確保所有依賴已安裝
- 刪除 `node_modules` 和 `yarn.lock`，重新安裝

## 📚 更多資源

- [完整安裝指南](INSTALLATION.md)
- [後端 API 文檔](server/README.md)
- [專案架構說明](CLAUDE.md)
- [樣式開發指南](STYLING_GUIDE.md)

## 🎉 開始開發

現在你可以開始開發了！

1. 前端：訪問 http://localhost:5173
2. 後端：API 端點位於 http://localhost:80/api
3. 健康檢查：http://localhost:80/health

祝開發順利！ 🚀
