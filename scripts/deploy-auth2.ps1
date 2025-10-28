<#
  ------------------------------------------------------------
  Script de Validación + Despliegue – Auth 2.0 (AtemiMX v3.5)
  Autor: Profe Hugo Sánchez Reséndiz
  Propósito: Validar dependencias, seguridad y build antes de subir a Firebase Hosting.
  ------------------------------------------------------------
#>

Write-Host "🚀 Iniciando secuencia de validación y despliegue – AtemiMX v3.5 Auth 2.0" -ForegroundColor Cyan

# 🔧 Paso 1. Ejecutar validación local previa
$validationScript = "scripts\validate-auth2.ps1"

if (Test-Path $validationScript) {
  Write-Host "`n▶ Ejecutando validación local..." -ForegroundColor Yellow
  & $validationScript
  if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Validación fallida. Corrige los errores antes del deploy." -ForegroundColor Red
    exit 1
  }
} else {
  Write-Host "⚠️ No se encontró el script de validación local. Continuando bajo su responsabilidad." -ForegroundColor Yellow
}

# 🔐 Paso 2. Confirmar entorno Git limpio
Write-Host "`nVerificando estado de Git..."
$gitStatus = git status --porcelain
if ($gitStatus) {
  Write-Host "⚠️ Hay cambios sin commitear. Realiza commit antes del deploy." -ForegroundColor Yellow
  Write-Host "   Sugerido: git add . ; git commit -m '🔍 ReviewPassed: Auth2.0_AccessControl final'"
  exit 1
} else {
  Write-Host "✅ Repositorio limpio." -ForegroundColor Green
}

# 📦 Paso 3. Build de producción
Write-Host "`nConstruyendo build de producción con Vite..."
npm run build --silent
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Error en la compilación. Revisa el código antes del despliegue." -ForegroundColor Red
  exit 1
}
Write-Host "✅ Build exitoso." -ForegroundColor Green

# 🌐 Paso 4. Despliegue a Firebase Hosting
Write-Host "`nIniciando despliegue a Firebase Hosting..."
firebase deploy --only hosting
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Error en el despliegue. Verifica conexión o configuración de Firebase." -ForegroundColor Red
  exit 1
}

# ✅ Paso 5. Confirmación final
Write-Host "`n------------------------------------------------------------"
Write-Host "✅ Despliegue completo exitosamente."
Write-Host "📡 Revisa el Dashboard en tu hosting Firebase o localhost:5173/"
Write-Host "------------------------------------------------------------`n" -ForegroundColor Cyan
