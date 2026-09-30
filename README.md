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

每單元約 5–8 題，混合至少兩種題型（單選／多選／是非／填空／情境／程式碼）。程式題有兩種判法：`runner: "string"` 比對空白正規化後的原文，`runner: "pyodide"` 在瀏覽器裡真的跑 Python。

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

## 瀏覽器裡跑 Python（Pyodide）

`runner: "pyodide"` 的程式題會懶載入 [Pyodide](https://pyodide.org)（CDN `0.27.7`，不進 MCQ 的初次下載）。學習者按「跑跑看」看 stdout／stderr，按「提交看看」才跑隱藏測試。沒有後端。

示範在單元「Python 進階要點」最後兩題（`b1-7`、`b1-8`）：

`/units/01-basics-01-python-advanced/quiz`

（正式站路徑前面還有 Vite `base`：`/agent-quiz/`。）

### 怎麼出一題

```json
{
  "id": "example-1",
  "type": "code",
  "language": "python",
  "runner": "pyodide",
  "prompt": "寫函式 double(n)，回傳 n 的兩倍。",
  "starter": "def double(n):\n    raise NotImplementedError\n",
  "publicHint": "函式名稱要叫 double。",
  "timeout": 8000,
  "tests": [
    { "kind": "return", "name": "double(2)", "expr": "double(2)", "expected": 4 },
    "assert double(0) == 0",
    { "kind": "stdout", "name": "印出 hi", "code": "print('hi')", "expected": "hi" }
  ],
  "explanation": "回傳值用測試比，不比對整段原始碼。",
  "sourceNote": "01-basics/01-python-advanced.md"
}
```

- `tests` 可以是字串（當成 assert 片段），或 `{ kind: "assert" | "return" | "stdout", ... }`。
- `return` 的 `expected` 是 JSON。Python 端用 `json.loads` 後以 `==` 比較（所以是 list，不是 tuple）。
- `stdout` 會忽略結尾的一個換行。
- `timeout` 毫秒，預設 8000，會被限制在 500–30000。逾時會中斷 worker。
- `publicHint` 會顯示；`tests` 不會。原型仍把測試放在前端 JSON，熟手看得到原始碼。
- 沙盒會擋常見網路／系統模組（`socket`、`urllib`、`js` 等）。這是教學用隔離，不是安全邊界。
- 舊題保持 `"runner": "string"` 與 `"match": "normalize_whitespace"`，判題方式不變。

## 設計語氣

UI 走活潑、溫暖路線：漸層、微動畫、慶祝回饋與俏皮空狀態——但判題與內容仍嚴謹。

## 授權與注意

- 進度與證明僅存在瀏覽器 `localStorage`（鍵前綴 `agent-quiz:`）
- 證明序號格式：`AQ-` + 時間戳短碼
