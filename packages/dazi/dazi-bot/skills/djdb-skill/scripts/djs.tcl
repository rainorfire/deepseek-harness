#!/usr/bin/expect -f
# ─────────────────────────────────────────────────────────────────
# jump.tcl - 跳板机 SSH + MFA 自动登录
# 用法：
#   expect jump.tcl login <type> <IP>     # 登录指定服务器
#   expect jump.tcl interactive           # 交互式登录
# ─────────────────────────────────────────────────────────────────

# ── 参数解析 ──
set mode "login"
set login_type "0"
set target_ip ""
set exec_cmd ""

if {$argc >= 1} {
    set mode [lindex $argv 0]
}
if {$mode == "login"} {
    if {$argc >= 2} { set login_type [lindex $argv 1] }
    if {$argc >= 3} { set target_ip [lindex $argv 2] }
    if {$argc >= 4} { set exec_cmd [lindex $argv 3] }
}

# ── 环境变量校验 ──
if {![info exists ::env(JZ_DJS_SECRET)] || $::env(JZ_DJS_SECRET) == ""} {
    puts "Error: JZ_DJS_SECRET is required"
    exit 1
}
if {![info exists ::env(JZ_DJS_SSH)] || $::env(JZ_DJS_SSH) == ""} {
    puts "Error: JZ_DJS_SSH is required"
    exit 1
}

set otp_secret $::env(JZ_DJS_SECRET)
set jump_ssh $::env(JZ_DJS_SSH)

# ── TOTP 生成 ──
proc gen_code {secret} {
    if {[catch {exec oathtool --totp -b $secret} result]} {
        puts "Error: oathtool failed: $result"
        exit 1
    }
    return $result
}

# ── 禁用 SSH_ASKPASS（必须在 spawn 之前）──
set ::env(SSH_ASKPASS) "/bin/false"
set ::env(SSH_ASKPASS_REQUIRE) "never"
set ::env(KSSHASKPASS) ""
set ::env(DISPLAY) ""

# ── 启动 SSH 连接 ──
spawn {*}[split $jump_ssh]

set mfa_period 30
set max_retry 3
set attempt 0

# MFA 阶段：30s 超时
set timeout 30

# ── 主匹配循环 ──
expect {
    # ── MFA 阶段 ──
    -re {\(.*\) \[MFA auth\]:} {
        if {$attempt >= $max_retry} {
            puts "Error: MFA retry exceeded ($max_retry 次)"
            exit 1
        }
        if {$attempt > 0} {
            set now [exec date +%s]
            set wait [expr {$mfa_period - ($now % $mfa_period) + 1}]
            if {$wait > 0} {
                puts -nonewline "⏳ 等待 TOTP 刷新 ${wait}s..."
                sleep $wait
                puts "\r\033\[K"
            }
        }
        set code [gen_code $otp_secret]
        send -- "$code\r"
        incr attempt
        exp_continue
    }

    -re {Please enter 6 digits} { exp_continue }
    -re {ksshaskpass} { exp_continue }

    # ── 错误处理 ──
    -re {(?i)permission denied} {
        puts "Error: Permission denied"
        exit 1
    }
    -re {(?i)connection refused} {
        puts "Error: SSH connection refused"
        exit 1
    }
    -re {(?i)no route to host} {
        puts "Error: No route to host"
        exit 1
    }
    -re {(?i)host key verification failed} {
        puts "Error: Host key verification failed"
        exit 1
    }
    eof {
        puts "Error: Connection closed unexpectedly"
        exit 1
    }

    # ── 没有资产（IP 不存在，必须在 Opt> 之前）──
    -re {没有资产} {
        puts "Error: 资源不存在"
        exit 1
    }

    # ── 跳板机菜单 ──
    "Opt>" {
        set timeout 600

        if {$mode == "login" && $target_ip != ""} {
            send -- "$target_ip\r"
            exp_continue
        } else {
            interact
        }
    }

    # ── 登录类型选择 ──
    -re {ID>} {
        send -- "$login_type\r"
        exp_continue
    }

    # ── 多服务器匹配 ──
    -re {序号>} {
        send -- "1\r"
        exp_continue
    }

    # ── Shell 就绪 ──
    -re {\][\$#]\s*$} {
        if {$exec_cmd != ""} {
            send -- "$exec_cmd\r"
            expect {
                -re {\][\$#]\s*$} {
                    # 命令执行完毕，自动退出
                    send -- "exit\r"
                    expect eof
                }
                timeout {
                    puts "Warning: Command timed out, exiting"
                    send -- "exit\r"
                    expect eof
                }
            }
        } else {
            interact
        }
    }

    # ── 超时 ──
    timeout {
        puts "Error: Login timeout"
        exit 1
    }
}
