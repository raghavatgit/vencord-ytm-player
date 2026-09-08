<#
.SYNOPSIS
    1-Click Installer for Vencord YouTube Music Player Plugin on Windows
.DESCRIPTION
    Detects your Vencord directory, installs/updates the plugin in src/userplugins/youtubeMusicPlayer,
    and prompts to rebuild Vencord.
#>

$ErrorActionPreference = "Stop"
Write-Host "==========================================================" -ForegroundColor Red
Write-Host "  YouTube Music Player for Vencord — Installer" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Red

# Potential Vencord installation locations
$candidatePaths = @(
    "$env:USERPROFILE\Documents\Vencord",
    "$env:APPDATA\Vencord",
    "$env:LOCALAPPDATA\Vencord",
    "$PWD\Vencord"
)

$vencordPath = $null
foreach ($path in $candidatePaths) {
    if ((Test-Path "$path\package.json") -and (Test-Path "$path\src")) {
        $vencordPath = $path
        break
    }
}

if (-not $vencordPath) {
    Write-Host "Could not automatically detect your Vencord source directory." -ForegroundColor Yellow
    $vencordPath = Read-Host "Please enter the full path to your cloned Vencord repository"
    if (-not ((Test-Path "$vencordPath\package.json") -and (Test-Path "$vencordPath\src"))) {
        Write-Error "Invalid Vencord directory. Ensure package.json and src/ exist."
        exit 1
    }
}

Write-Host "[+] Found Vencord at: $vencordPath" -ForegroundColor Green

$userpluginsDir = Join-Path $vencordPath "src\userplugins"
if (-not (Test-Path $userpluginsDir)) {
    New-Item -ItemType Directory -Path $userpluginsDir -Force | Out-Null
}

$targetDir = Join-Path $userpluginsDir "youtubeMusicPlayer"
$repoUrl = "https://github.com/raghavatgit/vencord-ytm-player.git"

if (Test-Path "$targetDir\.git") {
    Write-Host "[*] Updating existing plugin installation..." -ForegroundColor Cyan
    git -C "$targetDir" pull --rebase
} elseif (Test-Path $targetDir) {
    Write-Host "[*] Refreshing plugin files in: $targetDir" -ForegroundColor Cyan
    git clone $repoUrl "$targetDir-tmp"
    Copy-Item -Path "$targetDir-tmp\*" -Destination $targetDir -Recurse -Force
    Remove-Item -Path "$targetDir-tmp" -Recurse -Force
} else {
    Write-Host "[*] Cloning plugin into $targetDir..." -ForegroundColor Cyan
    git clone $repoUrl $targetDir
}

Write-Host "[✓] Plugin installed successfully!" -ForegroundColor Green
Write-Host ""
$build = Read-Host "Would you like to rebuild Vencord now? (Y/n)"
if ($build -ne "n" -and $build -ne "N") {
    Write-Host "[*] Building Vencord with pnpm..." -ForegroundColor Yellow
    Push-Location $vencordPath
    try {
        pnpm build
        Write-Host "[✓] Build complete! Restart Discord to see the player." -ForegroundColor Green
    } catch {
        Write-Host "[!] Failed to run 'pnpm build'. Please run it manually inside: $vencordPath" -ForegroundColor Yellow
    } finally {
        Pop-Location
    }
} else {
    Write-Host "Remember to run 'pnpm build' inside $vencordPath and restart Discord." -ForegroundColor Cyan
}
