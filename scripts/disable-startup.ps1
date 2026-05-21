$ErrorActionPreference = "Stop"

$shortcutName = "Jini Tasks.lnk"
$startupFolder = [Environment]::GetFolderPath("Startup")

if ([string]::IsNullOrWhiteSpace($startupFolder)) {
    throw "Could not resolve the Windows Startup folder."
}

$shortcutPath = Join-Path $startupFolder $shortcutName

if (Test-Path -LiteralPath $shortcutPath -PathType Leaf) {
    Remove-Item -LiteralPath $shortcutPath -Force
    Write-Host "Startup shortcut removed: $shortcutPath"
} else {
    Write-Host "Startup shortcut was not present: $shortcutPath"
}
