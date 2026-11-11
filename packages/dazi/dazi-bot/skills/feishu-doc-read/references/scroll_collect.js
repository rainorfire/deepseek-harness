// Feishu wiki/docx 虚拟滚动正文采集脚本 —— 通过 chrome-devtools evaluate_script 执行
// 用法：
//   1) 先定位容器并初始化 store：
//      const c = document.querySelector('.bear-web-x-container');
//      window.__all = window.__all || {}; window.__allTotal = 0;
//   2) 分段滚动采集（step≈半屏，每次 sleep 触发懒加载渲染）：
//      async () => { const sleep = ms => new Promise(r => setTimeout(r, ms));
//        const c = document.querySelector('.bear-web-x-container');
//        const max = c.scrollHeight - c.clientHeight;
//        const step = Math.max(200, Math.floor(c.clientHeight * 0.5));
//        let added = 0;
//        for (let y = 0; y <= max + step; y += step) {
//          c.scrollTop = y; await sleep(120);
//          for (const b of c.querySelectorAll('[data-record-id]')) {
//            const id = b.getAttribute('data-record-id');
//            if (id && !window.__all[id]) { window.__all[id] = (b.innerText||'').trim(); added++; }
//          }
//        }
//        return JSON.stringify({added, unique: Object.keys(window.__all).length, max}); }
//   3) 导出全文：
//      () => JSON.stringify(Object.values(window.__all).join("\n"))
//   4) 关键词反查确认后半章节已覆盖（排序规则/响应结构/注意事项/字段名/示例/错误码）：
//      () => { const v = Object.values(window.__all); return JSON.stringify(v.filter(t => t.includes('排序')||t.includes('响应')||t.includes('注意')||t.includes('字段')).length); }
//
// 关键：正文在内部滚动容器(.bear-web-x-container)里虚拟滚动，document.body.innerText 只有 ~1KB 骨架，
//      [data-record-id] 块只有滚动到视口才渲染进 DOM，必须分段滚动+按 id 去重采集。
