# Agent Quiz v1.4.0 Changelog

**Date:** 2026-09-30 (Asia/Taipei)  
**Scope:** Content feature — new MCP quiz unit grounded only in teaching note `07-advanced/05-mcp.md`. No vite base / Pages / deploy changes.

## Content

### New unit: `07-advanced-05-mcp`（MCP）
8 questions (`mcp-1` … `mcp-8`), playful Traditional Chinese, note-faithful:

| Id | Type | Topic |
|----|------|-------|
| mcp-1 | single | USB-C 比喻／標準化工具與資料 |
| mcp-2 | multi | vs in-process LangChain／LangGraph Tools |
| mcp-3 | single | Host／Client／Server 三角色 |
| mcp-4 | scenario | Tools／Resources／Prompts 誰驅動 |
| mcp-5 | single | Spec `2026-07-28`；`mcp[cli]`／`MCPServer` |
| mcp-6 | multi | Claude Desktop、Cursor mcp.json、LangChain MCPAdapter beta |
| mcp-7 | multi | 常見坑（stdout print、FastMCP、Adapter≠寫 Server） |
| mcp-8 | boolean | MCPAdapter 主打 tools；prompts／resources 尚未一等包裝 |

### Curriculum
- Advanced module `unitIds` append `07-advanced-05-mcp`（order after eval-deploy）
- Module blurb 補上 MCP

### Version
- Footer shows `v1.4.0`; `package.json` → `1.4.0`

## Files touched

| File | Change |
|------|--------|
| `src/data/units/07-advanced-05-mcp.json` | **new** unit + 8 questions |
| `src/data/curriculum.json` | wire unit; blurb |
| `src/components/Layout.tsx` | Footer v1.4.0 |
| `package.json` | version 1.4.0 |

## Not changed
- `src/data/index.ts` — units loaded via `import.meta.glob`（no explicit import）
- Vite base / Pages / deploy
- GitHub push（cloud agent handles separately）
