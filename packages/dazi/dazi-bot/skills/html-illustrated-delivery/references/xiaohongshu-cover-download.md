# 小红书(xhscdn)封面图下载实战笔记

来源：2026-08-20 长沙周边3小时车程自驾游 HTML 报告会话。

## 关键事实

1. **图片域名**：`sns-webpic-qc.xhscdn.com`，URL 形如 `https://sns-webpic-qc.xhscdn.com/{时间戳}/{hash}/{path}!nc_n_webp_mw_1`（结尾 `!nc_n_webp_mw_1` 是缩略规格）。
2. **必须带 Referer**：`curl -H "Referer: https://www.xiaohongshu.com"`，否则 403。
3. **部分路径首次 403 的兜底**：`notes_pre_post` / `notes_uhdr` 等路径直接下可能 403；换**完整 Chrome UA + `Referer: https://www.xiaohongshu.com/explore`** 重试可成功。实测一次 403 重试后全 200。
4. **实际是 WebP 伪装 jpg**：下载字节是 WebP 格式但扩展名 .jpg，浏览器可正常渲染，无需转码（验证代理已确认）。

## 推荐下载脚本模式

```bash
cd images && dl() { curl -s -o "$1" -w "%{http_code} $1\n" -H "Referer: https://www.xiaohongshu.com" "$2"; }
dl name.jpg "URL"   # 并行跑多个 &
# 403 的用完整 UA + explore Referer 重试
curl -s -o retry.jpg -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36" -H "Referer: https://www.xiaohongshu.com/explore" "URL"
```

## 注意

- 先批量并行下载，收集 403 列表，再统一重试，避免串行拖慢。
- 写 HTML 时用相对路径 `images/xxx.jpg`，交付目录结构：`<交付名>/index.html` + `<交付名>/images/`。
- 交付前用 grep 核对 HTML 中 `images/` 引用与磁盘文件一一对应，再走 verification 代理。
