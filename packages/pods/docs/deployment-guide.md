# OpenClaw NVIDIA 部署指南

> 整合自 Claude Code 项目记忆，供新电脑部署参考

---

## 一、环境架构

| 环境         | 系统               | 用途                   | 路径                      |
| ------------ | ------------------ | ---------------------- | ------------------------- |
| **开发环境** | Windows            | 代码修改、pi-mono 构建 | `e:/CursorRules/openclaw` |
| **运行环境** | WSL Ubuntu / Linux | Gateway 运行           | `~/openclaw-new`          |

**关键限制**：pi-mono 子模块**必须在 Windows 上构建**，不能在 WSL/Linux 上构建。

**Fork 仓库**：`https://github.com/liuoocline/openclaw.git`

---

## 二、NVIDIA 模型配置

配置文件位置：

- Windows 开发环境：`e:/CursorRules/openclaw/docs/Configs/openclaw-nvidia.json`
- WSL Ubuntu 运行环境：`~/.openclaw/openclaw.json`（系统配置，两个环境需分别修改）

### 已配置模型

| 模型 ID                  | 别名    | 上下文窗口 | 输入        |
| ------------------------ | ------- | ---------- | ----------- |
| `qwen/qwen3.5-397b-a17b` | qwen3.5 | 128K       | text, image |
| `z-ai/glm5`              | glm5    | 205K       | text        |
| `z-ai/glm4.7`            | glm4.7  | 128K       | text        |
| `moonshotai/kimi-k2.5`   | kimi2.5 | 128K       | text, image |

### Provider 配置要点

```json
{
  "models": {
    "mode": "merge",
    "providers": {
      "custom-integrate-api-nvidia-com": {
        "baseUrl": "https://integrate.api.nvidia.com/v1",
        "apiKey": "nvapi-YOUR_API_KEY",
        "api": "openai-completions",
        "models": [...]
      }
    }
  }
}
```

- **api 必须设为 `"openai-completions"`**
- 默认主模型：`custom-integrate-api-nvidia-com/z-ai/glm5`
- 上下文修剪模式：`cache-ttl`（TTL 3 分钟）
- 压缩模式：`safeguard`（reserveTokensFloor: 10000）

---

## 三、已知问题与修复

### Qwen 3.5 "Message ordering conflict" 错误

**现象**：Kimi2.5 和 GLM5 正常，Qwen 3.5 报 "Message ordering conflict - please try again"

**根因**：`src/agents/transcript-policy.ts` 中 `isOpenAi` 判断逻辑缺陷，导致 NVIDIA 提供商的消息轮次验证（`validateGeminiTurns` 和 `validateAnthropicTurns`）被禁用。Qwen 3.5 严格要求 user/assistant 角色交替。

**修复**：添加 `isOpenAiCompatibleThirdParty` 标志，为所有使用 OpenAI 兼容 API 的第三方提供商启用轮次验证。

修改文件及提交记录：

**pi-mono 提交** (`0ff2653b`):

- `packages/ai/src/providers/openai-completions.ts` — `detectCompat()` 添加 NVIDIA 检测（`isNvidia`），将 NVIDIA 标记为非标准提供商：
  - `supportsDeveloperRole: false` → 使用 `system` 角色替代 `developer`（**根因修复**）
  - `supportsStore: false` → 不发送 NVIDIA 不支持的 `store` 参数
  - `useMaxTokens: true` → 使用 `max_tokens` 替代 `max_completion_tokens`
  - `supportsReasoningEffort: false` → 不发送 `reasoning_effort`
  - `thinkingFormat: "qwen"` → 对 Qwen 模型使用 `enable_thinking` 参数
  - 新增 `repairRoleOrdering()` 函数：合并所有被跳过/过滤后产生的连续同角色消息

**openclaw 提交** (`e932916a2`):

- `src/agents/transcript-policy.ts` — 添加 `isOpenAiCompatibleThirdParty` 标志，为 NVIDIA 等第三方 OpenAI 兼容提供商启用 `validateGeminiTurns` 和 `validateAnthropicTurns`
- `src/agents/transcript-policy.test.ts` — 新增 NVIDIA、Qianfan、OpenAI 行为验证测试

---

## 四、部署流程（Windows → 新电脑）

### 步骤 1：Windows 开发环境构建

```powershell
cd e:/CursorRules/openclaw

# 安装依赖
pnpm install

# 构建 pi-mono 子模块（必须在 Windows 上）
cd pi-mono
pnpm install
pnpm build
cd ..

# 构建 OpenClaw
pnpm build
```

### 步骤 2：打包部署文件

