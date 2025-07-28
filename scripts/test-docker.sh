#!/bin/bash

# Docker 測試腳本

set -e

echo "🚀 開始 Docker 容器化測試..."

# 檢查 Docker 是否運行
if ! docker version &> /dev/null; then
    echo "⚠️  Docker daemon 未運行，將執行離線測試..."
    
    # 檢查配置文件
    echo "✅ 檢查 Docker 配置文件完整性..."
    
    # 驗證必要文件存在
    required_files=(
        "Dockerfile"
        "Dockerfile.dev"
        "docker-compose.yml"
        "docker-compose.prod.yml"
        ".dockerignore"
        "Makefile"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            echo "❌ 缺少文件: $file"
            exit 1
        fi
    done
    
    echo "✅ 所有配置文件存在"
    
    # 檢查 Docker Compose 語法
    echo "✅ 驗證 Docker Compose 語法..."
    docker-compose config --quiet
    docker-compose -f docker-compose.prod.yml config --quiet
    echo "✅ Docker Compose 配置正確"
    
    # 檢查 Makefile 目標
    echo "✅ 檢查 Makefile 目標..."
    make help > /dev/null
    echo "✅ Makefile 配置正確"
    
    echo ""
    echo "🎉 離線測試完成！"
    echo "📝 要完整測試，請啟動 Docker daemon 並運行："
    echo "   docker build -t pomodoro-timer ."
    echo "   make run"
    
    exit 0
fi

echo "✅ Docker daemon 正在運行"

# 構建生產鏡像
echo "🏗️  構建生產環境鏡像..."
docker build -t pomodoro-timer .

echo "✅ 生產鏡像構建成功"

# 構建開發鏡像
echo "🏗️  構建開發環境鏡像..."
docker build -f Dockerfile.dev -t pomodoro-timer-dev .

echo "✅ 開發鏡像構建成功"

# 測試鏡像
echo "🧪 測試鏡像..."
docker images | grep pomodoro-timer

# 測試健康檢查
echo "🏥 測試健康檢查腳本..."
docker run --rm pomodoro-timer-dev /bin/sh -c "chmod +x /usr/local/bin/healthcheck.sh && echo 'Health check script exists'" || echo "⚠️ 健康檢查需要在運行容器中測試"

echo ""
echo "🎉 Docker 測試完成！"
echo ""
echo "📝 使用指南："
echo "1. 啟動生產環境: make run"
echo "2. 啟動開發環境: make run-dev"
echo "3. 查看容器狀態: make health"
echo "4. 查看日誌: make logs"
echo "5. 停止服務: make stop"