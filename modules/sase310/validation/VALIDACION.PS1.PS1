# =====================================================
# 🔍 Validación de Integridad – Auth 2.0 / AtemiMX v3.5
# Autor: Profe Hugo Sánchez Reséndiz
# Objetivo: Confirmar que las reglas Firestore, roles y hooks
# funcionan correctamente antes del despliegue.
# =====================================================

Write-Host "🧩 Iniciando validación local de Auth 2.0 (AtemiMX v3.5)..." -ForegroundColor Cyan

# 1️⃣ Verificar estructura de archivos
$paths = @(
    "modules\sase310\auth\components\LoginForm.tsx",
    "modules\sase310\auth\components\RegisterForm.tsx",
    "modules\sase310\auth\components\AdminPanel.tsx",
    "modules\sase310\auth\hooks\useAuthAdmin.ts",
    "modules\sase310\auth\services\userService.ts",
    "modules\sase310\firestore.rules"
)

$missing = @()
foreach ($path in $paths) {
    if (-not (Test-Path $path)) {
        $missing += $path
    }
}

if ($missing.Count -gt 0) {
    Write-Host "⚠️ Archivos faltantes detectados:" -ForegroundColor Yellow
    $missing | ForEach-Object { Write-Host " - $_" }
} else {
    Write-Host "✅ Todos los archivos requeridos están presentes." -ForegroundColor Green
}

# 2️⃣ Verificar palabra clave de seguridad en firestore.rules
$rulesContent = Get-Content "modules\sase310\firestore.rules" -Raw
if ($rulesContent -match "request\.auth\.uid == uid") {
    Write-Host "✅ Reglas Firestore corregidas detectadas." -ForegroundColor Green
} else {
    Write-Host "❌ Reglas Firestore NO corregidas. Revise 'allow read'." -ForegroundColor Red
}

# 3️⃣ Validar presencia de selector de roles en AdminPanel.tsx
$adminContent = Get-Content "modules\sase310\auth\components\AdminPanel.tsx" -Raw
