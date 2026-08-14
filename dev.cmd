@echo off
cd /d "C:\Users\User\Desktop\CHANCE_1"
set "PATH=C:\Program Files\nodejs\;%PATH%"
call "C:\Program Files\nodejs\npm.cmd" run dev -- -p 3002
