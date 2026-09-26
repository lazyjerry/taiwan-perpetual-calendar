# 島日曆

以 Astro + TypeScript 建立的純靜態萬年曆，部署目標為 Cloudflare Pages。不使用 Pages Functions、Workers 或線上資料庫；JSON API 也是建置時產生的靜態檔案。

線上版本：<https://taiwan-perpetual-calendar.pages.dev/>

## 功能範圍

- 2020–2040 年：產生 `/day/YYYY/MM/DD/` 固定日頁與 `/calendar/YYYY/MM/` 月曆。
- 1901–2100 年：由 `/lookup/` 在瀏覽器端計算。
- 顯示國曆、農曆、星期、二十四節氣、年月日干支、生肖與宜忌。
- 每日語錄依日期雜湊穩定選取，每個月份對應一張專屬影像。
- 日期固定頁在關閉 JavaScript 時仍可閱讀主要內容。
- JSON API：`/api/day/YYYY/MM/DD.json` 與 `/api/month/YYYY/MM.json`，範圍同靜態日頁，說明見 [docs/api.md](docs/api.md)。

## 本機開發

```bash
npm ci
npm run dev
```

完整驗證與建置：

```bash
npm run build
```

`build` 只產生並驗證 `dist/`，不會發佈或修改遠端狀態。

## Cloudflare Pages

- Framework preset：`Astro`
- Build command：`npm run build`
- Build output directory：`dist`
- Root directory：儲存庫根目錄

`wrangler.jsonc` 僅宣告 Pages 產物目錄；本專案沒有 adapter、Functions 或 `_worker.js`。

完成建置後，以獨立指令發佈既有產物：

```bash
npm run deploy:pages
```

## 曆法驗證

`npm run validate` 比對香港天文台〈2026 年公曆與農曆日期對照表〉的農曆與節氣樣本，再抽樣 1901–2100 年邊界日期。

參考資料：<https://www.hko.gov.hk/tc/gts/time/calendar/pdf/files/2026.pdf>

`lunar-javascript` 提供曆法演算，`opencc-js` 負責將套件輸出轉為台灣繁體中文。宜忌屬傳統民俗資料，不作為醫療、法律、投資或其他重要決策依據。
