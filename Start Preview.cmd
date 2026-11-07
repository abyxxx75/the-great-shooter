@echo off
setlocal
cd /d "%~dp0"
title The Great Shooter - Local Preview
echo The Great Shooter preview: http://127.0.0.1:5173/
echo Starting or checking the background preview server...
echo.
set "PREVIEW_PYTHON=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
if exist "%PREVIEW_PYTHON%" (
  "%PREVIEW_PYTHON%" "%~dp0scripts\preview.py" start
) else (
  python "%~dp0scripts\preview.py" start
)
if errorlevel 1 (
  echo Could not start the preview. Details are in .preview\preview.log.
  pause
  exit /b 1
)
echo The preview is ready. You can close this window.
