#!/usr/bin/env bash
# 以 agy（Antigravity CLI）批次生成每日語錄，補到指定總數後寫回 data/quotes.json。
#
# 用法：
#   bash scripts/generate-quotes.sh [--target 375] [--batch 40] [--model gemini-3.8-flash-high]
#
# 流程：
#   1. 讀取 data/quotes.json 既有語錄，把全部文字放進 prompt 要求不得重複。
#   2. 呼叫 agy -p 取得 structured_output.quotes（JSON schema 強制）。
#   3. 守門：字元白名單（僅 CJK 與全形標點）、簡體偵測（opencc-js cn→tw）、
#      長度 8–30 字、標籤限既有詞彙、與既有及本批文字去重。
#   4. 通過者接續編號寫回；每批寫回一次，中斷後重跑會從目前筆數續補。
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
quotes_file="$project_root/data/quotes.json"

target=375
batch=40
model="gemini-3.8-flash-high"
max_rounds=30
agy_timeout="240s"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target) target="$2"; shift 2 ;;
    --batch) batch="$2"; shift 2 ;;
    --model) model="$2"; shift 2 ;;
    --max-rounds) max_rounds="$2"; shift 2 ;;
    *) echo "未知參數：$1" >&2; exit 2 ;;
  esac
done

command -v agy >/dev/null || { echo "找不到 agy，請先安裝 Antigravity CLI。" >&2; exit 1; }
command -v node >/dev/null || { echo "找不到 node。" >&2; exit 1; }
[[ -f "$quotes_file" ]] || { echo "找不到 $quotes_file" >&2; exit 1; }

work_dir="$(mktemp -d)"
trap 'rm -rf "$work_dir"' EXIT

schema_file="$work_dir/schema.json"
cat > "$schema_file" <<'EOF'
{"type":"object","properties":{"quotes":{"type":"array","items":{"type":"object","properties":{"text":{"type":"string"},"tag":{"type":"string"}},"required":["text","tag"]}}},"required":["quotes"]}
EOF

tags="平靜、生活、行動、創意、關係、日常、成長、專注、勇氣、反思、取捨、休息、學習、感恩、界線、自在、整理、好奇"

count_quotes() {
  node -e 'const q=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));console.log(q.length)' "$quotes_file"
}

build_prompt() {
  local need="$1"
  local existing
  existing="$(node -e 'const q=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));console.log(q.map(x=>x.text).join("\n"))' "$quotes_file")"
  cat <<EOF
你是台灣的文案作者。請原創 ${need} 句「每日語錄」，供日曆網站每天顯示一句。

要求：
- 繁體中文、台灣用語，禁止簡體字與中國大陸用語。
- 每句 14 到 24 個字，一句完整的話，語氣溫和、貼近生活，不說教、不用驚嘆號。
- 只用全形標點（，。、「」：？），不用英文、數字、表情符號、引號以外的符號。
- 每句附一個標籤，只能從這些詞挑一個：${tags}。標籤盡量平均分配。
- 不得與下方「既有語錄」重複或高度相似（換幾個字、換語序都算相似），彼此之間也不得相似。
- 只輸出 JSON，不加說明。
- 不得使用任何工具、不得執行指令、不得讀寫檔案；直接在回覆中輸出結果。

既有語錄（請避開）：
${existing}
EOF
}

merge_batch() {
  # 讀 agy 輸出，守門後合併進 quotes.json；印出「接受/拒絕」統計。
  node - "$quotes_file" "$1" "$project_root" <<'EOF'
const fs = require('fs');
const path = require('path');
const [quotesFile, outFile, projectRoot] = process.argv.slice(2);
const OpenCC = require(path.join(projectRoot, 'node_modules/opencc-js'));
const toTw = OpenCC.Converter({ from: 'cn', to: 'tw' });

const allowedTags = new Set('平靜、生活、行動、創意、關係、日常、成長、專注、勇氣、反思、取捨、休息、學習、感恩、界線、自在、整理、好奇'.split('、'));
// 只放行 CJK 漢字、CJK 標點、全形標點、破折號與刪節號；其餘一律視為污染。
const allowed = /^[一-鿿㐀-䶿　-〿＀-￯—…]+$/u;
const normalize = (s) => s.replace(/[　-〿＀-￯—…]/gu, '').replace(/臺/gu, '台');
// 簡繁一對多的共用字（念／唸、只／隻、后／後…）在台灣繁體裡本身就合法，
// OpenCC cn→tw 會把它們再換一次而誤判，逐字比對時放行。
const sharedChars = new Set(Array.from('只念干后面里云系台制志周征松借布采划冲舍余于几向咸准秋谷范表丑才家回困卷克蒙折致朱御愿岳筑症沾游郁它升涂么'));
const simplifiedChars = (text) =>
  Array.from(text).filter((c) => !sharedChars.has(c) && toTw(c) !== c);

const quotes = JSON.parse(fs.readFileSync(quotesFile, 'utf8'));
const seen = new Set(quotes.map((q) => normalize(q.text)));

let raw;
try {
  raw = JSON.parse(fs.readFileSync(outFile, 'utf8'));
} catch (error) {
  console.error(`agy 輸出不是 JSON：${error.message}`);
  process.exit(3);
}
if (raw.status && raw.status !== 'SUCCESS') {
  console.error(`agy 回報狀態 ${raw.status}`);
  process.exit(3);
}

// agy 會先在 response 寫出 JSON 陣列（鍵名可能是 quote 或 text），
// 再由第二個 turn 轉成 structured_output；後者偶爾失效（只剩一筆或回填 prompt），
// 所以兩邊都解析，取有效筆數多的那一份。
const pickItems = (list) =>
  Array.isArray(list)
    ? list
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({ text: item.text ?? item.quote ?? '', tag: item.tag ?? '' }))
        .filter((item) => typeof item.text === 'string' && item.text.trim())
    : [];
