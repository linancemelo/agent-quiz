# Agent 速成班｜互動測驗

類似 [fastapiinteractive.com](https://fastapiinteractive.com) 體驗的 **繁體中文** 互動測驗 SPA：

學習地圖 → 單元說明 → 一步一題 → 即時回饋 → 進度／錯題重做 → 模組學習證明。

題庫只根據 `agent_learning/`（Notion「Agent速成班」）筆記事實出題，不捏造內容。

## 技術棧

- React 18+ / Vite / TypeScript
- Zustand（測驗狀態 + 進度）
- Tailwind CSS + shadcn 風格元件
- React Router
- 純前端判題；`localStorage` 持久化（無後端）

## 啟動

```bash
cd /workspace/agent-quiz
npm install
npm run dev
```

瀏覽器打開終端機顯示的本機網址（通常是 `http://localhost:5173`）。

## 建置

```bash
npm run build
npm run preview   # 預覽正式建置
```

## 題庫來源

- 來源目錄：`/workspace/agent_learning/`（與 Notion「Agent速成班」相同內容）
- 單元 JSON：`src/data/units/*.json`
- 課表：`src/data/curriculum.json`
- 涵蓋：`01-basics`～`07-advanced` 全部概念筆記 + `projects/*/README.md`
- 排除：`SOURCES*`、`_notion_payloads`、`市場觀察`；`00-overview`／`learning_map` 僅作模組標題參考

每單元約 5–8 題，混合至少兩種題型（單選／多選／是非／填空／情境／程式碼字串比對）。

## 路由

| 路徑 | 說明 |
|------|------|
| `/` | 學習地圖 |
| `/modules/:moduleId` | 單元列表 |
| `/units/:unitId` | 單元說明 + 開始測驗 |
| `/units/:unitId/quiz` | 一步一題（`?mode=wrong` 只練錯題） |
| `/units/:unitId/result` | 結果與錯題 |
| `/progress` | 全站進度 + 錯題本 |
| `/certificate/:moduleId` | 模組全通關後的本地證明 |

## 設計語氣

UI 走活潑、溫暖路線：漸層、微動畫、慶祝回饋與俏皮空狀態——但判題與內容仍嚴謹。

## 授權與注意

- 進度與證明僅存在瀏覽器 `localStorage`（鍵前綴 `agent-quiz:`）
- 證明序號格式：`AQ-` + 時間戳短碼
