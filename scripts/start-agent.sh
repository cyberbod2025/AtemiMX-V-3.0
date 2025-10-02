#!/usr/bin/env bash
set -euo pipefail

REPO="${REPO:-$(pwd)}"
cd "$REPO"

echo "== Start (modo seguro, sin modificar repo) =="

# Silenciar configs viejas de npm y evitar package-lock
npm config delete proxy || true
npm config delete https-proxy || true
npm config set package-lock false

# pnpm estable, sin mutar lock
corepack enable || true
pnpm -v >/dev/null
pnpm config set registry https://registry.npmjs.org/ >/dev/null

# Instalar solo si hay lock de pnpm (sin scripts)
if [[ -f pnpm-lock.yaml ]]; then
  pnpm install --frozen-lockfile --ignore-scripts
else
  echo "No hay pnpm-lock.yaml → no instalo para no mutar el repo."
fi

# Verificar que el repo sigue limpio
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Repo sucio. Aborto para no chocar con el agente."
  git status -sb
  exit 1
fi

# Build si existe script
if pnpm -s run | grep -qE '^\s+build'; then
  pnpm -s build
else
  echo "No hay script build."
fi

# Tests y Storybook por dlx (no persiste deps)
if pnpm -s run | grep -qE '^\s+test'; then
  pnpm -s test || true
else
  echo "Sin script test → dlx vitest:"
  pnpm dlx vitest@latest run || true
fi

if pnpm -s run | grep -qE '^\s+storybook'; then
  pnpm -s storybook || true
else
  echo "Sin script storybook → dlx storybook build:"
  pnpm dlx @storybook/cli@latest build || true
fi

echo "== Listo (repo intacto) =="
