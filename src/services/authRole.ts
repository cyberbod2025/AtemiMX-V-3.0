const KNOWN_ROLES = new Set(["docentes", "prefectura", "direccion", "orientacion", "tsocial", "enfermeria"]);
const BODY_ROLE_PREFIX = "rol-";

function clearRoleClasses(target: HTMLElement) {
  [...target.classList]
    .filter((className) => className.startsWith(BODY_ROLE_PREFIX))
    .forEach((className) => target.classList.remove(className));
}

export function applyRoleTheme(role: string | null | undefined) {
  if (typeof document === "undefined") {
    return;
  }

  const normalized = (role ?? "").toLowerCase();
  const body = document.body;

  clearRoleClasses(body);

  if (KNOWN_ROLES.has(normalized)) {
    body.classList.add(`${BODY_ROLE_PREFIX}${normalized}`);
  }
}

