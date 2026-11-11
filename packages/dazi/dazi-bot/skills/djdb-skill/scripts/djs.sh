#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────
# djs.sh - 跳板机登录工具
# 用法：
#   djs.sh <IP>             readonly 登录
#   djs.sh <IP> -work       work 登录
#   djs.sh <IP> -rdb        rdb 登录
#   djs.sh                  交互式登录
#   djs.sh <IP> -work -c "top"  登录后执行命令
# ─────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'
info()  { echo -e "${GREEN}✓${NC} $*"; }
error() { echo -e "${RED}✗${NC} $*" >&2; }

usage() {
    cat <<'EOF'
djs.sh - 跳板机登录工具

用法:
  djs.sh <IP>              readonly 登录（默认）
  djs.sh <IP> -readonly    readonly 登录
  djs.sh <IP> -work        work 登录
  djs.sh <IP> -rdb         rdb 登录
  djs.sh                   交互式登录

选项:
  -readonly     以 readonly 权限登录（默认）
  -work         以 work 权限登录
  -rdb          以 rdb 权限登录
  -c <command>  登录后执行指定命令
  -check        检测依赖是否已安装
EOF
}

check_deps() {
    local deps="oathtool expect ssh"
    local missing=0
    for dep in $deps; do
        if command -v "$dep" &>/dev/null; then
            local path
            path="$(command -v "$dep")"
            info "$dep ($path)"
        else
            error "$dep 未安装"
            missing=1
        fi
    done
    if [[ $missing -eq 1 ]]; then
        exit 1
    fi
}

validate_ip() {
    local ip="$1"
    [[ -z "$ip" ]] && { error "请指定 IP 地址"; exit 1; }
    [[ "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] || { error "无效的 IP: $ip"; exit 1; }
}

DJS_CONFIG="${DJS_CONFIG:-$HOME/.config/djs.config}"

load_config() {
    if [[ ! -f "$DJS_CONFIG" ]]; then
        error "配置文件不存在: $DJS_CONFIG"
        error "请创建配置文件，参考以下格式："
        cat <<'EXAMPLE'
# ~/.config/djs.config
JZ_DJS_SECRET="你的到家盾MFA密钥"
JZ_DJS_SSH="ssh -i ~/.ssh/密钥文件 用户名@jzdjs.djdns.cn"
DJDB_bdp="mysql -h 从库域名 -P 3306 -u 用户名 -p密码 数据库名称;"
EXAMPLE
        exit 1
    fi
    set -a
    source "$DJS_CONFIG"
    set +a
}

check_env() {
    for dep in oathtool expect; do
        command -v "$dep" &>/dev/null || { error "缺少依赖: $dep"; exit 1; }
    done
    load_config
    [[ -z "${JZ_DJS_SECRET:-}" ]] && { error "配置文件中未设置 JZ_DJS_SECRET ($DJS_CONFIG)"; exit 1; }
    [[ -z "${JZ_DJS_SSH:-}" ]] && { error "配置文件中未设置 JZ_DJS_SSH ($DJS_CONFIG)"; exit 1; }
    oathtool --totp -b "$JZ_DJS_SECRET" &>/dev/null || { error "MFA 验证码生成失败"; exit 1; }
}

login_with() {
    local label="$1" id="$2" ip="$3" cmd="${4:-}"
    info "以 $label 登录 $ip ..."
    if [[ -n "$cmd" ]]; then
        run_expect login "$id" "$ip" "$cmd"
    else
        run_expect login "$id" "$ip"
    fi
}

run_expect() {
    expect "$SCRIPT_DIR/djs.tcl" "$@"
}

# ── 参数解析 ──
mode="readonly"
ip=""
cmd=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        -h|--help)    usage; exit 0 ;;
        -check)       check_deps; exit 0 ;;
        -readonly)    mode="readonly"; shift ;;
        -work)        mode="work"; shift ;;
        -rdb)         mode="rdb"; shift ;;
        -c)           [[ -z "${2:-}" ]] && { error "-c 需要指定命令"; exit 1; }
                      cmd="$2"; shift 2 ;;
        *)            validate_ip "$1"; ip="$1"; shift ;;
    esac
done

# -c 必须搭配 IP
[[ -n "$cmd" && -z "$ip" ]] && { error "-c 必须搭配 IP 地址"; exit 1; }

case "$mode" in
    readonly) [[ -n "$ip" ]] && { validate_ip "$ip"; check_env; login_with readonly 0 "$ip" "$cmd"; } || { check_env; info "登录跳板机 ..."; run_expect interactive; } ;;
    work)     validate_ip "$ip"; check_env; login_with work 1 "$ip" "$cmd" ;;
    rdb)      validate_ip "$ip"; check_env; login_with rdb 2 "$ip" "$cmd" ;;
esac
