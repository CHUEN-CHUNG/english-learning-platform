#!/usr/bin/env bash
# 專案路徑含空格時，Slidev 在 Windows 上會黑屏。
# 改為同步簡報到 C:/pm-slides（無空格路徑）再啟動。
set -euo pipefail

PORT="${1:-3030}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SOURCE="$PROJECT_ROOT/docs/PM_Case_Study_Presentation.slidev.md"
TARGET_DIR="C:/pm-slides"
TARGET_FILE="$TARGET_DIR/presentation.slidev.md"

# 清除舊的 subst 映射，避免 Slidev 跑到 S: 磁碟
if command -v subst >/dev/null 2>&1; then
  subst S: /d >/dev/null 2>&1 || true
fi

if [[ ! -f "$SOURCE" ]]; then
  echo "找不到簡報檔：$SOURCE"
  exit 1
fi

mkdir -p "$TARGET_DIR"
cp -f "$SOURCE" "$TARGET_FILE"

if [[ ! -f "$TARGET_DIR/package.json" ]]; then
  cat > "$TARGET_DIR/package.json" <<'EOF'
{
  "name": "pm-slides",
  "private": true,
  "scripts": {
    "dev": "slidev presentation.slidev.md --open --port 3030"
  },
  "devDependencies": {
    "@slidev/cli": "^52.15.2",
    "@slidev/theme-default": "^0.25.0"
  }
}
EOF
fi

if [[ ! -d "$TARGET_DIR/node_modules" ]]; then
  echo "首次執行，正在 C:/pm-slides 安裝 Slidev（約 1 分鐘）..."
  (cd "$TARGET_DIR" && npm install)
fi

echo ""
echo "Slidev 簡報：$SOURCE"
echo "（已同步至 $TARGET_FILE）"
echo "瀏覽器開啟後請看 http://localhost:${PORT}/"
echo "（按 Ctrl+C 可停止）"
echo ""

(cd "$TARGET_DIR" && npx slidev presentation.slidev.md --open --port "$PORT")
