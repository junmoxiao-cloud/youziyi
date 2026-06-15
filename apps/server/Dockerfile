# 使用 Node.js 官方轻量级镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 及依赖锁定文件
COPY package*.json ./

# 安装依赖（包含 devDependencies 以支持 build）
RUN npm install

# 复制 prisma schema 和源码
COPY prisma ./prisma
COPY src ./src
COPY tsconfig.json ./
COPY tsconfig.build.json ./
COPY nest-cli.json ./

# 生成 Prisma 客户端（避免运行时再生成）
RUN npx prisma generate

# 构建 TypeScript（可选，保留此步以支持生产构建）
RUN npm run build

# 暴露服务端口（与 .env.example 中 PORT 默认值保持一致）
EXPOSE 3000

# 启动服务
CMD ["npm", "start"]