const fromStructured = pickItems(raw.structured_output?.quotes);
const parseResponseArray = (response) => {
  if (typeof response !== 'string') return [];
  const fenced = response.match(/```(?:json)?\s*([\s\S]*?)```/u);
  const candidates = [];
  if (fenced) candidates.push(fenced[1]);
  const start = response.indexOf('[');
  const end = response.indexOf('\n]', start);
  if (start >= 0 && end > start) candidates.push(response.slice(start, end + 2));
  if (start >= 0) candidates.push(response.slice(start, response.lastIndexOf(']') + 1));
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) return parsed;
      if (Array.isArray(parsed?.quotes)) return parsed.quotes;
    } catch {
      // 試下一個候選
    }
  }
  return [];
};
const fromResponse = pickItems(parseResponseArray(raw.response));
const incoming = fromResponse.length > fromStructured.length ? fromResponse : fromStructured;
if (!incoming.length) {
  const denied = (raw.denied_actions ?? []).map((a) => a.display_name ?? a.action).join(', ');
  console.error(`agy 輸出解析不到任何語錄${denied ? `（被拒絕的工具：${denied}）` : ''}`);
  process.exit(3);
}
console.log(`  來源：${incoming === fromResponse ? 'response' : 'structured_output'}（structured ${fromStructured.length} 筆、response ${fromResponse.length} 筆）`);

const rejected = [];
let nextId = quotes.length ? Math.max(...quotes.map((q) => q.id)) + 1 : 1;
for (const item of incoming) {
  const text = String(item.text ?? '').trim();
  const tag = String(item.tag ?? '').trim();
  const chars = Array.from(text).length;
  const simplified = simplifiedChars(text);
  let reason = '';
  if (!text) reason = '空白';
  else if (!allowed.test(text)) reason = '含白名單以外字元';
  else if (simplified.length) reason = `疑似簡體字 ${simplified.join('')}`;
  else if (chars < 8 || chars > 30) reason = `長度 ${chars}`;
  else if (!allowedTags.has(tag)) reason = `標籤 ${tag} 不在詞彙表`;
  else if (seen.has(normalize(text))) reason = '重複';
  if (reason) {
    rejected.push(`${reason}：${text}`);
    continue;
  }
  seen.add(normalize(text));
  quotes.push({ id: nextId, text, tags: [tag] });
  nextId += 1;
}

const body = quotes.map((q) => `  ${JSON.stringify(q)}`).join(',\n');
fs.writeFileSync(quotesFile, `[\n${body}\n]\n`);
console.log(`接受 ${incoming.length - rejected.length}／${incoming.length}，目前共 ${quotes.length} 則`);
for (const line of rejected) console.log(`  拒絕 ${line}`);
EOF
}

round=0
while :; do
  current="$(count_quotes)"
  if (( current >= target )); then
    echo "已達 ${current} 則（目標 ${target}），完成。"
    break
  fi
  round=$((round + 1))
  if (( round > max_rounds )); then
    echo "超過 ${max_rounds} 輪仍未達標（目前 ${current} 則），中止。" >&2
    exit 1
  fi
  need=$(( target - current ))
  (( need > batch )) && need="$batch"
  echo "第 ${round} 輪：目前 ${current} 則，向 agy 要 ${need} 則…"

  prompt_file="$work_dir/prompt-$round.txt"
  out_file="$work_dir/out-$round.json"
  err_file="$work_dir/err-$round.txt"
  build_prompt "$need" > "$prompt_file"

  # 在暫存目錄執行，避免 agy 讀寫專案。headless 模式下工具權限會被自動拒絕而
  # 回傳空輸出，所以靠 prompt 明說不得使用工具（--mode plan 在停用 slash command
  # 時無效）。失敗只記錄並進下一輪。
  if ! (cd "$work_dir" && NODE_OPTIONS='--no-deprecation' agy -p "$(cat "$prompt_file")" \
        --output-format json --json-schema "$schema_file" \
        --disable-slash-commands --model "$model" --print-timeout "$agy_timeout" \
        > "$out_file" 2> "$err_file"); then
    echo "  agy 執行失敗，stderr：" >&2
    sed 's/^/    /' "$err_file" >&2
    continue
  fi
  merge_batch "$out_file" || echo "  本輪輸出無法合併，略過。" >&2
done
