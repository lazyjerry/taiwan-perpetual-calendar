# 島日曆 JSON API

島日曆是純靜態站台，API 也是建置時預先產生的 JSON 檔案，由 Cloudflare Pages 直接提供。沒有 Pages Functions、沒有查詢參數，也沒有伺服器端運算。

- Base URL：`https://taiwan-perpetual-calendar.pages.dev`
- 時區：所有日期以 `Asia/Taipei` 為準。
- 支援範圍：2020-01-01 至 2040-12-31（與靜態日頁相同）。範圍外的日期不會有對應檔案，回應為 404。
- 編碼：UTF-8，`Content-Type: application/json`。
- CORS：`Access-Control-Allow-Origin: *`，瀏覽器可直接跨網域讀取。
- 快取：`Cache-Control: public, max-age=86400`。
- 版本：`version: 1`。欄位只增不減；若有不相容變更會提升版本號並另開路徑。

## 端點

| 端點 | 說明 |
|---|---|
| `GET /api/index.json` | API 索引：版本、支援範圍與端點樣式。 |
| `GET /api/day/{YYYY}/{MM}/{DD}.json` | 單日資料。月、日固定兩位數零填補。 |
| `GET /api/month/{YYYY}/{MM}.json` | 整月資料，`days` 為該月每一天的單日資料。 |

沒有「今日」端點：靜態檔案無法知道請求當下的日期。請由用戶端以台灣時區算出今天的日期，再組出單日端點路徑。

## 範例

```bash
curl https://taiwan-perpetual-calendar.pages.dev/api/day/2026/09/26.json
```

```json
{
  "date": "2026-09-26",
  "year": 2026,
  "month": 9,
  "day": 26,
  "weekday": "星期六",
  "lunar": {
    "year": 2026,
    "month": 8,
    "day": 16,
    "isLeapMonth": false,
    "yearText": "二〇二六",
    "monthText": "八",
    "dayText": "十六",
    "display": "八月十六"
  },
  "ganzhi": { "year": "丙午", "month": "丁酉", "day": "癸卯" },
  "zodiac": "馬",
  "solarTerm": null,
  "almanac": {
    "yi": ["破屋", "壞垣", "求醫", "治病", "餘事勿取"],
    "ji": ["移徙", "入宅"]
  },
  "quote": { "id": 265, "text": "感謝那些磨練你的時刻，它們讓你長成了如今的模樣。", "tags": ["成長"] },
  "image": { "id": 9, "month": 9, "file": "/images/daily/months/09.webp", "alt": "九月初白芒草與清朗山谷", "theme": "autumn" },
  "links": {
    "page": "/day/2026/09/26/",
    "api": "/api/day/2026/09/26.json",
    "month": "/api/month/2026/09.json",
    "previous": "/api/day/2026/09/25.json",
    "next": "/api/day/2026/09/27.json"
  }
}
```

## 單日資料欄位

| 欄位 | 型別 | 說明 |
|---|---|---|
| `date` | string | `YYYY-MM-DD`。 |
| `year` / `month` / `day` | number | 國曆年月日。 |
| `weekday` | string | 中文星期，例如「星期六」。 |
| `lunar.year` / `lunar.month` / `lunar.day` | number | 農曆年月日；閏月時 `month` 為正數，由 `isLeapMonth` 標示。 |
| `lunar.isLeapMonth` | boolean | 是否為閏月。 |
| `lunar.yearText` / `lunar.monthText` / `lunar.dayText` | string | 農曆中文寫法。十一、十二月以「十一」「十二」表示，不用「冬」「臘」。 |
| `lunar.display` | string | 組合後的顯示字串，例如「閏二月初三」。 |
| `ganzhi.year` / `ganzhi.month` / `ganzhi.day` | string | 年、月、日干支。 |
| `zodiac` | string | 生肖。 |
| `solarTerm` | string \| null | 當日節氣名稱；非節氣日為 `null`。 |
| `almanac.yi` / `almanac.ji` | string[] | 宜、忌完整清單（網頁只顯示前 8 項）。可能為空陣列。 |
| `quote` | object | 當日語錄，依日期穩定選取，同一天固定同一則。 |
| `image` | object | 當月影像，`file` 為站台相對路徑，需自行加上 Base URL。 |
| `links.page` | string | 對應的網頁路徑。 |
| `links.api` | string | 本筆資料的 API 路徑。 |
| `links.month` | string | 所屬月份的 API 路徑。 |
| `links.previous` / `links.next` | string \| null | 前一天、後一天的 API 路徑；超出支援範圍時為 `null`。 |

## 整月資料欄位

| 欄位 | 型別 | 說明 |
|---|---|---|
| `year` / `month` | number | 國曆年月。 |
| `links.page` | string | 對應的月曆網頁路徑。 |
| `links.api` | string | 本筆資料的 API 路徑。 |
| `links.previous` / `links.next` | string \| null | 上、下個月的 API 路徑；超出支援範圍時為 `null`。 |
| `days` | DayPayload[] | 該月每一天，欄位同單日資料。 |

## 資料來源與限制

- 曆法演算來自 `lunar-javascript`，輸出經 `opencc-js` 轉為台灣繁體中文；每次建置會比對香港天文台 2026 年對照表樣本。
- 宜忌屬傳統民俗資料，不作為醫療、法律、投資或其他重要決策依據。
- 資料由建置決定，內容更新時整批重新產生；不保證單筆資料在重新建置後位元組完全相同（例如語錄語料調整）。

## 產出方式

端點原始碼在 `src/pages/api/`，資料組裝在 `src/lib/api.ts`。`npm run build` 會一併產生所有 JSON，`scripts/verify-dist.sh` 檢查關鍵檔案存在且可解析。
