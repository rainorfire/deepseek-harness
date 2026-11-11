#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从远程 references.json 读取清单，拉取参考文档到 references/。"""

import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

REFERENCES_JSON_URL = (
    "https://static.daojia.com/jz/assets/admin-publisher/baas/"
    "6a794aa7103bac5b6d641ab8/create-ebao-skill/references.json"
)

TIMEOUT_SEC = 60


def _skill_root() -> Path:
    return Path(__file__).resolve().parent.parent


def _download(url: str) -> str:
    parsed = urllib.parse.urlsplit(url)
    query = urllib.parse.parse_qs(parsed.query, keep_blank_values=True)
    query["_t"] = [str(int(time.time()))]
    cache_busted = urllib.parse.urlunsplit((
        parsed.scheme, parsed.netloc, parsed.path,
        urllib.parse.urlencode(query, doseq=True),
        parsed.fragment,
    ))
    req = urllib.request.Request(cache_busted, method="GET", headers={"User-Agent": "create-ebao-skill-sync/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_SEC) as resp:
            charset = resp.headers.get_content_charset() or "utf-8"
            return resp.read().decode(charset)
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"HTTP {e.code} for {url}") from e
    except urllib.error.URLError as e:
        raise RuntimeError(f"download failed for {url}: {e.reason}") from e


def _load_manifest() -> dict:
    raw = _download(REFERENCES_JSON_URL)
    data = json.loads(raw)
    version = ""
    if isinstance(data, dict):
        items = data.get("files", [])
        version = str(data.get("version", "")).strip()
    elif isinstance(data, list):
        items = data
    else:
        raise RuntimeError("references.json must be an object with 'files' array or a plain array")
    if not items:
        raise RuntimeError("references.json files list is empty")
    files = []
    for i, item in enumerate(items):
        if not isinstance(item, dict):
            raise RuntimeError(f"references.json[{i}] must be an object")
        name = item.get("name")
        url = item.get("url")
        if not isinstance(name, str) or not name.strip():
            raise RuntimeError(f"references.json[{i}].name is required")
        if not isinstance(url, str) or not url.strip():
            raise RuntimeError(f"references.json[{i}].url is required")
        desc = item.get("description", "")
        files.append({"name": name.strip(), "url": url.strip(), "description": desc.strip() if isinstance(desc, str) else ""})
    return {"version": version, "files": files}


def _read_saved_version(dest_dir: Path) -> str:
    version_file = dest_dir / ".version"
    if version_file.exists():
        return version_file.read_text(encoding="utf-8").strip()
    return ""


def _save_version(dest_dir: Path, version: str) -> None:
    (dest_dir / ".version").write_text(version + "\n", encoding="utf-8", newline="\n")


def _manifest_to_markdown(items: list, version: str) -> str:
    lines = ["# References Manifest", ""]
    if version:
        lines.append(f"Version: {version}")
        lines.append("")
    for item in items:
        name = item.get("name", "")
        url = item.get("url", "")
        desc = item.get("description", "")
        lines.append(f"- **{name}** — {desc}")
        lines.append(f"  - URL: {url}")
    lines.append("")
    return "\n".join(lines)


def sync(dest_dir: Path) -> dict:
    dest_dir.mkdir(parents=True, exist_ok=True)
    manifest = _load_manifest()
    version = manifest["version"]
    items = manifest["files"]

    saved_version = _read_saved_version(dest_dir)
    if version and version == saved_version:
        return {"skipped": True, "version": version, "reason": "version unchanged", "files": []}

    for md_file in dest_dir.glob("*.md"):
        md_file.unlink()

    manifest_md = _manifest_to_markdown(items, version)
    (dest_dir / "manifest.md").write_text(manifest_md, encoding="utf-8", newline="\n")
    synced = []
    for item in items:
        name, url = item["name"], item["url"]
        content = _download(url)
        if not content.strip():
            raise RuntimeError(f"empty response: {name}")
        path = dest_dir / name
        path.write_text(content, encoding="utf-8", newline="\n")
        synced.append({"name": name, "path": str(path), "bytes": len(content.encode("utf-8"))})
    synced.insert(0, {"name": "manifest.md", "path": str(dest_dir / "manifest.md"), "bytes": len(manifest_md.encode("utf-8"))})

    if version:
        _save_version(dest_dir, version)

    return {"skipped": False, "version": version, "files": synced}


def main() -> None:
    try:
        raw = sys.stdin.read()
        payload = json.loads(raw) if raw.strip() else {}
    except json.JSONDecodeError as e:
        print(json.dumps({"ok": False, "error": f"invalid json: {e}"}, ensure_ascii=False))
        sys.exit(1)

    try:
        dest = payload.get("dest_dir")
        dest_dir = Path(dest) if dest else _skill_root() / "references"
        sync_result = sync(dest_dir)
        result = {
            "ok": True,
            "data": {
                "manifest_url": REFERENCES_JSON_URL,
                "dest_dir": str(dest_dir),
                "version": sync_result["version"],
                "skipped": sync_result["skipped"],
                "files": sync_result["files"],
            },
        }
        if sync_result.get("reason"):
            result["data"]["reason"] = sync_result["reason"]
    except (urllib.error.URLError, urllib.error.HTTPError, OSError, RuntimeError, json.JSONDecodeError) as e:
        print(json.dumps({"ok": False, "error": str(e)}, ensure_ascii=False))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"ok": False, "error": str(e)}, ensure_ascii=False))
        sys.exit(1)

    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
