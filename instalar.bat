@echo off
title AquaChile - Instalacion
cd /d "%~dp0frontend"

echo ============================================
echo   AquaChile - Instalacion del proyecto
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 goto sin_node

echo [1/3] Node.js encontrado:
node --version
echo.

echo [2/3] Instalando dependencias (puede tardar unos minutos)...
call npm install
if errorlevel 1 goto error_npm
echo.

echo [3/3] Revisando el archivo .env...
if exist ".env" goto env_listo
copy ".env.example" ".env" >nul
echo Se creo frontend\.env a partir de .env.example.
echo Completa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (Supabase ^> Project Settings ^> API).
echo Guarda el archivo y cierra el Bloc de notas para continuar.
start /wait notepad ".env"
goto fin

:env_listo
echo El archivo .env ya existe, no se modifica.
goto fin

:sin_node
echo Node.js no esta instalado en este equipo.
where winget >nul 2>nul
if errorlevel 1 goto sin_winget
echo Instalando Node.js LTS con winget...
winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
echo.
echo Listo. CIERRA esta ventana y vuelve a ejecutar instalar.bat para que Windows reconozca Node.js.
pause
exit /b 0

:sin_winget
echo Descarga e instala Node.js LTS desde https://nodejs.org y luego vuelve a ejecutar instalar.bat.
pause
exit /b 1

:error_npm
echo.
echo Fallo la instalacion de dependencias. Revisa tu conexion a internet y vuelve a intentarlo.
pause
exit /b 1

:fin
echo.
echo ============================================
echo   Instalacion terminada.
echo   Ahora ejecuta iniciar.bat para abrir el sistema.
echo ============================================
pause
