# 🍅 番茄鐘計時器 - Pomodoro Timer

一個功能齊全的番茄工作法時間管理應用程式，採用 React 18 + TypeScript 技術開發，協助您提升工作效率與專注力。

## ✨ 主要功能

### 🍅 核心計時功能
- **彈性計時器**：支援工作時段、短休息、長休息三種模式
- **智慧控制**：提供開始、暫停、重設功能，完全掌控您的時間
- **視覺化進度**：圓形進度條清楚顯示時間進度
- **模式提示**：明確顯示目前處於工作或休息狀態

### ⚙️ 個人化設定
- **自訂時間長度**：依據個人需求調整工作時間與休息時間
- **長休息間隔**：設定幾個工作循環後進行長休息
- **自動化選項**：可選擇自動開始休息或工作模式
- **設定儲存**：所有設定自動存檔，重新啟動後維持原狀

### 🔔 智慧通知系統
- **多重提醒**：音效提醒 + 視覺通知 + 桌面通知
- **可自訂音效**：多種提示音供您選擇
- **通知權限管理**：支援桌面通知權限申請與管理

### 📊 詳細統計追蹤
- **完成追蹤**：記錄每日、每週完成的番茄鐘數量
- **工作時間統計**：追蹤累計工作時間
- **歷史資料**：按日期檢視歷史統計資料
- **視覺化圖表**：直覺式的資料呈現

### 📝 任務管理系統
- **任務建立**：新增任務並設定預估番茄鐘數量
- **任務關聯**：將番茄鐘與特定任務進行關聯
- **進度追蹤**：即時顯示任務完成進度
- **任務狀態管理**：標記完成、編輯、刪除任務

### 🎨 優雅的使用者介面
- **主題切換**：工作模式（紅色）、休息模式（綠色/藍色）自動切換
- **響應式設計**：完美適配桌上型電腦、平板電腦、手機等各種裝置
- **直覺操作**：簡潔明瞭的介面設計，專注於核心功能
- **鍵盤快速鍵**：支援鍵盤操作，提升使用效率

## 🚀 快速開始

### 方式一：Docker 容器化部署（建議）

#### 系統需求
- Docker 20.0 或更高版本
- Docker Compose 1.29 或更高版本

#### 🐳 Docker 快速啟動

1. **下載專案**
```bash
git clone https://github.com/yukirt/pomodoro-timer.git
cd pomodoro-timer
```

2. **一鍵啟動正式環境**
```bash
# 使用 Make 指令（建議）
make run

# 或使用 Docker Compose
docker-compose up -d pomodoro-app
```

3. **開啟瀏覽器**
前往 `http://localhost:8080` 開始使用

#### 🛠️ 開發環境

```bash
# 啟動開發環境（支援熱重載）
make run-dev

# 或使用 Docker Compose
docker-compose --profile dev up -d pomodoro-dev
```
前往 `http://localhost:3000` 進行開發

#### 📋 常用 Docker 指令

```bash
# 檢視所有可用指令
make help

# 建置正式環境映像檔
make build

# 檢視容器狀態與健康檢查
make health

# 檢視應用程式日誌
make logs                    # 正式環境日誌
make logs-dev               # 開發環境日誌

# 進入容器 shell 進行除錯
make shell                  # 正式環境 shell
make shell-dev             # 開發環境 shell

# 在容器中執行測試（需開發環境）
make test                   # 執行測試
make test-cov              # 執行測試並產生覆蓋率報告

# 服務管理
make restart               # 重新啟動正式服務
make restart-dev          # 重新啟動開發服務
make stop                 # 停止所有服務
make clean                # 清理容器與映像檔

# 驗證 Docker 設定
./scripts/docker-validate.sh
./scripts/test-docker.sh
```

### 方式二：傳統本機開發

#### 系統需求
- Node.js 16.0 或更高版本
- npm 或 yarn 套件管理工具

#### 安裝步驟

1. **下載專案**
```bash
git clone https://github.com/yukirt/pomodoro-timer.git
cd pomodoro-timer
```

2. **安裝相依套件**
```bash
npm install
```

3. **啟動開發伺服器**
```bash
npm run dev
```

4. **開啟瀏覽器**
前往 `http://localhost:5173` 開始使用

