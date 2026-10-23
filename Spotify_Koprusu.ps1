$Host.UI.RawUI.WindowTitle = "Spotify Windows GSMTC Koprusu"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$scriptDir\SpotifyBridge"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "🎵 Spotify Windows GSMTC Koprusu Baslatiliyor..." -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Cyan

dotnet run -c Release --no-build
Read-Host "Kapatmak icin Enter tusuna basin"
