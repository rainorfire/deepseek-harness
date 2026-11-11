# 浏览器登录态下用 GitLab API 添加 SSH key（免网页手动操作）

## 场景

本机 SSH key 连老 git 正常、但连**新 git 报 `Permission denied (publickey)`**，且网页端 GitLab 已登录（Chrome 会话有效）。逐 key 测试确认是「key 未绑定到该 GitLab 账号」，而非网络/服务问题。

## 通用排查顺序

1. `ssh-keyscan -H <host> >> ~/.ssh/known_hosts` 解决 Host key verification（若报该错）
2. 逐 key 测试归属：`ssh -i ~/.ssh/<key> -o BatchMode=yes -o IdentitiesOnly=yes -T git@<host>`
   - `Welcome to GitLab, 陈宇佳!` → 该 key 有权限
   - `Permission denied (publickey)` → key 未绑定此账号
3. 确认 key 本身没问题后，进入「浏览器登录态 + API 添加」流程

## 添加流程（chrome-devtools 在已登录的 GitLab 页面执行）

```javascript
(async () => {
  const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
  if (!csrf) return 'NO_CSRF';
  const pub = '<你的公钥内容 ssh-rsa AAAA...>';
  const r = await fetch('/api/v4/user/keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
    body: JSON.stringify({ title: '<备注名>', key: pub }),
    credentials: 'include'
  });
  return r.status + ' | ' + (await r.text()).slice(0, 200);
})()
```

- 成功：HTTP **201**，返回 `{"id":<n>,"title":...}`；已在页面上存在时 422（忽略即可）
- CSRF token 从 `meta[name="csrf-token"]` 取；fetch 必须带 `credentials:'include'`
- 完成后本机即可 `git push` 到该服务，无需用户到网页手动添加

## 坑

- chrome-devtools `evaluate_script` 入参名是 **`function`**（async IIFE 字符串），不是 `expression`（会报 `path: ["function"] Required`）
- 内核重启后浏览器页面重置为 `about:blank`，需先 `navigate_page` 回到目标页
