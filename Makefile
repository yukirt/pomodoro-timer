# Makefile for Pomodoro Timer Docker operations

.PHONY: help build build-dev run run-dev stop clean test logs shell

# 默认目标
help:
	@echo "Pomodoro Timer Docker 操作命令："
	@echo ""
	@echo "构建相关："
	@echo "  build      - 构建生产环境镜像"
	@echo "  build-dev  - 构建开发环境镜像" 
	@echo ""
	@echo "运行相关："
	@echo "  run        - 运行生产环境"
	@echo "  run-dev    - 运行开发环境"
	@echo "  run-prod   - 运行生产环境（带代理）"
	@echo ""
	@echo "管理相关："
	@echo "  stop       - 停止所有容器"
	@echo "  clean      - 清理容器和镜像"
	@echo "  logs       - 查看日志"
	@echo "  shell      - 进入容器 shell"
	@echo ""
	@echo "测试相关："
	@echo "  test       - 在容器中运行测试"
	@echo "  test-cov   - 运行测试并生成覆盖率报告"

# 构建生产环境镜像
build:
	@echo "🏗️ 构建生产环境镜像..."
	docker-compose build pomodoro-app

# 构建开发环境镜像
build-dev:
	@echo "🏗️ 构建开发环境镜像..."
	docker-compose build pomodoro-dev

# 运行生产环境
run:
	@echo "🚀 启动生产环境..."
	docker-compose up -d pomodoro-app

# 运行开发环境
run-dev:
	@echo "🚀 启动开发环境..."
	docker-compose --profile dev up -d pomodoro-dev

# 运行生产环境（带代理）
run-prod:
	@echo "🚀 启动生产环境（带代理）..."
	docker-compose -f docker-compose.prod.yml up -d

# 停止所有容器
stop:
	@echo "🛑 停止所有容器..."
	docker-compose down
	docker-compose --profile dev down
	docker-compose -f docker-compose.prod.yml down

# 清理容器和镜像
clean: stop
	@echo "🧹 清理容器和镜像..."
	docker system prune -f
	docker volume prune -f

# 查看日志
logs:
	@echo "📋 查看应用日志..."
	docker-compose logs -f pomodoro-app

# 查看开发环境日志
logs-dev:
	@echo "📋 查看开发环境日志..."
	docker-compose logs -f pomodoro-dev

# 进入容器 shell
shell:
	@echo "🐚 进入生产容器 shell..."
	docker-compose exec pomodoro-app sh

# 进入开发容器 shell
shell-dev:
	@echo "🐚 进入开发容器 shell..."
	docker-compose exec pomodoro-dev sh

# 在容器中运行测试
test:
	@echo "🧪 在容器中运行测试..."
	docker-compose exec pomodoro-dev npm test

# 运行测试并生成覆盖率报告
test-cov:
	@echo "🧪 运行测试并生成覆盖率报告..."
	docker-compose exec pomodoro-dev npm run test:coverage

# 检查健康状态
health:
	@echo "🏥 检查容器健康状态..."
	docker-compose ps

# 重启服务
restart:
	@echo "🔄 重启服务..."
	docker-compose restart pomodoro-app

# 重启开发服务
restart-dev:
	@echo "🔄 重启开发服务..."
	docker-compose restart pomodoro-dev