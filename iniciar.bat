@echo off
title AquaChile - Servidor
cd /d "%~dp0frontend"

where node >nul 2>nul
if errorlevel 1 goto sin_node

if not exist "node_modules" goto sin_instalar
if not exist ".env" goto sin_env

echo ============================================
echo   AquaChile - Iniciando el sistema
echo   Se abrira el navegador en http://localhost:5173
echo   Para apagarlo, cierra esta ventana o pulsa Ctrl+C.
echo ============================================
echo.
call npm run dev -- --open
pause
exit /b 0

:sin_node
echo Node.js no esta instalado. Ejecuta primero instalar.bat.
pause
exit /b 1

:sin_instalar
echo Faltan las dependencias. Ejecuta primero instalar.bat.
pause
exit /b 1

:sin_env
echo Falta el archivo frontend\.env con las claves de Supabase. Ejecuta primero instalar.bat.
pause
exit /b 1
