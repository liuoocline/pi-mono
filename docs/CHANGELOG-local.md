# Pi-Mono 本地变更分析文档

> 生成时间：2026-02-13
> 基于分支：main（相对于 upstream/main 的本地修改）

---

## 变更概览

本次变更涉及 42 个文件，其中：

- **实质内容变更**：6 个文件（新增模型、价格更新、代码风格调整）
- **仅换行符差异（LF → CRLF）**：36 个文件（Windows 环境导致，无逻辑变更）

---

## 一、模型注册表更新（models.generated.ts）

**文件**：`packages/ai/src/models.generated.ts`
**变更量**：+437 行 / -231 行

### 1.1 新增模型

| 模型 ID | 名称 | Provider | 特性 |
|---------|------|----------|------|
| `z-ai/glm-5` | Z.ai: GLM 5 | OpenRouter | reasoning, 202K 上下文, 131K 输出 |
| `minimax/minimax-m2.5` | MiniMax M2.5 | Vercel AI Gateway | reasoning, 204K 上下文, 131K 输出 |
| `zai/glm-5` | GLM-5 | Vercel AI Gateway | reasoning, 202K 上下文, 131K 输出 |
| `glm-5` | GLM-5 | Z.AI 直连 | reasoning, 204K 上下文, 131K 输出, zai thinking 格式 |

### 1.2 模型更新

| 模型 | 变更内容 |
|------|---------|
| `deepseek/deepseek-r1` (Vercel) | 价格下调：input 0.30→0.21, output 1.00→0.79 |
| `deepseek/deepseek-v3.2-exp` → `deepseek/deepseek-v3.2` | 重命名，关闭 reasoning，上下文 163K→128K，maxTokens 163K→8K，新增 cacheRead 定价 |
| `o3` (Vercel) | cacheRead 0.125→0.13 |
| `z-ai/glm-4.6v` | 名称修正 Z.AI → Z.ai |
| `z-ai/glm-4.7` | 名称修正 Z.AI → Z.ai |
| `z-ai/glm-4.7-flash` | 名称修正 Z.AI → Z.ai |

### 1.3 其他模型变更

- 多个 OpenRouter/Vercel 模型的上下文窗口、定价、maxTokens 等参数更新
- 新增多个 provider 的模型条目（详见 diff）

---

## 二、代码风格调整（缩进：空格 → Tab）

以下文件的缩进风格从 2-space 改为 tab，**无逻辑变更**：

| 文件 | 行数变更 |
|------|---------|
| `packages/ai/src/providers/google-gemini-cli.ts` | ~1735 行（重新格式化） |
| `packages/ai/src/providers/google-vertex.ts` | ~865 行（重新格式化） |
| `packages/ai/src/providers/google.ts` | ~837 行（重新格式化） |
| `packages/ai/src/providers/openai-responses-shared.ts` | ~847 行（重新格式化） |
| `packages/ai/src/utils/json-parse.ts` | ~192 行（重新格式化） |

---

## 三、仅换行符差异的文件（CRLF）

以下文件仅有 LF → CRLF 换行符差异，无代码逻辑变更：

### packages/ai/src/providers/
- `amazon-bedrock.ts`
- `anthropic.ts`
- `github-copilot-headers.ts`
- `openai-completions.ts`
- `openai-responses.ts`
- `simple-options.ts`

### packages/ai/src/
- `types.ts`

### packages/ai/test/
- `chinese-quotes-json-parse.test.ts`
- `context-overflow.test.ts`
- `github-copilot-anthropic.test.ts`
- `interleaved-thinking.test.ts`
- `stream.test.ts`
- `tokens.test.ts`
- `transform-messages-copilot-openai-to-anthropic.test.ts`

### packages/coding-agent/
- `examples/extensions/trigger-compact.ts`
- `src/cli/args.ts`
- `src/core/agent-session.ts`
- `src/core/extensions/index.ts`
- `src/core/extensions/runner.ts`
- `src/core/extensions/types.ts`
- `src/core/model-resolver.ts`
- `src/index.ts`
- `src/main.ts`
- `src/modes/interactive/components/footer.ts`
- `src/modes/interactive/interactive-mode.ts`
- `src/modes/rpc/rpc-mode.ts`
- `src/utils/git.ts`
- `src/utils/tools-manager.ts`
- `test/git-ssh-url.test.ts`
- `test/model-resolver.test.ts`
- `test/package-manager-ssh.test.ts`
- `test/package-manager.test.ts`

### packages/tui/
- `src/autocomplete.ts`
- `src/tui.ts`
- `test/autocomplete.test.ts`

### packages/web-ui/
- `src/dialogs/ModelSelector.ts`

---

## 四、影响评估

| 维度 | 评估 |
|------|------|
| **功能影响** | 新增 GLM-5、MiniMax M2.5 模型支持；DeepSeek V3.2 参数修正 |
| **价格影响** | DeepSeek R1 降价约 30%；DeepSeek V3.2 从实验版转正式版 |
| **兼容性** | 无破坏性变更，仅新增和更新模型定义 |
| **代码质量** | 部分文件缩进风格统一为 tab（与上游保持一致） |
| **风险** | 低风险。CRLF 变更建议配置 `.gitattributes` 避免 |

---

## 五、建议

1. **CRLF 问题**：建议在 pi-mono 中配置 `git config core.autocrlf input` 避免 Windows 环境下自动转换换行符
2. **模型更新**：GLM-5 和 MiniMax M2.5 为新增模型，部署后即可使用
3. **DeepSeek V3.2**：从实验版（`-exp`）转为正式版，注意 `reasoning` 已关闭、maxTokens 大幅缩减
