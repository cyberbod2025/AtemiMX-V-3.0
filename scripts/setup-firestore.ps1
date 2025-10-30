<#
──────────────────────────────────────────────────────────────
🧠 SETUP FIRESTORE – AtemiMX v3.6 (Auditoría S-SDLC)
──────────────────────────────────────────────────────────────
1️⃣ Comprueba conexión y autenticación Firebase.
2️⃣ Ejecuta init-firestore.ps1 → crea las colecciones base.
3️⃣ Ejecuta validate-firestore.ps1 → valida documentos creados.
4️⃣ Registra toda la sesión en /logs con hora exacta.
──────────────────────────────────────────────────────────────
#>

$basePath = "C:\Users\HugoSYSTEM\Desktop\AtemiMX-V-3.0"
$scriptsPath = Join-Path $basePath "scripts"
$logPath = Join-Path $basePath "logs"
$projectVersion = "v3.6"

# Crear carpeta logs si no existe
if (-not (Test-Path $logPath)) {
    New-Item -ItemType Directory -Path $logPath | Out-Null
}

# Timestamp y log
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$logFile = Join-Path $logPath "firestore_setup_$timestamp.txt"

# Obtener hash de commit (si Git está disponible)
$commitHash = "No disponible (git CLI no detectada)"
if (Get-Command "git" -ErrorAction SilentlyContinue) {
    try {
        $resolvedHash = git -C $basePath rev-parse --short HEAD 2>$null
        if ($LASTEXITCODE -eq 0 -and $resolvedHash) {
            $commitHash = $resolvedHash.Trim()
        } else {
            $commitHash = "No disponible (git rev-parse falló)"
        }
    } catch {
        $commitHash = "No disponible (error al obtener hash)"
    }
}

# Encabezado
"──────────────────────────────────────────────────────" | Out-File $logFile
"🧾 LOG DE CONFIGURACIÓN FIRESTORE – $timestamp" | Out-File $logFile -Append
"──────────────────────────────────────────────────────" | Out-File $logFile -Append
"Ruta base: $basePath" | Out-File $logFile -Append
"Usuario: $env:USERNAME" | Out-File $logFile -Append
"Versión AtemiMX: $projectVersion" | Out-File $logFile -Append
"Hash de commit: $commitHash" | Out-File $logFile -Append
"──────────────────────────────────────────────────────" | Out-File $logFile -Append

Write-Host "🚀 Iniciando configuración Firestore (AtemiMX $projectVersion)..." -ForegroundColor Cyan
Write-Host "Commit actual: $commitHash" -ForegroundColor Cyan
Write-Host "El log se guardará en: $logFile" -ForegroundColor Yellow

# 🔎 1️⃣ Verificar conexión a Internet
Write-Host "`n🌐 Verificando conexión de red..." -ForegroundColor Cyan
"🌐 Verificando conexión de red..." | Out-File $logFile -Append
if (Test-Connection -ComputerName "google.com" -Count 1 -Quiet) {
    Write-Host "✅ Conexión activa a Internet detectada." -ForegroundColor Green
    "✅ Conexión activa a Internet detectada." | Out-File $logFile -Append
} else {
    Write-Host "⚠️ Sin conexión a Internet. Aborta inicialización." -ForegroundColor Red
    "⚠️ Sin conexión a Internet." | Out-File $logFile -Append
    exit 1
}

# 🔧 2️⃣ Verificar instalación y versión de Firebase CLI
Write-Host "`n🧩 Verificando Firebase CLI..." -ForegroundColor Cyan
"🧩 Verificando Firebase CLI..." | Out-File $logFile -Append

if (Get-Command "firebase" -ErrorAction SilentlyContinue) {
    $firebaseVersion = (firebase --version).Trim()
    Write-Host "✅ Firebase CLI detectada (v$firebaseVersion)" -ForegroundColor Green
    "✅ Firebase CLI detectada (v$firebaseVersion)" | Out-File $logFile -Append
} else {
    Write-Host "❌ Firebase CLI no detectada. Instálala con: npm install -g firebase-tools" -ForegroundColor Red
    "❌ Firebase CLI no detectada." | Out-File $logFile -Append
    exit 1
}

# 🔐 3️⃣ Comprobar autenticación activa
Write-Host "`n🔐 Verificando sesión activa de Firebase..." -ForegroundColor Cyan
"🔐 Verificando sesión activa de Firebase..." | Out-File $logFile -Append

$loginStatus = firebase login:list | Out-String
if ($loginStatus -match "@") {
    $activeAccounts = ($loginStatus | Select-String -Pattern "@").Line.Trim()
    Write-Host "✅ Sesión activa detectada: $activeAccounts" -ForegroundColor Green
    "✅ Sesión activa detectada: $loginStatus" | Out-File $logFile -Append
} else {
    Write-Host "⚠️ No hay sesión activa. Inicia sesión con: firebase login" -ForegroundColor Yellow
    "⚠️ No hay sesión activa." | Out-File $logFile -Append
    exit 1
}

# 🧱 4️⃣ Inicialización base
try {
    Write-Host "`n🧱 [1/2] Inicializando estructura Firestore..." -ForegroundColor Cyan
    & (Join-Path $scriptsPath "init-firestore.ps1") | Tee-Object -FilePath $logFile -Append
} catch {
    Write-Host "❌ Error durante init-firestore.ps1" -ForegroundColor Red
    "❌ Error durante init-firestore.ps1" | Out-File $logFile -Append
    exit 1
}

# 🔍 5️⃣ Validación
try {
    Write-Host "`n🔍 [2/2] Validando documentos Firestore..." -ForegroundColor Cyan
    & (Join-Path $scriptsPath "validate-firestore.ps1") | Tee-Object -FilePath $logFile -Append
} catch {
    Write-Host "⚠️ Error al validar Firestore." -ForegroundColor Red
    "⚠️ Error durante validate-firestore.ps1" | Out-File $logFile -Append
}

# 🏁 Finalización
Write-Host "`n✅ Configuración Firestore completada exitosamente." -ForegroundColor Green
"✅ Configuración Firestore completada exitosamente." | Out-File $logFile -Append
"──────────────────────────────────────────────────────" | Out-File $logFile -Append
