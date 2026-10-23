@echo off
chcp 65001 >nul
title Spicy Lyrics Studio - Launcher
cd /d "%~dp0"

echo =======================================================
echo    🎵 Spicy Lyrics Studio - Quick Launcher v1.1
echo =======================================================
echo.

:: 1. Spotify Bridge Başlatma Kontrolü
curl -s http://localhost:48484/status >nul 2>&1
if %errorlevel% neq 0 (
    echo [1/2] Spotify GSMTC Arka Plan Köprüsü başlatılıyor...
    start /min "" cmd /c "Spotify_Koprusunu_Baslat.bat"
    timeout /t 2 /nobreak >nul
) else (
    echo [1/2] Spotify GSMTC Köprüsü zaten çalışıyor.
)

:: 2. Stüdyoyu Varsayılan Tarayıcıda Aç
echo [2/2] Spicy Lyrics Studio tarayıcınızda açılıyor...
start "" "Timeline_Editor.html"

echo.
echo =======================================================
echo  ✓ Stüdyo hazır! İyi senkronlamalar.
echo =======================================================
timeout /t 3 >nul
exit