```powershell
# 创建部署包（包含 dist 和 pi-mono 构建产物）
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
tar -czf "openclaw-full-$timestamp.tar.gz" `
  "dist" `
  "pi-mono\packages\ai\dist" `
  "pi-mono\packages\coding-agent\dist" `
  "pi-mono\packages\agent\dist" `
  "pi-mono\packages\tui\dist" `
  "package.json" `
  "pnpm-lock.yaml" `
  "docs\Configs\openclaw-nvidia.json"

# 传输到中转目录（根据实际路径调整）
Copy-Item openclaw-full-*.tar.gz D:\Cursor-AI\
```

### 步骤 3：新电脑部署（Linux/WSL）

#### 首次部署

```bash
# 1. 克隆 fork 仓库
git clone https://github.com/liuoocline/openclaw.git ~/openclaw-new
cd ~/openclaw-new

# 2. 解压构建产物（覆盖源码中的 dist 目录）
tar -xzf /path/to/openclaw-full-YYYYMMDD-HHMMSS.tar.gz

# 3. 安装依赖
pnpm install
```

#### 后续更新

```bash
cd ~/openclaw-new

# 1. 拉取最新源码
git pull origin main

# 2. 备份当前构建产物
mv dist dist.backup.$(date +%Y%m%d-%H%M%S) 2>/dev/null

# 3. 解压新的构建产物
tar -xzf /path/to/openclaw-full-YYYYMMDD-HHMMSS.tar.gz

# 4. 重新安装依赖
pnpm install

# 5. 重启 Gateway
pkill -9 -f openclaw-gateway || true
nohup node dist/cli/daemon-cli.js gateway run --bind loopback --port 18789 --force > /tmp/openclaw-gateway.log 2>&1 &
```

### 步骤 4：配置

```bash
# 复制 NVIDIA 配置文件
mkdir -p ~/.openclaw
cp docs/Configs/openclaw-nvidia.json ~/.openclaw/openclaw.json

# 编辑配置：替换 API Key 和 Discord Token 为真实值
vim ~/.openclaw/openclaw.json
```

**必须修改的配置项**：

- `models.providers.custom-integrate-api-nvidia-com.apiKey` → 真实 NVIDIA API Key
- `channels.discord.token` → 真实 Discord Bot Token
- `agents.defaults.workspace` → 新电脑的工作目录路径
- `gateway.auth.token` → 网关认证 Token

### 步骤 5：启动 Gateway

```bash
# 启动网关
node dist/cli/daemon-cli.js gateway start

# 或使用 nohup 后台运行
nohup node dist/cli/daemon-cli.js gateway run --bind loopback --port 18789 --force > /tmp/openclaw-gateway.log 2>&1 &
```

### 步骤 6：验证

```bash
# 检查版本
cat dist/build-info.json

# 检查 pi-mono 构建产物
ls -lh pi-mono/packages/ai/dist/
ls -lh pi-mono/packages/coding-agent/dist/

# 检查网关状态
ss -ltnp | grep 18789

# 查看日志
tail -f /tmp/openclaw-gateway.log
```

---

## 五、更新流程

当代码有新修改时，直接在 main 分支操作：

1. Windows 上修改代码、构建（`pnpm build`）
2. 提交推送到 fork（`git push my-fork main`）
3. 新电脑拉取最新代码：`cd ~/openclaw-new && git pull my-fork main`
4. 解压新的构建产物（如有需要）
5. 重新安装依赖：`pnpm install`
6. 重启 Gateway

---

## 六、Git 操作速查

```bash
# Fork 仓库添加远程
git remote add my-fork https://github.com/liuoocline/openclaw.git

# 推送到 fork（直接使用 main 分支）
git push my-fork main

# 从 fork 拉取
git pull my-fork main

# 跳过 Git Hooks 提交
git commit -m "fix: message" --no-verify
```

---

## 七、重要提醒

1. **不要直接在 Windows 开发机器执行 `openclaw` 命令** — 需要在运行环境执行
2. **pi-mono 不能在 Linux/WSL 上构建** — 必须 Windows 构建后传输
3. **配置文件位置不同** — Windows 和 Linux 分别修改
4. **修改配置后必须重启 Gateway**
5. **实际运行目录是 `~/openclaw-new`** — 不是 `~/openclaw`
6. **NVIDIA API Key 不要提交到 Git** — 只在运行环境的 `~/.openclaw/openclaw.json` 中配置

cd ~/openclaw-new
tar -xzf /mnt/d/Cursor-AI/openclaw-full-20260220-215544.tar.gz
pnpm install
pkill -9 -f openclaw-gateway || true
nohup node dist/cli/daemon-cli.js gateway run --bind loopback --port 18789 --force > /tmp/openclaw-gateway.log 2>&1 &