#### 建置正式版本

```bash
# 建置專案
npm run build

# 預覽正式版本
npm run preview
```

## 🧪 測試

本專案擁有完整的測試覆蓋率，確保程式碼品質與功能穩定性。

### 測試統計
- **📊 測試總覽**：29 個測試檔案，582 個測試案例
- **✅ 通過率**：100% (582/582)
- **🎯 覆蓋範圍**：單元測試、整合測試、端對端測試
- **📈 程式碼覆蓋率**：整體 77.6%，關鍵模組超過 95%

### 快速執行
```bash
# 執行所有測試
npm test

# 監控模式執行測試
npm run test:watch

# 程式碼檢查
npm run lint

# 產生程式碼覆蓋率報告
npm run test:coverage

# 檢視詳細覆蓋率報告（HTML 格式）
open coverage/index.html
```

### 程式碼覆蓋率

本專案維持高品質的程式碼覆蓋率，確保關鍵功能獲得充分測試：

#### 📊 整體覆蓋率統計
- **整體覆蓋率**：77.6%
- **分支覆蓋率**：89.25%
- **函式覆蓋率**：84.47%
- **陳述式覆蓋率**：77.6%

#### 🎯 核心模組覆蓋率

| 模組分類 | 陳述式覆蓋率 | 分支覆蓋率 | 函式覆蓋率 | 重點功能 |
|---------|-------------|-----------|----------|---------|
| **核心業務邏輯** | | | | |
| Timer Controller | 99.46% | 90.47% | 100% | ⏱️ 計時器邏輯 |
| Settings Manager | 98.42% | 97.22% | 100% | ⚙️ 設定管理 |
| Task Manager | 98.51% | 92.30% | 100% | 📝 任務管理 |
| Session Manager | 100% | 100% | 100% | 📊 工作階段記錄 |
| Theme Manager | 100% | 100% | 100% | 🎨 主題系統 |
| **通知系統** | | | | |
| Desktop Notifications | 99.63% | 87.71% | 100% | 🔔 桌面通知 |
| Visual Notifications | 99.19% | 95.91% | 100% | 👁️ 視覺提醒 |
| Sound Manager | 97.38% | 95.45% | 92.85% | 🔊 音效管理 |
| **UI 元件** | | | | |
| Settings Panel | 98.27% | 84.61% | 100% | ⚙️ 設定介面 |
| Timer Controls | 100% | 100% | 100% | ⏱️ 計時器控制 |
| Timer Display | 98.33% | 92% | 100% | 📱 計時器顯示 |
| **資料處理** | | | | |
| Stats Calculator | 96.40% | 89.47% | 100% | 📈 統計計算 |
| Stats Filter | 100% | 98.18% | 100% | 🔍 資料篩選 |
| Task Storage | 100% | 100% | 100% | 💾 任務儲存 |

#### ⭐ 覆蓋率亮點

- **關鍵業務邏輯**：核心模組（Timer、Settings、Task）達到 98%+ 覆蓋率
- **高穩定性模組**：SessionManager 與 ThemeManager 達到 100% 完整覆蓋
- **通知系統**：所有通知相關模組超過 95% 覆蓋率
- **UI 元件**：核心計時器元件達到 98%+ 覆蓋率

#### 🔍 未覆蓋區域分析

主要未覆蓋的程式碼集中在：
- **工具模組** (34.77%)：效能監控與儲存最佳化相關程式碼
- **進入檔案** (0%)：main.tsx 與 index.ts 檔案（啟動程式碼）
- **錯誤處理邊界**：極少數異常情況分支

#### 📈 覆蓋率趨勢目標

- ✅ **已達成**：核心業務邏輯 > 95%
- ✅ **已達成**：關鍵 UI 元件 > 95%  
- ✅ **已達成**：整體函式覆蓋率 > 80%
- 🎯 **目標**：工具模組覆蓋率提升至 > 60%
- 🎯 **目標**：整體覆蓋率提升至 > 85%

### 測試分類

#### 🔬 單元測試 (Unit Tests)
測試個別元件與函式的功能：

```bash
# 核心業務邏輯測試
npm test src/core/

# 元件測試
npm test src/components/
```

