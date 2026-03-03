#!/bin/bash
# dailydoom-devrun.sh — Nightly autonomous dev session
# Called by cron at 23:30 daily (see: crontab -l)

export PATH="/home/claw/.npm-global/bin:/home/claw/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

cd /home/claw/dailydoom || exit 1

claude --dangerously-skip-permissions -p "Read the instructions in INSTRUCTIONS.MD and follow them"
