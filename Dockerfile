# ========================================
# 多階段建置 - 建置階段
# ========================================
FROM node:20-alpine AS builder

WORKDIR /app

# 複製 package.json 和 yarn.lock
COPY package.json yarn.lock ./

# 安裝所有依賴（包含 devDependencies）
RUN yarn install --frozen-lockfile

# 複製應用程式代碼
COPY . .

# 建置前端（生成 dist 目錄）
RUN yarn build-only

# 建置後端（編譯 TypeScript）
RUN yarn server:build

# ========================================
# 生產階段
# ========================================
FROM node:20-alpine

WORKDIR /app

# 只複製 package.json 和 yarn.lock
COPY package.json yarn.lock ./

# 只安裝生產依賴
RUN yarn install --frozen-lockfile --production && \
    yarn cache clean

# 從建置階段複製已編譯的檔案
COPY --from=builder /app/dist ./dist


# 暴露端口（Cloud Run 會自動設定 PORT 環境變數，預設 8080）
EXPOSE 8080

# 設定環境變數
ENV NODE_ENV=production

# 啟動應用程式
CMD ["node", "dist/server/server.js"]