**涵蓋模組：**
- ⏱️ **TimerController** - 計時器邏輯與狀態管理
- ⚙️ **SettingsManager** - 設定儲存與驗證
- 📊 **SessionManager** - 番茄鐘工作階段記錄
- 📝 **TaskManager** - 任務 CRUD 操作
- 🔔 **NotificationManager** - 通知與音效系統
- 🎨 **ThemeManager** - 主題切換邏輯

#### 🔗 整合測試 (Integration Tests)
測試模組間的協作與資料流：

```bash
# 執行整合測試
npm test src/test/integration
```

**測試情境：**
- 🍅 **完整番茄鐘工作流程** - 任務選擇到計時完成
- ⚙️ **設定與個人化流程** - 自訂設定即時套用
- 📝 **任務管理生命週期** - 建立、編輯、完成任務
- 📱 **響應式介面流程** - 桌上型電腦/行動裝置一致性
- 💾 **資料完整性流程** - 持久化與錯誤處理
- ♿ **使用者體驗流程** - 無障礙功能與鍵盤導覽

#### 🚀 端對端測試 (E2E Tests)
模擬真實使用者操作的完整流程：

```bash
# 執行端對端測試
npm test src/test/e2e
```

**涵蓋流程：**
- 基本計時器操作（開始、暫停、重設）
- 任務建立與選擇工作流程
- 設定修改與套用流程
- 統計資料檢視與篩選
- 行動裝置導覽與響應式功能
- 錯誤處理與邊界情況

#### ⚡ 效能測試 (Performance Tests)
確保應用程式在各種使用情境下的效能表現：

```bash
# 執行效能測試
npm test src/test/performance
```

**測試項目：**
- 元件算繪效能
- 長時間使用穩定性
- 儲存操作最佳化
- 記憶體洩漏檢測
- 快速互動回應性

### 測試檔案結構

```
src/test/
├── integration.test.tsx           # 基礎整合測試
├── integration-workflows.test.tsx # 完整工作流程測試
├── e2e.test.tsx                  # 基本端對端測試
├── e2e-simple.test.tsx           # 簡化端對端測試
├── e2e-final.test.tsx            # 完整端對端測試
├── performance.test.tsx          # 效能測試
├── settings-panel-display.test.tsx      # 設定面板顯示測試
└── settings-panel-fix-verification.test.tsx # 設定面板修復驗證
```

### 測試最佳實務

本專案遵循以下測試最佳實務：

- **🎯 高覆蓋率**：涵蓋所有關鍵功能與邊界情況
- **🔄 真實情境**：基於實際使用者操作流程設計測試
- **⚡ 快速執行**：最佳化測試執行速度，支援快速回饋
- **🛡️ 錯誤處理**：完整測試錯誤情況與邊界條件
- **♿ 無障礙性**：驗證鍵盤導覽與輔助技術支援
- **📱 跨平台**：確保桌上型電腦與行動裝置功能一致性

### 測試資料

| 測試類型 | 檔案數量 | 測試案例 | 通過率 | 平均覆蓋率 |
|---------|---------|---------|-------|-----------|
| 單元測試 | 15 | 387 | 100% ✅ | 96.8% 🟢 |
| 整合測試 | 6 | 67 | 100% ✅ | 85.2% 🟡 |
| 端對端測試 | 5 | 84 | 100% ✅ | 78.4% 🟡 |
| 效能測試 | 1 | 16 | 100% ✅ | 72.1% 🟡 |
| 其他測試 | 2 | 28 | 100% ✅ | 91.3% 🟢 |
| **總計** | **29** | **582** | **100% ✅** | **77.6% 🟡** |

#### 覆蓋率圖例
- 🟢 **優秀** (>90%)：核心功能完全覆蓋
- 🟡 **良好** (70-90%)：主要功能已覆蓋  
- 🔴 **需改進** (<70%)：需要增加測試

## 📱 使用方式

### 基本操作

1. **開始工作**
   - 點選「開始」按鈕開始 25 分鐘的工作時間
   - 計時器會顯示剩餘時間與進度

2. **休息時間**
   - 工作時間結束後，系統會自動切換到休息模式
   - 短休息 5 分鐘，每 4 個工作循環後有 15 分鐘長休息

