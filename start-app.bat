@echo off
cd /d "%~dp0"
cls
echo Iniciando Nativ Ivrit (Expo SDK 57)...
if not exist node_modules (
  echo Instalando dependencias pela primeira vez, aguarde...
  call npm install
  call npx expo install --fix
)
call npx expo start --tunnel --clear
pause
