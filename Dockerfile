# 多阶段构建 Dockerfile for 番茄钟应用

# 第一阶段：构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖（构建阶段需要所有依赖）
RUN npm ci --silent

# 复制源代码
COPY . .

# 构建应用（跳过 TypeScript 類型檢查以加快 Docker 構建）
RUN npm run build:docker

# 第二阶段：生产阶段
FROM nginx:alpine AS production

# 安装 dumb-init 用于正确的信号处理
RUN apk add --no-cache dumb-init

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S pomodoro -u 1001

# 复制自定义 nginx 配置
COPY docker/nginx.conf /etc/nginx/nginx.conf

# 从构建阶段复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制健康检查脚本
COPY docker/healthcheck.sh /usr/local/bin/healthcheck.sh
RUN chmod +x /usr/local/bin/healthcheck.sh

# 设置正确的权限
RUN chown -R pomodoro:nodejs /usr/share/nginx/html && \
    chown -R pomodoro:nodejs /var/cache/nginx && \
    chown -R pomodoro:nodejs /var/log/nginx && \
    chown -R pomodoro:nodejs /etc/nginx/conf.d

# 创建 nginx 运行时目录
RUN touch /var/run/nginx.pid && \
    chown -R pomodoro:nodejs /var/run/nginx.pid

# 切换到非 root 用户
USER pomodoro

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD /usr/local/bin/healthcheck.sh

# 启动命令
ENTRYPOINT ["dumb-init", "--"]
CMD ["nginx", "-g", "daemon off;"]