3. **任務管理**
   - 在任務面板中新增您要完成的任務
   - 選擇任務後開始計時，系統會自動關聯番茄鐘與任務

4. **檢視統計**
   - 在統計面板檢視您的工作效率與完成情況
   - 支援按日期篩選與檢視歷史資料

### 個人化設定

在設定面板中，您可以：
- 調整工作時間長度（預設 25 分鐘）
- 調整短休息時間（預設 5 分鐘）
- 調整長休息時間（預設 15 分鐘）
- 設定長休息間隔（預設每 4 個工作循環）
- 開啟/關閉音效提醒與桌面通知
- 選擇自動開始選項

## 🐳 Docker 容器化部署

本專案提供完整的 Docker 容器化解決方案，支援開發、測試與正式環境的一鍵部署。

### 📦 容器架構

- **多階段建置**：最佳化映像檔大小，正式環境僅包含必要檔案
- **非 root 使用者**：提升容器安全性
- **健康檢查**：自動監控應用程式狀態
- **資源限制**：防止資源濫用

### 🎯 部署選項

#### 1. 標準部署（建議）
```bash
# 一鍵建置並啟動正式環境
make build && make run

# 檢查服務狀態（包含健康檢查）
make health

# 前往應用程式
open http://localhost:8080

# 檢查健康端點
curl http://localhost:8080/health
```

**部署驗證：**
- ✅ 容器啟動時間：~10 秒
- ✅ 健康檢查：自動每 30 秒檢查一次
- ✅ 記憶體使用量：~50MB（正式環境）
- ✅ 映像檔大小：~45MB（多階段建置最佳化）

#### 2. 開發環境
```bash
# 啟動開發環境（支援熱重載）
make run-dev

# 檢視開發日誌
make logs-dev

# 在容器中執行測試
make test
make test-cov

# 前往開發伺服器
open http://localhost:3000
```

**開發環境特色：**
- 🔥 熱重載支援，程式碼變更即時生效
- 📦 完整開發相依套件，包含測試工具
- 🐛 除錯友善，支援 source map
- 📊 內建測試覆蓋率報告

#### 3. 正式環境（含反向代理）
```bash
# 啟動完整正式環境
make run-prod

# 包含：
# - 應用程式容器 (pomodoro-app:8080)
# - Nginx 反向代理 (nginx-proxy:80/443)
# - SSL 終止與負載平衡
```

### 🔧 Docker 設定檔

| 檔案 | 用途 | 說明 |
|------|------|------|
| `Dockerfile` | 正式環境映像檔 | 多階段建置，基於 Alpine Linux |
| `Dockerfile.dev` | 開發環境映像檔 | 包含開發相依套件，支援熱重載 |
| `docker-compose.yml` | 服務編排 | 定義應用程式服務與網路 |
| `docker-compose.prod.yml` | 正式編排 | 包含代理與資源限制 |
| `Makefile` | 操作指令 | 簡化 Docker 操作指令 |

### 🛡️ 安全特色

- **非特權使用者**：容器內使用 `pomodoro` 使用者執行
- **最小權限原則**：僅公開必要的連接埠與目錄
- **安全標頭設定**：Nginx 設定包含安全 HTTP 標頭
- **健康檢查**：定期檢查應用程式狀態
- **資源限制**：CPU 與記憶體使用限制

### 📊 效能最佳化

- **映像檔最佳化**：使用 Alpine Linux 減少映像檔大小
- **分層快取**：充分利用 Docker 層快取
- **Gzip 壓縮**：Nginx 自動壓縮靜態資源
- **資源限制**：防止單一容器占用過多資源

### 🔍 監控與日誌

```bash
# 檢視容器狀態
docker-compose ps

# 檢視應用程式日誌
make logs

# 檢視 Nginx 代理日誌
docker-compose logs nginx-proxy

# 監控資源使用量
docker stats
```

### 🚀 CI/CD 整合

Docker 設定可與 CI/CD 管道無縫整合：

```yaml
# GitHub Actions 範例
name: Docker CI/CD
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: 驗證 Docker 設定
        run: ./scripts/docker-validate.sh
        
      - name: 建置 Docker 映像檔
        run: |
          make build
          make build-dev
          
      - name: 在容器中執行測試
        run: |
          make run-dev
          make test-cov
          
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: 部署至正式環境
        run: make run-prod
```

