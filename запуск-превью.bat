@echo off
setlocal
title NLB Bootstrap - превью сайта

rem Локальный показ дизайна без Битрикса: раздаёт папку preview/ на 127.0.0.1:8791.
rem Пути только относительные (%~dp0) - батник работает из любой папки.
rem Файл сохранён в кодировке CP866: правьте его только в редакторе с этой кодировкой,
rem иначе русский текст в консоли превратится в мусор.

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"
set "PORT=8791"
set "URL=http://127.0.0.1:%PORT%/"

if not exist "%ROOT%\preview\index.html" goto :nopreview

php -v >nul 2>&1
if not errorlevel 1 set "SERVER=php"

if not defined SERVER (
    python --version >nul 2>&1
    if not errorlevel 1 set "SERVER=python"
)
if not defined SERVER (
    py -3 --version >nul 2>&1
    if not errorlevel 1 set "SERVER=py"
)

netstat -ano | findstr /r /c:":%PORT% .*LISTENING" >nul 2>&1
if not errorlevel 1 set "BUSY=1"

if /i "%~1"=="check" goto :check
if not defined SERVER goto :noserver

echo.
echo   NLB Bootstrap - превью сайта без Битрикса
echo   -----------------------------------------
echo   Корень : %ROOT%
echo   Порт   : %PORT%
echo   Сервер : %SERVER%
echo.

if defined BUSY goto :busy

if "%SERVER%"=="php" goto :runphp
if "%SERVER%"=="python" goto :runpython
goto :runpy

:runphp
echo   Запуск: php -S 127.0.0.1:%PORT% -t preview
echo   Остановить: Ctrl+C в этом окне.
echo.
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process '%URL%'"
php -S 127.0.0.1:%PORT% -t "%ROOT%\preview"
goto :end

:runpython
echo   Запуск: python -m http.server %PORT% --directory preview
echo   Остановить: Ctrl+C в этом окне.
echo.
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process '%URL%'"
python -m http.server %PORT% --bind 127.0.0.1 --directory "%ROOT%\preview"
goto :end

:runpy
echo   Запуск: py -3 -m http.server %PORT% --directory preview
echo   Остановить: Ctrl+C в этом окне.
echo.
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process '%URL%'"
py -3 -m http.server %PORT% --bind 127.0.0.1 --directory "%ROOT%\preview"
goto :end

:busy
echo   Порт %PORT% уже занят - сервер, похоже, запущен.
echo   Открываю %URL%
echo   Если это чужой процесс, закройте его или поменяйте PORT в этом файле.
echo.
start "" "%URL%"
goto :end

:nopreview
echo.
echo   [ОШИБКА] Не найден файл preview\index.html
echo   Положите этот .bat в корень репозитория nlb_bootstrap
echo   (рядом с папкой preview) и запустите снова.
echo.
pause
exit /b 1

:noserver
echo.
echo   [ОШИБКА] Не найден ни PHP, ни Python.
echo   Поставьте PHP 8+ (php.net/downloads) или Python 3 (python.org/downloads)
echo   и добавьте его в PATH. Без сервера страницы превью не откроются:
echo   по file:// ломаются ссылки на /news/, /books/ и остальные разделы.
echo.
pause
exit /b 1

:check
echo ROOT=%ROOT%
echo PORT=%PORT%
echo SERVER=%SERVER%
if defined BUSY echo PORT_BUSY=1
if not defined BUSY echo PORT_BUSY=0
echo PREVIEW=%ROOT%\preview\index.html
goto :end

:end
endlocal
exit /b 0
