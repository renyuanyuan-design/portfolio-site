"""v4 描边重做版:对角线渐变(不旋转) + 膨胀求环 + 渐变描边
"""
from PIL import Image, ImageFilter, ImageDraw
import numpy as np

SRC = "/tmp/lifephoto/01_cut.png"
DST_PNG = "/tmp/lifephoto/life_avatar.png"
DST_WEBP = "/tmp/lifephoto/life_avatar.webp"

# ---- 1) 加载抠图 ----
im = Image.open(SRC).convert("RGBA")
W, H = im.size
print("source:", W, H)

# ---- 2) alpha 修复:闭运算 + 高斯柔边 ----
r, g, b, a = im.split()
a_arr = np.array(a)

closed = a.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MinFilter(9))
smoothed = closed.filter(ImageFilter.GaussianBlur(radius=1.8))

orig = np.array(a).astype(np.int32)
fix = np.array(smoothed).astype(np.int32)
merged = np.maximum(orig, fix).astype(np.uint8)
merged[merged < 20] = 0
a_fixed = Image.fromarray(merged, mode="L")
im_fixed = Image.merge("RGBA", (r, g, b, a_fixed))

# ---- 3) 紧裁剪 ----
mask_arr = merged > 10
ys, xs = np.where(mask_arr)
y0, y1 = ys.min(), ys.max()
x0, x1 = xs.min(), xs.max()
ph, pw = y1 - y0, x1 - x0
pad = int(max(ph, pw) * 0.03)
x0 = max(0, x0 - pad)
y0 = max(0, y0 - pad)
x1 = min(W, x1 + pad)
y1 = min(H, y1 + pad)
cropped = im_fixed.crop((x0, y0, x1, y1))
cw, ch = cropped.size
print("cropped:", cw, ch, "ratio:", round(cw / ch, 3))

# ---- 4) 准备画布 ----
STROKE = 20
fw, fh = cw + STROKE * 2, ch + STROKE * 2

canvas = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
canvas.paste(cropped, (STROKE, STROKE), cropped)

# 人物 alpha
person_alpha = np.array(canvas.split()[3])

# 膨胀得外缘 alpha(比原图大 STROKE 像素)
dilated = canvas.split()[3].filter(ImageFilter.MaxFilter(STROKE * 2 + 1))
dilated_arr = np.array(dilated)

# 环 = 膨胀 - 原始
ring_mask = np.maximum(0, dilated_arr - person_alpha).astype(np.uint8)
print("ring_mask max:", ring_mask.max(), "ring pixels:", (ring_mask > 0).sum())

# ---- 5) 生成对角线渐变(numpy 直接算,不走旋转) ----
# 5 段渐变色(粉紫→丁香→淡蓝→薄荷)
colors = np.array([
    [220, 184, 229],   # 淡丁香粉 #DCB8E5
    [197, 168, 224],   # 淡紫 #C5A8E0
    [168, 197, 232],   # 淡蓝 #A8C5E8
    [168, 216, 197],   # 薄荷 #A8D8C5
    [197, 229, 213],   # 浅薄荷 #C5E5D5
], dtype=np.float32)

# 对角线参数 t:左上 t=0,右下 t=1 (用户参考图:左上粉紫→右下薄荷)
yy, xx = np.mgrid[0:fh, 0:fw]
t = (xx + yy) / (fw - 1 + fh - 1)  # t in [0, 1]
t_clip = np.clip(t, 0, 0.9999) * (len(colors) - 1)  # [0, 4]
idx = t_clip.astype(np.int32)  # 段下标
local_t = (t_clip - idx)[:, :, None]  # 每段内插值 [0,1]

# 渐变颜色
grad_rgb = colors[idx] * (1 - local_t) + colors[idx + 1] * local_t  # (fh, fw, 3)
grad_rgb = grad_rgb.astype(np.uint8)
print("grad_rgb shape:", grad_rgb.shape)

# ---- 6) 描边 = 渐变 RGB + 环 alpha ----
stroke_rgba = np.dstack([grad_rgb, ring_mask])  # (fh, fw, 4)
stroke_img = Image.fromarray(stroke_rgba, mode="RGBA")

# 合成:描边在下,人物在上
result = Image.alpha_composite(stroke_img, canvas)
print("result size:", result.size)

# ---- 7) 缩放 ----
rw, rh = result.size
scale = 1300 / max(rw, rh)
if scale < 1:
    result = result.resize((int(rw * scale), int(rh * scale)), Image.LANCZOS)
print("final size:", result.size)

# ---- 8) 保存 ----
result.save(DST_PNG, "PNG", optimize=True)
result.save(DST_WEBP, "WEBP", quality=88, method=6)

import os
print(f"PNG: {os.path.getsize(DST_PNG) / 1024:.0f} KB")
print(f"WebP: {os.path.getsize(DST_WEBP) / 1024:.0f} KB")
