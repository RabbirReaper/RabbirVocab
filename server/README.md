# RabbirVocab Backend API

## 專案結構

```
server/
├── app.ts                    # Express 應用主程式
├── server.ts                 # 伺服器入口
├── config/                   # 配置文件
│   ├── database.ts          # 資料庫連接
│   └── session.ts           # Session 配置
├── controllers/             # 控制器
│   └── authController.ts    # 認證相關控制器
├── middleware/              # 中間件
│   ├── authMiddleware.ts    # 身份驗證中間件 (RBAC)
│   └── errorHandler.ts      # 錯誤處理中間件
├── model/                   # 資料模型
│   ├── User.ts             # 用戶模型
│   ├── Deck.ts             # 卡組模型
│   ├── Card.ts             # 卡片模型
│   └── types.ts            # TypeScript 類型定義
├── routes/                  # 路由
│   ├── authRoutes.ts       # 認證路由
│   └── example.routes.ts   # 範例路由
└── utils/                   # 工具函數
    ├── asyncHandler.ts     # 異步錯誤處理包裝器
    └── errors.ts           # 自定義錯誤類別
```

## 安裝依賴

```bash
yarn add express express-session connect-mongo cors helmet morgan dotenv
yarn add -D @types/express @types/express-session @types/cors @types/morgan
```

## 環境變數設置

複製 `.env.example` 為 `.env` 並修改配置：

```bash
cp .env.example .env
```

## API 文檔

### 認證 API (Auth)

#### 1. 註冊
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

**回應：**
```json
{
  "success": true,
  "message": "註冊成功",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "testuser",
      "email": "test@example.com",
      "role": "user"
    }
  }
}
```

#### 2. 登入
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

**回應：**
```json
{
  "success": true,
  "message": "登入成功",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "testuser",
      "email": "test@example.com",
      "role": "user",
      "stats": {
        "totalCards": 0,
        "cardsLearned": 0,
        "totalReviews": 0,
        "studyStreak": 0
      }
    }
  }
}
```

#### 3. 登出
```http
POST /api/auth/logout
```

**回應：**
```json
{
  "success": true,
  "message": "登出成功"
}
```

#### 4. 獲取當前用戶資訊
```http
GET /api/auth/me
```

**回應：**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "testuser",
      "email": "test@example.com",
      "role": "user",
      "stats": { ... },
      "subscription": { ... }
    }
  }
}
```

#### 5. 更新用戶資料
```http
PATCH /api/auth/profile
Content-Type: application/json

{
  "username": "newusername",
  "displayName": "New Display Name",
  "avatar": "https://example.com/avatar.jpg"
}
```

#### 6. 修改密碼
```http
PATCH /api/auth/change-password
Content-Type: application/json

{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

## RBAC 權限系統

### 角色層級（由低到高）
1. `user` - 普通用戶
2. `pro` - Pro 訂閱用戶
3. `admin` - 管理員
4. `super_admin` - 超級管理員

### Middleware 使用範例

#### 1. 需要登入
```typescript
import { requireAuth } from '../middleware/authMiddleware'

router.get('/protected', requireAuth, (req, res) => {
  // 只有已登入用戶可以訪問
  res.json({ user: req.user })
})
```

#### 2. 需要特定角色
```typescript
import { requireAuth, requireRole } from '../middleware/authMiddleware'

// 需要 Pro 用戶或更高權限
router.get('/pro-feature', requireAuth, requireRole('pro'), (req, res) => {
  res.json({ message: 'Pro 功能' })
})

// 需要管理員或超級管理員
router.get('/admin-panel', requireAuth, requireRole('admin'), (req, res) => {
  res.json({ message: '管理員面板' })
})
```

#### 3. 驗證資源擁有者
```typescript
import { requireAuth, requireOwnerOrAdmin } from '../middleware/authMiddleware'

router.get(
  '/deck/:deckId',
  requireAuth,
  requireOwnerOrAdmin(async (req) => {
    const deck = await Deck.findById(req.params.deckId)
    return deck ? deck.user.toString() : null
  }),
  async (req, res) => {
    // 只有卡組擁有者或管理員可以訪問
    const deck = await Deck.findById(req.params.deckId)
    res.json({ deck })
  }
)
```

#### 4. 驗證訂閱狀態
```typescript
import { requireAuth, requireSubscription } from '../middleware/authMiddleware'

// 需要 Pro 訂閱
router.get('/premium-feature', requireAuth, requireSubscription('pro'), (req, res) => {
  res.json({ message: 'Premium 功能' })
})
```

## 錯誤處理

### 自定義錯誤類別

```typescript
import {
  ValidationError,      // 400
  UnauthorizedError,    // 401
  ForbiddenError,       // 403
  NotFoundError,        // 404
  ConflictError,        // 409
  InternalServerError,  // 500
} from '../utils/errors'

// 使用範例
throw new ValidationError('Email 格式不正確')
throw new UnauthorizedError('請先登入')
throw new ForbiddenError('權限不足')
throw new NotFoundError('用戶不存在')
throw new ConflictError('Email 已被註冊')
```

### 錯誤回應格式

```json
{
  "success": false,
  "error": {
    "message": "錯誤訊息",
    "statusCode": 400
  }
}
```

## Session 配置

- **存儲方式**: MongoDB (使用 connect-mongo)
- **Cookie 設定**:
  - `maxAge`: 7 天
  - `httpOnly`: true (防止 XSS)
  - `secure`: 生產環境為 true (僅 HTTPS)
  - `sameSite`: 'lax' (CSRF 防護)

## 安全性

1. **密碼加密**: 使用 bcrypt 加密密碼
2. **Session**: 儲存在 MongoDB，支援跨域認證
3. **CORS**: 僅允許指定來源訪問
4. **Helmet**: 設置安全相關的 HTTP headers
5. **RBAC**: 基於角色的訪問控制

## 啟動伺服器

### 開發環境
```bash
# 添加啟動腳本到 package.json
"scripts": {
  "server:dev": "tsx watch server/server.ts",
  "server:build": "tsc -p tsconfig.server.json",
  "server:start": "node dist/server/server.js"
}

# 啟動開發伺服器
yarn server:dev
```

### 生產環境
```bash
yarn server:build
yarn server:start
```

## 測試 API

使用 curl 或 Postman 測試：

```bash
# 註冊
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# 登入
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt

# 獲取當前用戶 (使用 session cookie)
curl -X GET http://localhost:3000/api/auth/me \
  -b cookies.txt

# 登出
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```
