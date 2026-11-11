# 鹅宝 ebaoagent 外呼库查询与导出（2026-08 实战沉淀）

## 连接方式

- PG 连接串：`PGPASSWORD=<密码> psql -h jzpgaicxebaoagent-s.db.djdns.cn -p5432 -U ebaoagent_rw -d dbjz_aicx_ebaoagent`
- 域名解析为内网 `10.40.99.230`（pgr-2zei7y8gk1a6rx2v.pg.rds.aliyuncs.com），**本机直连超时，必须走跳板机**。
- 跳板机双通道：
  - `10.37.18.183`（rdb@，集团线上-技术中心-数据运维安全部-运维安全组-数据库跳板机-01）
  - `10.40.110.211`（work@，线上-技术中心-运维安全部-DB跳板机；用户常指定此台）
- dj-jump = jzdjs.djdns.cn，用户 chenyj，密钥 `~/secureCRT/dj_public_key/chenyj-jumpserver.pem`，MFA 用 oathtool（secret 在 ~/.config/djs.config 的 JZ_DJS_SECRET）。
- 复用脚本：`~/.dazi/skills/DjDB-skill/scripts/djs.sh`（短命令）/ `tmux-djs.sh`（长命令，见下）。

## ⚠️ djs.sh（expect）长命令丢字 bug —— 必须用 tmux 原子粘贴

djs.tcl 匹配到 shell 提示符后立即 `send -- "<cmd>\r"`，长命令开头落在 shell 未就绪窗口被吞：远端只回显命令尾部（实测 SQL 只剩 `<ll_tasks') ORDER BY...`），短探针正常。base64 编码也无效。

**正解（长 SQL 一律走此流程）**：

1. 开/复用一个 tmux 会话：`ssh <跳板机> "tmux new-session -d -s djs || true"`
2. SQL 存文件传到跳板机（引号/换行经文件传输保持完好）：`scp /tmp/q.sql <跳板机>:/tmp/q.sql`
3. 粘贴+回车原子完成：`ssh <跳板机> "tmux load-buffer /tmp/q.sql && tmux paste-buffer && tmux send-keys Enter"`
4. 捕获输出到文件：`ssh <跳板机> "tmux pipe-pane -t djs -o 'cat >> /tmp/out.log'"`，等执行完取 /tmp/out.log，再 `tmux pipe-pane -t djs` 关闭捕获
5. 收尾：`ssh <跳板机> "tmux kill-session -t djs"`

并发多个 djs 查询会互相干扰（命令发不出去、输出被吞）→ **串行执行 + 复用同一 tmux 会话**。

## psql 与输出解析坑

- 跳板机禁用 `/bin/more` 和 `/bin/cat`，psql 默认分页输出被吞 → 用 `PAGER=cat` 前缀或 `psql -P pager=off`。
- jsonb `||` 拼接：`'失败('||result_json->>'x'` 报 `invalid input syntax for type json` → ELSE 分支直接输出状态码，不要拼接。
- pty 输出：ANSI 正则一次替换会吞全部数据 → 按 `\n` 分割后逐行 `re.sub(r'\x1b\[[0-9;?]*[a-zA-Z]','',s)` 保守清理；分隔符可能是**字面量 `\t`（反斜杠+t）而非真实 tab**，按字面量 `\t` 分割解析。

## 4 张外呼表（均在 `ebaoagent` schema，非 public）

| 表 | 关键列 |
|---|---|
| ebao_ai_call_init_records（主表） | id、task_id、binding_id、record_id(呼叫ID)、scene_num、customer_phone、customer_properties、result_status、platform_biz_id、result_json(jsonb)、created_at、updated_at |
| ebao_ai_call_bindings | id、scene_num、scene_name(中文)、supplier_id、skill_name_en/cn、prompt_content、created_by、scope、enabled |
| ebao_ai_call_tasks | id、binding_id、scene_num、initiator_user_id(→ebao_users.name)、initiator_user_name、status(calling/completed)、phones、record_ids、created_at |
| ebao_ai_call_task_logs | id、task_id、record_id、action(initiate/callback/skill_trigger)、detail(jsonb)、operator_user_id、created_at |

查列名：`SELECT column_name FROM information_schema.columns WHERE table_schema='ebaoagent' AND table_name='...'`

## 外呼明细导出字段映射（用户要求的 6 列）

```sql
SELECT r.record_id AS cd,
       COALESCE(b.scene_name, r.scene_num) AS field2,   -- 外呼场景（中文，缺映射时回退 scene_num）
       r.initiator_user_name AS field3,                 -- 外呼发起人
       r.result_json->>'supplierId' AS field4,           -- 外呼CPID（实测 =9）
       to_char(r.created_at,'YYYY-MM-DD HH24:MI:SS') AS field5,  -- 外呼时间
       CASE WHEN r.result_json->>'statusCode'='1' THEN '接通成功'
            WHEN r.result_json->>'statusCode'='9' THEN '未接通'
            WHEN r.result_json->>'statusCode'='98' THEN '呼叫失败'
            ELSE COALESCE(r.result_json->>'statusCode','无状态') END AS field6,
       r.customer_phone, r.result_json->>'statusCode'
FROM ebaoagent.ebao_ai_call_init_records r
LEFT JOIN ebaoagent.ebao_ai_call_bindings b ON r.binding_id = b.id
WHERE r.created_at >= now() - interval '3 days'
```

- statusCode 语义：`1`=接通成功、`9`=未接通、`98`=呼叫失败、空/无=无状态。
- result_json 其它 key：bizId、callBeginTime、chats、ext、individualTag、intentTag、number、recordId、retryStatus、retryTime、sceneNum、source(=CLAW_BOT)、statusCode、supplierId、sysId。
- 场景中文名示例：AAD4DL=管家匹配AI外呼阿姨确认接单意向、AAP3P6=鹅宝外呼确认找工作意向、AAUTPF=招商外呼催办、AAPSK3=无映射(binding 已删)。
- 统计口径：接通成功1≈39%、未接通9≈34%、无状态≈16%、呼叫失败98≈6%、异常2/3/5/6/7/8≈5%。
