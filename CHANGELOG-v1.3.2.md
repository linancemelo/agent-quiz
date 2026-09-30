# Agent Quiz v1.3.2 Changelog

**Date:** 2026-09-30 (Asia/Taipei)  
**Scope:** Content-only thicken of Multi-Agent unit (`07-advanced-01-multi-agent`); no app logic, deploy, or vite base changes.

## Content

### Multi-Agent unit: +5 questions (a1-6 … a1-10)
Grounded only in `agent_learning/07-advanced/01-multi-agent.md`. Covers product gaps missing from the prior 5 checkpointer-/schema-heavy items:

| Id | Type | Topic |
|----|------|-------|
| a1-6 | scenario | Supervisor 串 research → critique（練習題 1） |
| a1-7 | single | 共享 MessagesState／keys → `add_node(compiled_subgraph)`（練習題 2） |
| a1-8 | boolean | 子代理包成 tool／handoff |
| a1-9 | single | 父圖必須有 checkpointer 才完整支援 interrupt／`get_state(..., subgraphs=True)` |
| a1-10 | boolean | tool 閉包呼叫子圖時靜態發現可能失敗 |

Lesson blurb lightly expanded with the same note-backed bullets (no MCP invented).

Skipped (already quizzed or outside notes): per-thread parallel warning (a1-1), default per-invocation memory (a1-2), blog-only community links, MCP.

### Version
- Footer shows `v1.3.2`; `package.json` → `1.3.2`

## Files touched

| File | Change |
|------|--------|
| `src/data/units/07-advanced-01-multi-agent.json` | +5 questions; lesson markdown thicken |
| `src/components/Layout.tsx` | Footer v1.3.2 |
| `package.json` | version 1.3.2 |
