# 实战：户型图去水印（2026-08-28）

## 场景

用户提供一张 AI 生成的户型图 PNG（2048×2048，RGB，~1.6MB），要求去除右下角水印文字，且**不改变像素尺寸**。内置 image_gen 工具在当前环境不可用，全程走本地 Python 方案。

产出：`/Users/chenyujia/Documents/我的文件/dazi/6f466958027ce8f7b5ee9699ca3ad3c1_nowm.png`

## 环境事实

- 无 ImageMagick（magick/convert 都不存在）
- miniconda python3 有 PIL 10.4.0，初始无 cv2 → `pip install opencv-python-headless`（机器上有 torchmetrics/gradio 报 numpy 2.4.6 不兼容的依赖警告，不致命）
- tesseract 在 /opt/homebrew/bin，但对其很淡的水印字基本无效（试了 -l chi_sim+eng --psm 6/11 均读不出）
- Read 工具读图受限 → 全程用 numpy 像素统计 + ASCII 可视化定位

## 定位过程（可直接复用）

1. 灰度化后按行/列统计暗像素：主内容区 rows 360-1980 / cols 402-1980（画图区），其余为白边
2. 水印特征：**R==G==B（纯灰）且值域 200-251**，与画面内容（彩色，通道差>5）可区分
3. 水印精确范围：rows 1891-1980（89 行）、cols 1489-1981（492 列），像素 7746 个，密度 17.7%，6 组字符块（疑似 6 个中文字或网址，OCR 读不出）
4. ASCII 可视化（灰度 mask 映射成 #，按每行/每列分组）快速确认形状与字符数
5. 用 FFT 峰值判断无整图重复水印（只在一个角落），排除平铺水印

## 处理代码核心

```python
import cv2, numpy as np
img = cv2.imread("原图.png")
gray_ok = (img[:,:,0]==img[:,:,1]) & (img[:,:,1]==img[:,:,2])
mask = gray_ok & (img[:,:,0]>=200) & (img[:,:,0]<252)
# 裁剪到 ROI 外接矩形，再 3x3 膨胀 1 次处理抗锯齿
# 膨胀必须受矩形约束，否则波及相邻绘图
result = cv2.inpaint(img, mask.astype(np.uint8)*255, 3, cv2.INPAINT_TELEA)
cv2.imwrite("输出_nowm.png", result)
```

## 两个难点与解法

1. **OCR 读不出水印**：水印灰度 206-251 太淡，tesseract 全失败。解法：不依赖读字，仅凭「纯灰 + 值域 + 位置聚簇」就能精准定位。
2. **mask 膨胀误伤绘图区**：第一版 mask 直接 3×3 膨胀 2 次 → 波及绘图区 816 像素变化（max diff 94）。解法：mask 先乘 ROI 矩形裁剪，膨胀后再裁一次，最终绘图区变化 0、总改动 11437 像素、全在水印区域 rows 1890-1981 / cols 1488-1981。

## 验证四要素（交付前必做）

1. 剩余水印像素 == 0（同一条件扫结果图）
2. 尺寸不变：orig.size == final.size（2048×2048）、模式 RGB、格式 PNG
3. 变更区域 bbox 收敛在水印范围内
4. 主体内容区 diff ≈ 0（mean 0.005，仅 0 像素在约束版中被改）

## 交付话术风格

回复用户时列：水印位置 / 算法（cv2 Telea inpaint）/ 尺寸是否不变 / 改动像素数，并给出输出文件绝对路径（工作目录下 UI 会展示产出卡片）。用户对「像素大小不变」有明确要求，必须逐字确认。