### 🛠️ Docker 最佳實務

#### 效能最佳化
- **多階段建置**：減少最終映像檔大小 (~45MB)
- **層級快取**：充分利用 Docker 建置快取
- **Alpine 基底**：使用輕量化 Linux 發行版
- **相依套件分離**：正式環境只包含執行時相依套件

#### 安全考量
- **非 root 使用者**：容器內使用專用使用者 `pomodoro`
- **最小權限**：僅公開必要連接埠 (8080)
- **健康檢查**：定期監控應用程式狀態
- **安全標頭設定**：Nginx 設定包含 CSP 等安全標頭

#### 監控與日誌
```bash
# 即時監控容器資源使用量
docker stats pomodoro-timer

# 檢視詳細容器資訊
docker inspect pomodoro-timer

# 檢查容器健康狀態
docker exec pomodoro-timer /usr/local/bin/healthcheck.sh
```

### 🔧 疑難排解

#### 常見問題

**1. 容器啟動失敗**
```bash
# 檢查容器日誌
make logs

# 檢查 Nginx 設定
docker exec pomodoro-timer nginx -t
```

**2. 健康檢查失敗**
```bash
# 手動執行健康檢查
docker exec pomodoro-timer /usr/local/bin/healthcheck.sh

# 檢查連接埠監聽
docker exec pomodoro-timer netstat -ln | grep :8080
```

**3. 應用程式無法存取**
```bash
# 檢查連接埠對應
docker port pomodoro-timer

# 測試容器內服務
curl http://localhost:8080/health
```

**4. 建置時出現權限錯誤**
```bash
# 確保腳本具有執行權限
chmod +x docker/healthcheck.sh
chmod +x scripts/*.sh
```

#### 除錯技巧
```bash
# 進入容器除錯
make shell

# 檢視 Nginx 錯誤日誌
docker exec pomodoro-timer tail -f /var/log/nginx/error.log

# 檢查檔案權限
docker exec pomodoro-timer ls -la /usr/share/nginx/html
```

### 📋 Docker 快速參考

#### 容器規格
| 項目 | 正式環境 | 開發環境 |
|------|---------|---------|
| 基底映像檔 | nginx:alpine | node:18-alpine |
| 連接埠 | 8080 | 3000 |
| 使用者 | pomodoro (1001) | pomodoro (1001) |
| 健康檢查 | ✅ 每30秒 | ✅ HTTP檢查 |
| 熱重載 | ❌ | ✅ |
| 映像檔大小 | ~45MB | ~280MB |

#### 重要路徑
```bash
# 容器內路徑
/usr/share/nginx/html          # 靜態檔案
/etc/nginx/nginx.conf          # Nginx 設定
/usr/local/bin/healthcheck.sh  # 健康檢查腳本
/var/log/nginx/                # Nginx 日誌

# 本機路徑
./dist/                        # 建置輸出
./docker/                      # Docker 設定
./scripts/                     # 輔助腳本
```

#### 環境變數
```bash
NODE_ENV=production            # 正式環境
NODE_ENV=development           # 開發環境
CHOKIDAR_USEPOLLING=true      # 開發環境熱重載
```

## 🏗️ 技術架構

### 技術棧
- **前端框架**：React 18 + TypeScript
- **建置工具**：Vite
- **測試框架**：Vitest + Testing Library + jsdom
- **程式碼品質**：ESLint + TypeScript
- **容器化技術**：
  - **Docker**：應用程式容器化平台
  - **Docker Compose**：多容器服務編排
  - **Multi-stage Build**：最佳化映像檔大小的多階段建置
  - **Nginx Alpine**：輕量化 Web 伺服器
  - **Node.js Alpine**：輕量化 Node.js 執行環境
- **測試工具**：
  - **Vitest**：快速的測試執行引擎
  - **Testing Library**：React 元件測試工具  
  - **jsdom**：DOM 環境模擬
  - **Chai**：斷言程式庫
  - **TinySpy**：模擬與監聽工具
  - **V8 Coverage**：程式碼覆蓋率分析工具
  - **HTML Reporter**：視覺化覆蓋率報告

