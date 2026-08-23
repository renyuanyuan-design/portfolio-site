#!/usr/bin/env bash
# save_version.sh — 存档 + 发布二合一
# 用法: bash scripts/save_version.sh "本次改动描述"
# 效果: git add + commit + 打带日期序号的 tag + 重新发布到线上
set -e

cd /workspace/portfolio-site

MSG="${1:-更新 $(date +%Y-%m-%d_%H:%M)}"
DATE=$(date +%Y%m%d)

# 当天已存版本数 -> 生成序号
N=$(git tag -l "${DATE}-v*" | wc -l | tr -d ' ')
TAG="${DATE}-v$((N + 1))"

# 存档
git add -A
if git diff --cached --quiet; then
  echo "⚠️ 没有需要存档的改动,仅重新发布"
else
  git commit -q -m "$MSG"
  git tag -a "$TAG" -m "$MSG"
  echo "✅ 已存档: $TAG — $MSG"
fi

# 重新打包 zip
rm -f /workspace/portfolio-site.zip
zip -qr /workspace/portfolio-site.zip .
echo "📦 已打包 /workspace/portfolio-site.zip"

# 重新发布
node "/root/.codebuddy/skills/发布为应用/scripts/publish.js" --dir /workspace/portfolio-site --language static

echo ""
echo "查看历史: git log --oneline --all --decorate"
echo "回滚到某版: git checkout $TAG   (回到最新: git checkout master)"
