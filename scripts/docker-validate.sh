#!/bin/bash

# Docker 配置驗證腳本

set -e

echo "🔍 驗證 Docker 配置文件..."

# 檢查必要文件是否存在
echo "檢查 Docker 相關文件..."
files=(
    "Dockerfile"
    "Dockerfile.dev"
    "docker-compose.yml"
    "docker-compose.prod.yml"
    ".dockerignore"
    "Makefile"
    "docker/nginx.conf"
    "docker/proxy-nginx.conf"
    "docker/healthcheck.sh"
)

for file in "${files[@]}"; do
    if [[ -f "$file" ]]; then
        echo "✅ $file 存在"
    else
        echo "❌ $file 不存在"
        exit 1
    fi
done

# 檢查 Docker Compose 語法
echo ""
echo "🔍 驗證 Docker Compose 語法..."
if command -v docker-compose &> /dev/null; then
    echo "檢查主 docker-compose.yml..."
    docker-compose config --quiet
    echo "✅ docker-compose.yml 語法正確"
    
    echo "檢查生產環境 docker-compose.prod.yml..."
    docker-compose -f docker-compose.prod.yml config --quiet
    echo "✅ docker-compose.prod.yml 語法正確"
else
    echo "⚠️  docker-compose 未安裝，跳過語法檢查"
fi

# 檢查 Dockerfile 語法
echo ""
echo "🔍 驗證 Dockerfile 語法..."
if command -v docker &> /dev/null; then
    if docker version &> /dev/null; then
        echo "檢查生產環境 Dockerfile..."
        docker build --no-cache --dry-run -f Dockerfile . &> /dev/null && echo "✅ Dockerfile 語法正確" || echo "❌ Dockerfile 語法錯誤"
        
        echo "檢查開發環境 Dockerfile..."
        docker build --no-cache --dry-run -f Dockerfile.dev . &> /dev/null && echo "✅ Dockerfile.dev 語法正確" || echo "❌ Dockerfile.dev 語法錯誤"
    else
        echo "⚠️  Docker daemon 未運行，跳過 Dockerfile 語法檢查"
    fi
else
    echo "⚠️  Docker 未安裝，跳過 Dockerfile 語法檢查"
fi

# 檢查 Nginx 配置語法
echo ""
echo "🔍 驗證 Nginx 配置語法..."
if command -v nginx &> /dev/null; then
    nginx -t -c "$(pwd)/docker/nginx.conf" 2>/dev/null && echo "✅ nginx.conf 語法正確" || echo "❌ nginx.conf 語法錯誤"
    nginx -t -c "$(pwd)/docker/proxy-nginx.conf" 2>/dev/null && echo "✅ proxy-nginx.conf 語法正確" || echo "❌ proxy-nginx.conf 語法錯誤"
else
    echo "⚠️  Nginx 未安裝，跳過配置語法檢查"
fi

# 檢查健康檢查腳本
echo ""
echo "🔍 驗證健康檢查腳本..."
if [[ -x "docker/healthcheck.sh" ]]; then
    echo "✅ healthcheck.sh 具有執行權限"
else
    echo "⚠️  healthcheck.sh 沒有執行權限，正在設置..."
    chmod +x docker/healthcheck.sh
    echo "✅ healthcheck.sh 權限已設置"
fi

# 檢查 package.json 中的腳本
echo ""
echo "🔍 檢查 package.json 腳本..."
if grep -q '"test:coverage"' package.json; then
    echo "✅ package.json 包含 test:coverage 腳本"
else
    echo "❌ package.json 缺少 test:coverage 腳本"
fi

if grep -q '"build"' package.json; then
    echo "✅ package.json 包含 build 腳本"
else
    echo "❌ package.json 缺少 build 腳本"
fi

echo ""
echo "🎉 Docker 配置驗證完成！"
echo ""
echo "📝 使用指南："
echo "1. 確保 Docker 和 Docker Compose 已安裝並運行"
echo "2. 使用 'make help' 查看可用指令"
echo "3. 使用 'make build' 構建生產鏡像"
echo "4. 使用 'make run' 啟動生產環境"
echo "5. 使用 'make run-dev' 啟動開發環境"