<#
  ------------------------------------------------------------
  Script de Validación Local – Auth 2.0 (AtemiMX v3.5)
  Autor: Profe Hugo Sánchez Reséndiz
  Objetivo: verificar reglas, roles y dependencias antes del deploy.
  ------------------------------------------------------------
#>

Write-Host "🧩 Iniciando validación local de Auth 2.0 (AtemiMX v3.5)..." -ForegroundColor Cyan

# 1️⃣ Validar dependencias instaladas
Write-Host "`nVerificando dependencias npm..."
npm list firebase @vitejs/plugin-react zod | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Dependencias faltantes o dañadas. Ejecuta: npm install" -ForegroundColor Red
  exit 1
} else {
  Write-Host "✅ Dependencias OK." -ForegroundColor Green
}

# 2️⃣ Comprobación de archivos clave
$files = @(
  "modules\sase310\firestore.rules",
  "modules\sase310\auth\components\AdminPanel.tsx",
  "modules\sase310\auth\hooks\useAuthAdmin.ts",
  "modules\sase310\auth\services\userService.ts"
)
$missing = $files | Where-Object { -not (Test-Path $_) }
if ($missing.Count -gt 0) {
  Write-Host "❌ Archivos faltantes:" -ForegroundColor Red
  $missing | ForEach-Object { Write-Host " - $_" -ForegroundColor Yellow }
  exit 1
} else {
  Write-Host "✅ Todos los archivos esenciales existen." -ForegroundColor Green
}

# 3️⃣ Validar sintaxis de reglas Firestore
Write-Host "`nVerificando reglas Firestore..."
$rulesContent = Get-Content "modules\sase310\firestore.rules" -Raw
if ($rulesContent -match "allow read: if request\.auth\.uid == uid") {
  Write-Host "✅ Reglas Firestore actualizadas correctamente." -ForegroundColor Green
} else {
  Write-Host "❌ Reglas Firestore NO actualizadas. Revisa el bloque 'allow read'." -ForegroundColor Red
  exit 1
}

# 4️⃣ Prueba de compilación Vite
Write-Host "`nEjecutando build de prueba..."
npm run build --silent
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Error en build de Vite. Corrige antes del despliegue." -ForegroundColor Red
  exit 1
} else {
  Write-Host "✅ Compilación exitosa." -ForegroundColor Green
}

# 5️⃣ Verificación de prefijo de commit
Write-Host "`nVerificando commits recientes..."
$log = git log -1 --pretty=%B
if ($log -match "ReviewPassed:") {
  Write-Host "✅ Commit con prefijo 'ReviewPassed:' detectado." -ForegroundColor Green
} else {
  Write-Host "⚠️ Último commit sin prefijo de revisión. Agrega 'ReviewPassed:' antes del deploy." -ForegroundColor Yellow
}

# 6️⃣ Resultado final
Write-Host "`n------------------------------------------------------------"
Write-Host "✅ Validación local completada. Listo para revisión y VoBo final."
Write-Host "------------------------------------------------------------`n" -ForegroundColor Cyan
