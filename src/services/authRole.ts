export type UserRole =
  | "docentes"
  | "prefectura"
  | "direccion"
  | "orientacion"
  | "tsocial"
  | "enfermeria"
  | "none";

const ROLE_CLASS_PREFIX = "rol-";

export function applyRoleTheme(role: UserRole): void {
  if (typeof document === "undefined") {
    return;
  }

  const body = document.body;
  body.className = "";
  body.classList.add(`${ROLE_CLASS_PREFIX}${role}`);
}

