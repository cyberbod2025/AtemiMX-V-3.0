Write-Host "🚀 Desplegando AtemiMX UI v3.6 (Shell iDoceo)..."

npm run build
firebase deploy --only hosting
