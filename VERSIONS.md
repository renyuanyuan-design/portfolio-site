# 版本记录 (VERSIONS)

本站点用 git 管理版本。每次有意义的改动都会生成一个 commit + 一个 annotated tag，
回滚只需一句话。

## 当前版本

| Tag | 日期 | 描述 | 分支 |
|---|---|---|---|
| `v1-pinkpurple-stroke` | 2026-08-20 | 生活照1 抠图 + 粉紫渐变描边（对角线 5 段，左上粉紫→右下薄荷） | `master` |
| `v-peach-stroke` | 2026-08-20 | 同款处理，仅描边色板改为粉桃系（#F4B8C6→#C9A8E8→#8FB0E2→#9FD8C8→#BFE3D2） | `peach` |
| `20260820-v10` | 2026-08-28 | 轮播改为紫色渐变+虚线边框 cover-flow,保留自动/点击/键盘切换 | `master` |
| `20260820-v11` | 2026-08-29 | 实习经历编号按钮缩小至 42px + 四色渐变（蓝/紫/薄荷/粉）+ hover 联动点亮 | `master` |

> 两个版本仅描边色板不同，紧裁剪 / 形态学修复 / 描边粗细完全一致。

## 回滚命令

```bash
cd /workspace/portfolio-site

# 查看所有版本
git tag
git log --oneline --all --decorate

# 切到粉紫描边版（当前线上用的）
git checkout v1-pinkpurple-stroke

# 切到粉桃描边版
git checkout v-peach-stroke

# 切回最新（master）
git checkout master
```

> 注意：回滚会改动工作区文件。回滚后如需重新发布，再跑发布脚本即可。
> 想保留某次回滚结果作为新版本，用 `git checkout -b 新分支名 <tag>` 再 commit。

## 源文件与可复现性

`src/life_photo/` 保存了图像处理的源文件与脚本，保证将来能精确重跑：

- `生活照1.jpg` — 原始生活照
- `01_cut.png` — rembg 纯抠图（背景已去）
- `process_stroke.py` — 粉紫描边处理脚本（紧裁剪 + 形态学修复 + 渐变描边）
- `process_stroke_peach.py` — 粉桃描边变体脚本（仅 `colors` 不同）

修改描边色板只需改对应脚本里的 `colors` 列表，重跑：
```bash
python3 src/life_photo/process_stroke.py        # 粉紫
python3 src/life_photo/process_stroke_peach.py  # 粉桃
```
