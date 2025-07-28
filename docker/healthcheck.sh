#!/bin/sh
# 健康检查脚本

# 检查 nginx 进程是否运行
if ! pgrep nginx > /dev/null; then
    echo "Nginx process not found"
    exit 1
fi

# 检查端口是否监听
if ! netstat -ln | grep :8080 > /dev/null; then
    echo "Port 8080 is not listening"
    exit 1
fi

# 检查健康检查端点
if ! wget --quiet --tries=1 --spider http://localhost:8080/health; then
    echo "Health endpoint check failed"
    exit 1
fi

echo "Health check passed"
exit 0