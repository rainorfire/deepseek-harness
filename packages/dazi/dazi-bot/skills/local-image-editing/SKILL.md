---
name: local-image-editing
description: 本地图片处理：去水印/像素级编辑/修复（AI图像工具不可用时用 PIL+OpenCV 落地）。触发词：去水印、去掉水印文字、去除水印、图片修复、inpaint、删掉图上文字、像素大小不变。
---

# 本地图片处理（无 AI 图像工具时的兜底方案）

当前环境内置 image_gen 工具**不可用**时，去水印/图像编辑一律走本地 Python（PIL + OpenCV）方案。用户要求「去水印文字」「删掉图上XX」「修复图片」时用本流程。

## 1. 先探测工具链（一次 Bash 搞定）

```bash
which magick || which convert || echo "no imagemagick"
python3 -c "import PIL; print('PIL', PIL.__version__)" 2>/dev/null || echo "no PIL"
python3 -c "import cv2; print('cv2', cv2.__version__)" 2>/dev/null || echo "no cv2" && file <图片路径> && sips -g pixelWidth -g pixelHeight -g format <图片路径>
```

本机（2026-08 实测）：无 ImageMagick；miniconda python3 有 PIL 10.4.0、**初始无 cv2**（需 `pip install opencv-python-headless`）；tesseract 在 /opt/homebrew/bin 有。

⚠️ 装 cv2 会顺带把 numpy 升到 2.x，本机已存在 torchmetrics/gradio 兼容性警告（不致命，继续跑即可）。

## 2. Read 工具读不出图时：程序化像素分析定位目标

当前环境 Read 工具对图片内容支持不稳定，透视看图时不要死磕，改用 numpy 分析：

- 转灰度后按行/列统计暗像素分布，找目标区域的边界框（如非白像素 bbox、水印行区间）
- 半透明灰字水印特征：**R==G==B 且值域 200-251**（比 255 略暗的纯灰），叠加在纯白/接近白背景上；彩色内容（通道差值>5）不是水印
- 用 ASCII 可视化（把 mask 映射成 # 字符逐行打印）能直观看出文字/图形轮廓
- tesseract OCR 对极淡灰字基本读不出，预判依赖像素特征定位，不要花太多时间在 OCR 上

## 3. 去除流程（核心）

```python
import cv2, numpy as np
img = cv2.imread('原图.png')  # BGR
# 水印 mask：灰度一致 + 落在 200-251 区间（可再叠加 ROI 外接矩形裁剪）
gray_ok = (img[:,:,0]==img[:,:,1]) & (img[:,:,1]==img[:,:,2])
mask = gray_ok & (img[:,:,0]>=200) & (img[:,:,0]<252)
# 关键：把 mask 裁剪到水印外接矩形内，再轻微膨胀(morph)处理抗锯齿边缘
# 膨胀 kernel 建议 3x3、1 次；膨胀完再与矩形裁剪一次
result = cv2.inpaint(img, mask.astype(np.uint8)*255, 3, cv2.INPAINT_TELEA)
cv2.imwrite('xxx_nowm.png', result)
```

**血泪教训（2026-08-28 实测）**：mask 不裁剪直接 3x3×2 次膨胀，会波及相邻绘图内容（816 像素被误改）。正确做法是先 shr/locate 出外接矩形，mask 先乘矩形再膨胀，或膨胀后再次 `mask &= rect_mask`——保证改动只发生在目标区域。

## 4. 交付前验证四要素（缺一不可）

1. **剩余水印像素 == 0**（用同一 mask 条件扫结果图）
2. **像素尺寸/模式/格式不变**（PIL 对比 `orig.size == final.size`，RGB→RGB，PNG→PNG）
3. **变更区域 bounding box 只在目标区域**（np.abs(orig-result) 定位 changed 行/列范围）
4. **主体内容区 diff ≈ 0**（对比目标区域外的像素，允许改动的仅限水印区）

## 5. 交付位置

输出到 `<workingDir>/<原名>_nowm.png`（工作目录），UI 会自动展示在「产出文件」卡片。交付回复里写明：水印位置、用到的算法、尺寸是否不变、改动像素数。

## 参考

- references/watermark-removal-2026-08-28.md：完整实战（户型图 2048×2048，水印在右下角 rows 1891-1980 / cols 1489-1981，灰 200-251，Telea inpaint，mask 约束迭代全过程）
