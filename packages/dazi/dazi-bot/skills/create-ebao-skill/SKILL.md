---
name: create-ebao-skill
description: >
  Use when the user says "鹅宝技能助手", asks to create or update an ebao/鹅宝
  skill, or continues iterating on an existing 鹅宝 skill.
---

# create ebao skill

## 概述

创建、更新鹅宝技能都可使用。

## 铁律

- 每次执行该技能，都需强制走下面完整流程，不允许跳过

## 流程

1. **执行 sync_references.py** — 运行 `scripts/sync_references.py` 同步最新的引用数据，确保后续步骤基于最新数据工作。
2. **阅读 references/manifest.md** — 将 `references/manifest.md` 作为清单参考，了解当前可用的所有引用文档及其用途，
