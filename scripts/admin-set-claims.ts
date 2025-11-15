import admin from "firebase-admin";
import { readFileSync } from "node:fs";

type CanonicalRole = "admin" | "teacher" | "prefect" | "guidance" | "medical" | "socialWork" | "clerk" | "pending";

type CliOptions = {
  emails: string[];
  canonicalRole: CanonicalRole;
  profileRole: string;
  autorizado: boolean;
  authorizedBy: string;
  dryRun: boolean;
  skipProfile: boolean;
};

const ROLE_ALIASES: Record<string, CanonicalRole> = {
  admin: "admin",
  administrador: "admin",
  administradora: "admin",
  direccion: "admin",
  director: "admin",
  directora: "admin",
  teacher: "teacher",
  teachers: "teacher",
  docente: "teacher",
  docentes: "teacher",
  profesor: "teacher",
  profesora: "teacher",
  prefect: "prefect",
  prefects: "prefect",
  prefecto: "prefect",
  prefecta: "prefect",
  prefectura: "prefect",
  guidance: "guidance",
  orientacion: "guidance",
  orientador: "guidance",
  orientadora: "guidance",
  medical: "medical",
  medico: "medical",
  medica: "medical",
  enfermeria: "medical",
  enfermero: "medical",
  enfermera: "medical",
  socialwork: "socialWork",
  social: "socialWork",
  trabajo_social: "socialWork",
  trabajadora: "socialWork",
  trabajadora_social: "socialWork",
  trabajadorsocial: "socialWork",
  tsocial: "socialWork",
  clerk: "clerk",
  secretaria: "clerk",
  secretario: "clerk",
  pending: "pending",
};

const VALID_ROLES: CanonicalRole[] = ["admin", "teacher", "prefect", "guidance", "medical", "socialWork", "clerk", "pending"];

const DEFAULT_AUTHORIZED_BY = "script:admin-set-claims";

function printUsage(): void {
  console.log(`Uso:
  npx ts-node --esm scripts/admin-set-claims.ts --email usuario@dominio.com --role direccion [opciones]

Opciones:
  --email, -e           Uno o más correos separados por coma o espacio.
  --role, -r            Rol a asignar (admin, teacher, prefect, guidance, medical, socialWork, clerk, pending). Valor por defecto: admin.
  --profile-role        Valor que se guardará en el campo Firestore "rol". Por omisión usa el mismo valor de --role.
  --autorizado          true | false. Controla el claim "autorizado". Valor por defecto: true.
  --authorized-by       Texto para registrar quién otorga los permisos. Por defecto: ${DEFAULT_AUTHORIZED_BY}.
  --skip-profile        Si se indica, no se actualizará la colección users/{uid}.
  --dry-run             Simula la operación sin escribir en Auth ni Firestore.
  --help, -h            Muestra esta ayuda.

Ejemplo:
  npx ts-node --esm scripts/admin-set-claims.ts -e direccion@institucion.mx --role direccion --authorized-by "Dirección Atemi"
`);
}

function canonicalRoleOrNull(value: string | null | undefined): CanonicalRole | null {
  if (!value) {
    return null;
  }
  const candidate = value.trim().toLowerCase();
  if (!candidate) {
    return null;
  }
  if (ROLE_ALIASES[candidate]) {
    return ROLE_ALIASES[candidate];
  }
  if ((VALID_ROLES as readonly string[]).includes(candidate)) {
    return candidate as CanonicalRole;
  }
  return null;
}

function resolveRole(input: string | undefined): CanonicalRole {
  const role = canonicalRoleOrNull(input ?? "admin");
  if (!role) {
    throw new Error(`Rol no reconocido: "${input ?? ""}". Usa uno de ${VALID_ROLES.join(", ")}.`);
  }
  return role;
}

function parseBoolean(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "y", "si", "sí"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "n"].includes(normalized)) {
    return false;
  }
  throw new Error(`Valor booleano inválido: "${value}". Usa true/false.`);
}

function parseEmailList(value: string): string[] {
  return value
    .split(/[,;\s]+/)
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 3 && email.includes("@"));
}

function parseArgs(argv: string[]): CliOptions {
  if (argv.length === 0) {
    printUsage();
    throw new Error("Debes proporcionar al menos un correo con --email.");
  }

  const state: {
    emails: string[];
    roleInput?: string;
    profileRoleInput?: string;
    autorizado?: boolean;
    authorizedBy?: string;
    dryRun?: boolean;
    skipProfile?: boolean;
  } = {
    emails: [],
  };

  const takeValue = (idx: number, tokens: string[], flag: string, inline?: string): { value: string; nextIndex: number } => {
    if (inline) {
      return { value: inline, nextIndex: idx };
    }
    if (idx + 1 >= tokens.length) {
      throw new Error(`La opción ${flag} requiere un valor.`);
    }
    return { value: tokens[idx + 1], nextIndex: idx + 1 };
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("-")) {
      throw new Error(`Opción desconocida: ${token}`);
    }

    const [flag, inlineValue] = token.split("=", 2);

    switch (flag) {
      case "--email":
      case "-e": {
        const { value, nextIndex } = takeValue(i, argv, flag, inlineValue);
        const emails = parseEmailList(value);
        if (emails.length === 0) {
          throw new Error("Proporciona al menos un correo válido en --email.");
        }
        state.emails.push(...emails);
        i = nextIndex;
        break;
      }
      case "--role":
      case "-r": {
        const { value, nextIndex } = takeValue(i, argv, flag, inlineValue);
        state.roleInput = value;
        i = nextIndex;
        break;
      }
      case "--profile-role": {
        const { value, nextIndex } = takeValue(i, argv, flag, inlineValue);
        state.profileRoleInput = value;
        i = nextIndex;
        break;
      }
      case "--autorizado": {
        const { value, nextIndex } = takeValue(i, argv, flag, inlineValue);
        state.autorizado = parseBoolean(value);
        i = nextIndex;
        break;
      }
      case "--authorized-by": {
        const { value, nextIndex } = takeValue(i, argv, flag, inlineValue);
        state.authorizedBy = value;
        i = nextIndex;
        break;
      }
      case "--skip-profile":
        state.skipProfile = true;
        break;
      case "--dry-run":
        state.dryRun = true;
        break;
      case "--help":
      case "-h":
        printUsage();
        process.exit(0);
        break;
      default:
        throw new Error(`Opción desconocida: ${flag}`);
    }
  }

  if (state.emails.length === 0) {
    throw new Error("No se proporcionaron correos. Usa --email para indicar al menos uno.");
  }

  const canonicalRole = resolveRole(state.roleInput);
  const profileRole = state.profileRoleInput ?? state.roleInput ?? canonicalRole;

  return {
    emails: Array.from(new Set(state.emails)),
    canonicalRole,
    profileRole,
    autorizado: state.autorizado ?? true,
    authorizedBy: state.authorizedBy?.trim() || DEFAULT_AUTHORIZED_BY,
    dryRun: state.dryRun ?? false,
    skipProfile: state.skipProfile ?? false,
  };
}