### 專案結構
```
pomodoro-timer/
├── src/                    # 原始碼目錄
│   ├── components/         # React 元件
│   │   ├── Timer/         # 計時器相關元件
│   │   ├── Settings/      # 設定面板元件
│   │   ├── Stats/         # 統計面板元件
│   │   ├── Tasks/         # 任務管理元件
│   │   └── Layout/        # 佈局元件
│   ├── core/              # 核心業務邏輯
│   │   ├── timer/         # 計時器邏輯
│   │   ├── settings/      # 設定管理
│   │   ├── stats/         # 統計追蹤
│   │   ├── task/          # 任務管理
│   │   ├── notification/  # 通知系統
│   │   └── theme/         # 主題系統
│   ├── utils/             # 工具函式
│   └── test/              # 測試檔案
├── docker/                # Docker 設定目錄
│   ├── nginx.conf         # 正式環境 Nginx 設定
│   ├── proxy-nginx.conf   # 反向代理設定
│   └── healthcheck.sh     # 健康檢查腳本
├── scripts/               # 輔助腳本
│   ├── docker-validate.sh # Docker 設定驗證
│   └── test-docker.sh     # Docker 功能測試
├── Dockerfile             # 正式環境容器定義
├── Dockerfile.dev         # 開發環境容器定義
├── docker-compose.yml     # 服務編排設定
├── docker-compose.prod.yml # 正式環境編排
├── Makefile              # Docker 操作簡化指令
└── .dockerignore         # Docker 建置忽略檔案
```

### 核心模組

- **TimerController**：管理計時器狀態與邏輯
- **SettingsManager**：處理使用者設定的儲存與讀取
- **StatsManager**：統計資料的記錄與計算
- **TaskManager**：任務的建立、編輯與管理
- **NotificationManager**：通知與音效管理
- **ThemeProvider**：主題切換與管理

## 🔧 開發指南

### 新增功能

1. 在對應的 `core/` 目錄下新增業務邏輯
2. 在 `components/` 目錄下新增 UI 元件
3. 在 `test/` 目錄下新增測試檔案
4. 更新相關的 TypeScript 型別定義

### 測試策略

本專案採用多層次測試策略，確保程式碼品質：

#### 🔬 單元測試層級
- **核心邏輯測試**：TimerController、SettingsManager 等業務邏輯
- **元件測試**：React 元件的算繪與互動
- **工具函式測試**：純函式與輔助工具

#### 🔗 整合測試層級  
- **模組整合**：不同業務模組間的協作
- **元件整合**：React 元件與業務邏輯的結合
- **資料流測試**：完整的資料傳遞鏈路

#### 🚀 端對端測試層級
- **使用者流程**：真實的使用者操作情境
- **跨平台測試**：桌上型電腦與行動裝置一致性
- **錯誤復原**：異常情況的處理能力

#### ⚡ 效能測試層級
- **算繪效能**：元件算繪速度與記憶體使用量
- **長期使用**：持續使用下的穩定性
- **儲存效能**：localStorage 操作最佳化

#### 🛡️ 品質保證
- **程式碼覆蓋率**：100% 測試通過率
- **自動化執行**：每次提交自動執行測試
- **持續整合**：確保程式碼變更不破壞現有功能

### 效能最佳化

專案已實施多項效能最佳化：
- React.memo 與 useMemo 減少不必要的重新算繪
- 事件處理器的 useCallback 最佳化
- 效能監控與測量工具
- 最佳化的本機儲存操作

## 🌐 瀏覽器支援

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📄 授權條款

本專案採用 MIT 授權條款。詳見 [LICENSE](LICENSE) 檔案。

## 🤝 貢獻指南

歡迎提交 Issue 與 Pull Request！

1. Fork 本專案
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 📞 支援與回饋

如果您在使用過程中遇到問題或有建議，請：
- 提交 [Issue](https://github.com/yukirt/pomodoro-timer/issues)
- 查看 [Wiki](https://github.com/yukirt/pomodoro-timer/wiki) 取得更多協助
- 在 [Discussions](https://github.com/yukirt/pomodoro-timer/discussions) 中參與交流

---

**享受高效的番茄工作法時間管理！** 🍅⏰