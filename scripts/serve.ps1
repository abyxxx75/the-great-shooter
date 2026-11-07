# Compatibility entry point: both launchers use the same preview server.
$projectRoot = Split-Path -Parent $PSScriptRoot
$previewPython = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
if (-not (Test-Path -LiteralPath $previewPython)) {
    $previewPython = (Get-Command python -ErrorAction Stop).Source
}
& $previewPython (Join-Path $projectRoot 'scripts\preview.py') start
if ($LASTEXITCODE -ne 0) {
    throw 'Preview startup failed. See .preview\preview.log.'
}