function resolveProjectId(): string | undefined {
  const directEnvCandidates = [
    process.env.GOOGLE_CLOUD_PROJECT,
    process.env.GCLOUD_PROJECT,
    process.env.FIREBASE_PROJECT_ID,
    process.env.GCP_PROJECT,
  ];
  for (const candidate of directEnvCandidates) {
    const trimmed = candidate?.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  const firebaseConfig = process.env.FIREBASE_CONFIG;
  if (firebaseConfig) {
    try {
      const parsedConfig = JSON.parse(firebaseConfig);
      if (typeof parsedConfig.projectId === "string" && parsedConfig.projectId.trim()) {
        return parsedConfig.projectId.trim();
      }
    } catch {
      // Ignorado: el contenido no era JSON válido.
    }
  }

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credentialsPath) {
    try {
      const raw = readFileSync(credentialsPath, "utf8");
      const json = JSON.parse(raw);
      if (typeof json.project_id === "string" && json.project_id.trim().length > 0) {
        return json.project_id;
      }
    } catch {
      // Se omite el error; se intentará continuar sin projectId.
    }
  }
  return undefined;
}

async function ensureFirebase(): Promise<void> {
  if (!admin.apps.length) {
    const appOptions: admin.AppOptions = {
      credential: admin.credential.applicationDefault(),
    };
    const projectId = resolveProjectId();
    if (projectId) {
      appOptions.projectId = projectId;
    }

    admin.initializeApp(appOptions);
  }
}

async function applyClaims(options: CliOptions): Promise<void> {
  await ensureFirebase();
  const auth = admin.auth();
  const db = admin.firestore();

  let successCount = 0;
  let failureCount = 0;

  console.log(`📋 Asignando claims:
  Correos: ${options.emails.join(", ")}
  Rol (claim): ${options.canonicalRole}
  Rol (perfil): ${options.profileRole}
  Autorizado: ${options.autorizado}
  Actualiza perfil: ${options.skipProfile ? "No" : "Sí"}
  Modo pruebas: ${options.dryRun ? "Sí" : "No"}
`);

  for (const email of options.emails) {
    console.log(`\n▶ Procesando ${email}...`);
    try {
      const user = await auth.getUserByEmail(email);
      console.log(`   UID detectado: ${user.uid}`);

      if (options.dryRun) {
        console.log(`   [dry-run] Claims asignados → { role: "${options.canonicalRole}", autorizado: ${options.autorizado} }`);
        if (!options.skipProfile) {
          console.log(`   [dry-run] Actualización Firestore → rol="${options.profileRole}"`);
        }
      } else {
        await auth.setCustomUserClaims(user.uid, {
          role: options.canonicalRole,
          autorizado: options.autorizado,
        });
        console.log("   ✅ Claims actualizados en Firebase Auth.");

        if (!options.skipProfile) {
          const now = admin.firestore.FieldValue.serverTimestamp();
          const profilePatch: Record<string, unknown> = {
            email: user.email ?? email,
            rol: options.profileRole,
            rolNormalizado: options.canonicalRole,
            autorizado: options.autorizado,
            claimsAsignadosEn: now,
            claimsAsignadosPor: options.authorizedBy,
            actualizadoEn: now,
          };

          if (options.autorizado) {
            profilePatch.autorizadoEn = now;
            profilePatch.autorizadoPor = options.authorizedBy;
          }

          await db.collection("users").doc(user.uid).set(profilePatch, { merge: true });
          console.log("   ✅ Perfil en Firestore sincronizado.");
        }
      }

      successCount += 1;
    } catch (error) {
      failureCount += 1;
      console.error(`   ❌ No se pudo actualizar ${email}:`, error);
    }
  }

  console.log("\nResumen:");
  console.log(`  ✅ Exitosos: ${successCount}`);
  console.log(`  ⚠️  Fallidos: ${failureCount}`);

  if (failureCount > 0) {
    throw new Error("Al menos un usuario no pudo actualizarse.");
  }
}

async function main(): Promise<void> {
  try {
    const options = parseArgs(process.argv.slice(2));
    await applyClaims(options);
  } catch (error) {
    console.error("\nError:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

void main();
