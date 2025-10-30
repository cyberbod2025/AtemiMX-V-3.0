Write-Host "🔍 Validando estructura UI AtemiMX v3.6..."

$hasAppShell = Test-Path "ui/AppShell.tsx"
$hasSplashScreen = Test-Path "ui/SplashScreen.tsx"

if ($hasAppShell -and $hasSplashScreen) {
  Write-Host "✅ Componentes principales detectados."
} else {
  Write-Host "❌ Faltan componentes obligatorios (AppShell o SplashScreen)."
  if (-not $hasAppShell) {
    Write-Host "   · Falta ui/AppShell.tsx"
  }
  if (-not $hasSplashScreen) {
    Write-Host "   · Falta ui/SplashScreen.tsx"
  }
}
