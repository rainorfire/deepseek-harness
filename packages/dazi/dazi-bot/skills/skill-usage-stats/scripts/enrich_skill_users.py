#!/usr/bin/env python3
"""
技能用户数据富化脚本

流程：user_id(passportId) → uid=getBaseInfo → cpId+姓名 → clueId → 归属人

用前修改：
1. 替换 INPUT_TSV 为实际文件路径
2. 替换 TOKEN 为当前可用 Token（从 memory/daojia_api_token.md 读取）

关键踩坑：getBaseInfo 的参数名是 uid，不是 passportId！
"""

import json
import csv
import urllib.request
import ssl
from collections import defaultdict

# 配置（每次调用前修改）
TOKEN = "cli-f549575bc90002cbe111469bf9e36462da3a9145"
INPUT_TSV = "skill_detail_富化版_0720-0722.tsv"
OUTPUT_XLSX = "skill_detail_分sheet_结果.xlsx"

HEADERS = {"X-Cli-Agent-Token": TOKEN, "X-Cli-Agent-Type": "3"}
API_BASE = "https://csworker.daojia-inc.com"
ZS_BASE = "https://zs.daojia-inc.com"


def get_worker_info(passport_id):
    """getBaseInfo - 参数名必须是 uid，不是 passportId"""
    url = f"{API_BASE}/worker/weChat/getBaseInfo?uid={passport_id}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        resp = urllib.request.urlopen(req, timeout=10, context=ssl._create_unverified_context())
        body = json.loads(resp.read())
        if body.get("status") == 0 and body.get("data"):
            return body["data"]
        return None
    except Exception as e:
        return {"error": str(e)}


def get_clue_id(cp_id):
    url = f"{ZS_BASE}/im/api/worker?cpId={cp_id}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        resp = urllib.request.urlopen(req, timeout=10, context=ssl._create_unverified_context())
        body = json.loads(resp.read())
        if body.get("data"):
            return body["data"].get("clueId", "")
        return ""
    except:
        return ""


def get_clue_source(cp_id):
    url = f"{API_BASE}/worker/detail/getClueSource?cpId={cp_id}&categoryId=212"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        resp = urllib.request.urlopen(req, timeout=10, context=ssl._create_unverified_context())
        body = json.loads(resp.read())
        if body.get("data"):
            return body["data"].get("clueBelongUserName", "")
        return ""
    except:
        return ""


if __name__ == "__main__":
    with open(INPUT_TSV, "r") as f:
        reader = csv.DictReader(f, delimiter='\t')
        rows = list(reader)

    user_ids = list(dict.fromkeys(r["user_id"] for r in rows if r["user_id"] and r["user_id"] != "\\N"))
    print(f"共 {len(user_ids)} 个去重 user_id")

    cp_map = {}
    for i, uid in enumerate(user_ids, 1):
        info = get_worker_info(uid)
        if info and "error" not in info:
            name = info.get("realName", "") or ""
            phone = info.get("phone", "") or ""
            if not name and phone:
                name = phone[:3] + "****" + phone[-4:] if len(phone) >= 7 else phone
            cp_map[uid] = {
                "cpId": info.get("cpId", ""),
                "name": name,
                "phone": phone,
                "isWorker": info.get("isWorker", False),
            }
            print(f"  [{i}/{len(user_ids)}] {uid} -> cpId={cp_map[uid]['cpId']} name={name}")
        else:
            cp_map[uid] = {"cpId": "", "name": "", "phone": "", "isWorker": False}
            print(f"  [{i}/{len(user_ids)}] {uid} -> query failed")

    for uid, info in cp_map.items():
        if info["isWorker"] and info["cpId"]:
            clue_id = get_clue_id(info["cpId"])
            clue_source = get_clue_source(info["cpId"])
            info["clueId"] = clue_id
            info["clueBelong"] = clue_source
            print(f"    -> clueId={clue_id} clueSource={clue_source}")
        else:
            info["clueId"] = ""
            info["clueBelong"] = ""

    from openpyxl import Workbook
    from openpyxl.utils import get_column_letter

    data_by_sheet = defaultdict(list)
    for row in rows:
        uid = row["user_id"]
        info = cp_map.get(uid, {})
        row["cp_id"] = info.get("cpId", "")
        row["姓名"] = info.get("name", "")
        row["线索ID"] = info.get("clueId", "")
        row["线索归属人"] = info.get("clueBelong", "")
        data_by_sheet[f"{row['skill_name']}_{row['dt']}"].append(row)

    wb = Workbook()
    wb.remove(wb.active)
    for sheet_name in sorted(data_by_sheet):
        ws = wb.create_sheet(title=sheet_name[:31])
        rows_data = data_by_sheet[sheet_name]
        header = list(rows_data[0].keys())
        for col_idx, h in enumerate(header, 1):
            ws.cell(1, col_idx, h)
        for row_idx, row_data in enumerate(rows_data, 2):
            for col_idx, h in enumerate(header, 1):
                ws.cell(row_idx, col_idx, row_data.get(h, ""))
        for col_idx in range(1, len(header) + 1):
            ws.column_dimensions[get_column_letter(col_idx)].width = max(20, len(header[col_idx - 1]) + 2)

    wb.save(OUTPUT_XLSX)
    print(f"Done: {OUTPUT_XLSX}, sheets: {len(data_by_sheet)}")
