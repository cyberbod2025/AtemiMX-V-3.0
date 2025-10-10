import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

const [, , envFileArg, ...rest] = process.argv;
const envFile = envFileArg?.endsWith('.env') ? envFileArg : '.env.test';
const commandArgs = envFileArg?.endsWith('.env') ? rest : [envFileArg, ...rest].filter(Boolean);

if (!commandArgs.length) {
  console.error('Debes indicar el comando a ejecutar, por ejemplo: node scripts/run-with-env.mjs .env.test vitest run');
  process.exit(1);
}

const envPath = resolve(process.cwd(), envFile);
let envVars = {};
try {
  const content = readFileSync(envPath, 'utf8');
  envVars = Object.fromEntries(
    content
      .split(/\r?\n/)
      .filter(Boolean)
      .filter(line => !line.trim().startsWith('#'))
      .map(line => line.split('='))
      .map(([key, ...value]) => [key.trim(), value.join('=').trim()])
  );
} catch (error) {
  console.warn(`No se pudo leer ${envFile}. Se usará el entorno actual.`);
}

const child = spawn(commandArgs[0], commandArgs.slice(1), {
  stdio: 'inherit',
  env: { ...process.env, ...envVars }
});

child.on('exit', (code) => {
  process.exit(code ?? 1);
});
