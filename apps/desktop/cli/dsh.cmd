@echo off
rem The executable name is the product name from apps/desktop/scripts/desktop-product-identity.mjs,
rem which electron-builder also reads; keep the two in sync when the product name changes.
setlocal DisableDelayedExpansion
set "ELECTRON_RUN_AS_NODE=1"
"%~dp0..\..\..\..\Fanyu harness.exe" --expose-internals "%~dp0..\..\..\app.asar\dsh\node_modules\@deepseek-ai\dsh-desktop-host\lib\cli.js" %*
exit /b %errorlevel%
