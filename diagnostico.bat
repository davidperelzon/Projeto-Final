@echo off
cd /d "%~dp0"
chcp 65001 >nul
set LOG=diagnostico.txt
echo Diagnostico Nativ Ivrit > %LOG%
echo ===== VERSOES ===== >> %LOG%
call node -v >> %LOG% 2>&1
call npm -v >> %LOG% 2>&1
echo ===== npm install ===== >> %LOG%
call npm install >> %LOG% 2>&1
echo ===== expo install --fix ===== >> %LOG%
call npx expo install --fix >> %LOG% 2>&1
echo ===== expo-doctor ===== >> %LOG%
call npx expo-doctor >> %LOG% 2>&1
echo ===== build da WEB (mostra o erro real do bundle) ===== >> %LOG%
call npx expo export --platform web --output-dir .diag-web >> %LOG% 2>&1
echo ===== build do iOS (so o bundle JS) ===== >> %LOG%
call npx expo export --platform ios --output-dir .diag-ios >> %LOG% 2>&1
rmdir /s /q .diag-web .diag-ios 2>nul
echo.
echo Pronto. Envie o arquivo diagnostico.txt (nesta pasta) a quem for ajudar a resolver o problema.
pause
