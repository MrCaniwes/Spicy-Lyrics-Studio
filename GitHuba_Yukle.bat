@echo off
chcp 65001 >nul
title GitHub Push - Spicy Lyrics Studio
cd /d "%~dp0"

echo ====================================================
echo  Spicy Lyrics Studio - GitHub Push
echo ====================================================
echo.
echo GitHub hesabınıza bağlanılıyor...
echo (Eğer tarayıcıda GitHub oturum açma penceresi açılırsa 'Sign in with your browser' butonuna basarak onaylayın)
echo.

"C:\Program Files\Git\cmd\git.exe" push -u origin main

echo.
if %errorlevel% equ 0 (
    echo ====================================================
    echo [BASARILI] Proje basariyla GitHub'a yuklendi!
    echo ====================================================
) else (
    echo [HATA] Yukleme sirasinda bir sorun olustu.
)
echo.
pause
