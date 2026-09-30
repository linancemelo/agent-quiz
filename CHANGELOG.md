# Changelog

## 1.5.0-prototype

瀏覽器裡跑 Python 的程式題原型。判題不再只靠整段原始碼字串比對。

- 新增 `runner: "pyodide"`：懶載入 Pyodide 0.27.7（jsDelivr CDN），在 Web Worker 執行學習者的 Python。
- 隱藏測試支援 assert 片段、回傳值（`kind: "return"`）、標準輸出（`kind: "stdout"`）。
- 題卡有程式編輯區、「跑跑看」（stdout／stderr）與提交後的過關回饋。逾時會中斷 worker；常見網路模組在這一輪執行裡會被擋下。
- 既有 `runner: "string"` 程式題仍以空白正規化比對，單選／多選／是非／填空／情境不變。
- 示範題在「Python 進階要點」：`b1-7`（`field_import`）、`b1-8`（`pick_http_client`）。
- 出題方式見 README「瀏覽器裡跑 Python」。

限制：測試寫在前端 JSON，熟手看得到；沙盒是教學用，不是安全邊界。Pyodide 0.27.7 是為了 classic worker（`importScripts`）；0.28 以後的 CDN 不再提供這條路徑。
