$ErrorActionPreference = "Stop"

$shortcutName = "Jini Tasks.lnk"
$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$startupFolder = [Environment]::GetFolderPath("Startup")

if ([string]::IsNullOrWhiteSpace($startupFolder)) {
    throw "Could not resolve the Windows Startup folder."
}

$shortcutPath = Join-Path $startupFolder $shortcutName
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)

$shortcut.TargetPath = "$env:ComSpec"
$shortcut.Arguments = "/c ""cd /d """"$projectRoot"""" && npm.cmd run dev"""
$shortcut.WorkingDirectory = $projectRoot
$shortcut.WindowStyle = 7
$shortcut.Description = "Launch Jini Tasks on login"
$shortcut.Save()

Write-Host "Startup shortcut enabled: $shortcutPath"
